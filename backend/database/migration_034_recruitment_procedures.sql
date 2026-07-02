-- =====================================================================
-- Migration 034 Part 2: Recruitment Stored Procedures
-- =====================================================================
-- Naming convention: sp_rec_<entity>_<action>
-- All procedures:
--   - Use transactions where data integrity requires it
--   - Write to rec_audit_log
--   - Return structured result sets for pagination
--   - SIGNAL SQLSTATE on business rule violations
-- =====================================================================

USE hrms_db;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────
-- UTILITIES
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_next_code $$
CREATE PROCEDURE sp_rec_next_code(
  IN  p_prefix     VARCHAR(5),
  IN  p_table      VARCHAR(100),
  IN  p_col        VARCHAR(100),
  OUT p_code       VARCHAR(20)
)
BEGIN
  DECLARE v_max INT DEFAULT 0;
  SET @sql = CONCAT('SELECT COALESCE(MAX(CAST(SUBSTRING(',p_col,',', LENGTH(p_prefix)+1,') AS UNSIGNED)),0) INTO @mx FROM ',p_table);
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  SET v_max = @mx;
  SET p_code = CONCAT(p_prefix, LPAD(v_max + 1, 3, '0'));
END $$

DROP PROCEDURE IF EXISTS sp_rec_audit $$
CREATE PROCEDURE sp_rec_audit(
  IN p_entity_type  VARCHAR(50),
  IN p_entity_id    INT,
  IN p_action       VARCHAR(50),
  IN p_old_value    JSON,
  IN p_new_value    JSON,
  IN p_user_id      INT,
  IN p_ip           VARCHAR(45),
  IN p_ua           VARCHAR(500)
)
BEGIN
  INSERT INTO rec_audit_log
    (entity_type, entity_id, action, old_value, new_value, performed_by, ip_address, user_agent)
  VALUES
    (p_entity_type, p_entity_id, p_action, p_old_value, p_new_value, p_user_id, p_ip, p_ua);
END $$

-- ─────────────────────────────────────────────────────────────────────
-- JOB REQUESTS
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_create_job_request $$
CREATE PROCEDURE sp_rec_create_job_request(
  IN  p_title             VARCHAR(200),
  IN  p_client            VARCHAR(200),
  IN  p_company_dept      VARCHAR(200),
  IN  p_bill_rate         DECIMAL(12,2),
  IN  p_bill_currency     VARCHAR(10),
  IN  p_pay_rate          DECIMAL(12,2),
  IN  p_pay_currency      VARCHAR(10),
  IN  p_position_type     VARCHAR(30),
  IN  p_vacancies         SMALLINT,
  IN  p_city              VARCHAR(100),
  IN  p_country           VARCHAR(100),
  IN  p_experience_level  VARCHAR(50),
  IN  p_job_status        VARCHAR(20),
  IN  p_business_unit     VARCHAR(100),
  IN  p_assignment_status VARCHAR(20),
  IN  p_opportunity_phone VARCHAR(50),
  IN  p_skill_set         TEXT,
  IN  p_description       TEXT,
  IN  p_created_by        INT,
  IN  p_ip                VARCHAR(45),
  OUT p_job_req_id        INT,
  OUT p_job_req_code      VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  -- Validate role: only user_id with role 1, 4 may create
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_created_by AND role_id IN (1,4)) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient permissions to create job request';
  END IF;

  START TRANSACTION;

    CALL sp_rec_next_code('JOB', 'rec_job_requests', 'job_req_code', v_code);

    INSERT INTO rec_job_requests (
      job_req_code, title, client, company_dept,
      bill_rate, bill_currency, pay_rate, pay_currency,
      position_type, vacancies, city, country,
      experience_level, job_status, business_unit,
      assignment_status, opportunity_phone, skill_set, description,
      created_by
    ) VALUES (
      v_code, p_title, p_client, p_company_dept,
      p_bill_rate, COALESCE(p_bill_currency,'$'), p_pay_rate, COALESCE(p_pay_currency,'$'),
      p_position_type, COALESCE(p_vacancies,1), p_city, p_country,
      p_experience_level, COALESCE(p_job_status,'Active'), p_business_unit,
      COALESCE(p_assignment_status,'Open'), p_opportunity_phone, p_skill_set, p_description,
      p_created_by
    );

    SET p_job_req_id   = LAST_INSERT_ID();
    SET p_job_req_code = v_code;

    CALL sp_rec_audit('job_request', p_job_req_id, 'created', NULL,
      JSON_OBJECT('code', v_code, 'title', p_title, 'client', p_client),
      p_created_by, p_ip, NULL);

  COMMIT;

  SELECT j.*,
         CONCAT(e.first_name,' ',e.last_name) AS created_by_name
  FROM   rec_job_requests j
  JOIN   users u ON u.user_id = j.created_by
  JOIN   employees e ON e.employee_id = u.employee_id
  WHERE  j.job_req_id = p_job_req_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_list_job_requests $$
CREATE PROCEDURE sp_rec_list_job_requests(
  IN p_assignment_status VARCHAR(20),
  IN p_job_status        VARCHAR(20),
  IN p_search            VARCHAR(200),
  IN p_role_id           INT,
  IN p_recruiter_emp_id  INT,
  IN p_limit             INT,
  IN p_offset            INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  -- Result set 1: rows
  SELECT SQL_CALC_FOUND_ROWS
         j.job_req_id, j.job_req_code, j.title, j.client, j.company_dept,
         j.bill_rate, j.bill_currency, j.pay_rate, j.pay_currency,
         j.position_type, j.vacancies, j.city, j.country,
         j.experience_level, j.job_status, j.business_unit,
         j.assignment_status, j.skill_set, j.description,
         j.created_at, j.updated_at,
         CONCAT(e.first_name,' ',e.last_name) AS created_by_name,
         (SELECT COUNT(*) FROM rec_candidates c WHERE c.job_req_id = j.job_req_id AND c.deleted_at IS NULL) AS total_candidates,
         (SELECT GROUP_CONCAT(CONCAT(re.first_name,' ',re.last_name) SEPARATOR ', ')
          FROM   rec_job_recruiters jr
          JOIN   employees re ON re.employee_id = jr.recruiter_id
          WHERE  jr.job_req_id = j.job_req_id) AS assigned_recruiters
  FROM   rec_job_requests j
  JOIN   users u  ON u.user_id      = j.created_by
  JOIN   employees e ON e.employee_id = u.employee_id
  WHERE  j.deleted_at IS NULL
    AND  (p_assignment_status IS NULL OR j.assignment_status = p_assignment_status)
    AND  (p_job_status        IS NULL OR j.job_status        = p_job_status)
    AND  (p_search IS NULL OR j.title LIKE CONCAT('%',p_search,'%')
                           OR j.client LIKE CONCAT('%',p_search,'%')
                           OR j.job_req_code LIKE CONCAT('%',p_search,'%'))
    -- Recruiter (role 5) sees only assigned jobs
    AND  (p_role_id != 5 OR EXISTS (
            SELECT 1 FROM rec_job_recruiters jr2
            WHERE jr2.job_req_id = j.job_req_id AND jr2.recruiter_id = p_recruiter_emp_id
         ))
  ORDER BY j.created_at DESC
  LIMIT  p_limit OFFSET p_offset;

  -- Result set 2: total count
  SELECT FOUND_ROWS() AS total;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_job_request $$
CREATE PROCEDURE sp_rec_get_job_request(IN p_job_req_id INT)
BEGIN
  SELECT j.*,
         CONCAT(e.first_name,' ',e.last_name) AS created_by_name,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'employee_id', jr.recruiter_id,
            'name', CONCAT(re.first_name,' ',re.last_name),
            'email', re.email
          ))
          FROM rec_job_recruiters jr
          JOIN employees re ON re.employee_id = jr.recruiter_id
          WHERE jr.job_req_id = j.job_req_id) AS recruiters
  FROM   rec_job_requests j
  JOIN   users u  ON u.user_id      = j.created_by
  JOIN   employees e ON e.employee_id = u.employee_id
  WHERE  j.job_req_id = p_job_req_id AND j.deleted_at IS NULL;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_update_job_request $$
CREATE PROCEDURE sp_rec_update_job_request(
  IN p_job_req_id         INT,
  IN p_title              VARCHAR(200),
  IN p_client             VARCHAR(200),
  IN p_company_dept       VARCHAR(200),
  IN p_bill_rate          DECIMAL(12,2),
  IN p_bill_currency      VARCHAR(10),
  IN p_pay_rate           DECIMAL(12,2),
  IN p_pay_currency       VARCHAR(10),
  IN p_position_type      VARCHAR(30),
  IN p_vacancies          SMALLINT,
  IN p_city               VARCHAR(100),
  IN p_country            VARCHAR(100),
  IN p_experience_level   VARCHAR(50),
  IN p_job_status         VARCHAR(20),
  IN p_business_unit      VARCHAR(100),
  IN p_assignment_status  VARCHAR(20),
  IN p_opportunity_phone  VARCHAR(50),
  IN p_skill_set          TEXT,
  IN p_description        TEXT,
  IN p_updated_by         INT,
  IN p_ip                 VARCHAR(45)
)
BEGIN
  DECLARE v_old JSON;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_job_requests WHERE job_req_id = p_job_req_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Job request not found';
  END IF;

  SELECT JSON_OBJECT('title', title,'assignment_status', assignment_status) INTO v_old
  FROM   rec_job_requests WHERE job_req_id = p_job_req_id;

  START TRANSACTION;
    UPDATE rec_job_requests SET
      title             = COALESCE(p_title,            title),
      client            = COALESCE(p_client,           client),
      company_dept      = COALESCE(p_company_dept,     company_dept),
      bill_rate         = COALESCE(p_bill_rate,        bill_rate),
      bill_currency     = COALESCE(p_bill_currency,    bill_currency),
      pay_rate          = COALESCE(p_pay_rate,         pay_rate),
      pay_currency      = COALESCE(p_pay_currency,     pay_currency),
      position_type     = COALESCE(p_position_type,    position_type),
      vacancies         = COALESCE(p_vacancies,        vacancies),
      city              = COALESCE(p_city,             city),
      country           = COALESCE(p_country,          country),
      experience_level  = COALESCE(p_experience_level, experience_level),
      job_status        = COALESCE(p_job_status,       job_status),
      business_unit     = COALESCE(p_business_unit,    business_unit),
      assignment_status = COALESCE(p_assignment_status,assignment_status),
      opportunity_phone = COALESCE(p_opportunity_phone,opportunity_phone),
      skill_set         = COALESCE(p_skill_set,        skill_set),
      description       = COALESCE(p_description,      description),
      updated_by        = p_updated_by
    WHERE job_req_id = p_job_req_id;

    CALL sp_rec_audit('job_request', p_job_req_id, 'updated',
      v_old, JSON_OBJECT('title', p_title,'assignment_status', p_assignment_status),
      p_updated_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_job_request(p_job_req_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_assign_recruiters $$
CREATE PROCEDURE sp_rec_assign_recruiters(
  IN p_job_req_id      INT,
  IN p_recruiter_ids   JSON,
  IN p_assigned_by     INT,
  IN p_ip              VARCHAR(45)
)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE v_count INT;
  DECLARE v_emp_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_job_requests WHERE job_req_id = p_job_req_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Job request not found';
  END IF;

  SET v_count = JSON_LENGTH(p_recruiter_ids);

  START TRANSACTION;
    -- Clear existing assignments first
    DELETE FROM rec_job_recruiters WHERE job_req_id = p_job_req_id;

    -- Insert new assignments
    WHILE i < v_count DO
      SET v_emp_id = JSON_UNQUOTE(JSON_EXTRACT(p_recruiter_ids, CONCAT('$[',i,']')));
      INSERT INTO rec_job_recruiters (job_req_id, recruiter_id, assigned_by)
      VALUES (p_job_req_id, v_emp_id, p_assigned_by);
      SET i = i + 1;
    END WHILE;

    CALL sp_rec_audit('job_request', p_job_req_id, 'recruiters_assigned',
      NULL, p_recruiter_ids, p_assigned_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_job_request(p_job_req_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_delete_job_request $$
CREATE PROCEDURE sp_rec_delete_job_request(
  IN p_job_req_id INT,
  IN p_deleted_by INT,
  IN p_ip         VARCHAR(45)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rec_job_requests WHERE job_req_id = p_job_req_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Job request not found';
  END IF;

  IF EXISTS (SELECT 1 FROM rec_candidates WHERE job_req_id = p_job_req_id AND deleted_at IS NULL LIMIT 1) THEN
    SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'Cannot delete job request with active candidates';
  END IF;

  UPDATE rec_job_requests SET deleted_at = NOW(), updated_by = p_deleted_by WHERE job_req_id = p_job_req_id;
  CALL sp_rec_audit('job_request', p_job_req_id, 'deleted', NULL, NULL, p_deleted_by, p_ip, NULL);
  SELECT ROW_COUNT() AS affected;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- CANDIDATES
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_create_candidate $$
CREATE PROCEDURE sp_rec_create_candidate(
  IN  p_job_req_id             INT,
  IN  p_name                   VARCHAR(200),
  IN  p_email                  VARCHAR(200),
  IN  p_mobile                 VARCHAR(20),
  IN  p_gender                 VARCHAR(10),
  IN  p_total_experience       DECIMAL(5,1),
  IN  p_relevant_experience    DECIMAL(5,1),
  IN  p_current_ctc            DECIMAL(15,2),
  IN  p_expected_ctc           DECIMAL(15,2),
  IN  p_notice_period_serving  TINYINT(1),
  IN  p_last_working_day       DATE,
  IN  p_skill_set              TEXT,
  IN  p_source                 VARCHAR(100),
  IN  p_pin_code               VARCHAR(10),
  IN  p_city                   VARCHAR(100),
  IN  p_state                  VARCHAR(100),
  IN  p_district               VARCHAR(100),
  IN  p_recruiter_id           INT,
  IN  p_created_by             INT,
  IN  p_ip                     VARCHAR(45),
  OUT p_candidate_id           INT,
  OUT p_candidate_code         VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_job_requests WHERE job_req_id = p_job_req_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Job request not found or inactive';
  END IF;

  START TRANSACTION;
    CALL sp_rec_next_code('CAN', 'rec_candidates', 'candidate_code', v_code);

    INSERT INTO rec_candidates (
      candidate_code, job_req_id, name, email, mobile, gender,
      total_experience, relevant_experience, current_ctc, expected_ctc,
      notice_period_serving, last_working_day, skill_set, source,
      pin_code, city, state, district, recruiter_id,
      status, created_by
    ) VALUES (
      v_code, p_job_req_id, p_name, p_email, p_mobile, p_gender,
      COALESCE(p_total_experience,0), COALESCE(p_relevant_experience,0),
      COALESCE(p_current_ctc,0), COALESCE(p_expected_ctc,0),
      COALESCE(p_notice_period_serving,0), p_last_working_day,
      p_skill_set, p_source, p_pin_code, p_city, p_state, p_district,
      p_recruiter_id, 'Work in Progress', p_created_by
    );

    SET p_candidate_id   = LAST_INSERT_ID();
    SET p_candidate_code = v_code;

    CALL sp_rec_audit('candidate', p_candidate_id, 'created',
      NULL, JSON_OBJECT('code', v_code, 'name', p_name, 'job_req_id', p_job_req_id),
      p_created_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_candidate(p_candidate_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_list_candidates $$
CREATE PROCEDURE sp_rec_list_candidates(
  IN p_job_req_id   INT,
  IN p_status       VARCHAR(50),
  IN p_recruiter_id INT,
  IN p_search       VARCHAR(200),
  IN p_role_id      INT,
  IN p_rec_emp_id   INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  SELECT SQL_CALC_FOUND_ROWS
         c.candidate_id, c.candidate_code, c.job_req_id, c.name, c.email,
         c.mobile, c.gender, c.total_experience, c.relevant_experience,
         c.current_ctc, c.expected_ctc, c.notice_period_serving,
         c.last_working_day, c.skill_set, c.source, c.city, c.state,
         c.status, c.recruiter_id, c.resume_path, c.created_at, c.updated_at,
         j.title AS job_title, j.client AS job_client, j.job_req_code,
         CONCAT(re.first_name,' ',re.last_name) AS recruiter_name
  FROM   rec_candidates c
  JOIN   rec_job_requests j ON j.job_req_id = c.job_req_id
  JOIN   employees re ON re.employee_id = c.recruiter_id
  WHERE  c.deleted_at IS NULL
    AND  (p_job_req_id   IS NULL OR c.job_req_id   = p_job_req_id)
    AND  (p_status       IS NULL OR c.status        = p_status)
    AND  (p_recruiter_id IS NULL OR c.recruiter_id  = p_recruiter_id)
    AND  (p_search IS NULL OR c.name  LIKE CONCAT('%',p_search,'%')
                           OR c.email LIKE CONCAT('%',p_search,'%')
                           OR c.candidate_code LIKE CONCAT('%',p_search,'%'))
    -- Recruiter sees only their own candidates
    AND  (p_role_id != 5 OR c.recruiter_id = p_rec_emp_id)
  ORDER BY c.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_candidate $$
CREATE PROCEDURE sp_rec_get_candidate(IN p_candidate_id INT)
BEGIN
  SELECT c.*,
         j.title AS job_title, j.client AS job_client, j.job_req_code,
         CONCAT(re.first_name,' ',re.last_name) AS recruiter_name,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'interview_id', iv.interview_id, 'interview_code', iv.interview_code,
            'level', iv.level, 'status', iv.status, 'interview_date', iv.interview_date,
            'feedback_status', iv.feedback_status, 'shortlisted', iv.shortlisted
          )) FROM rec_interviews iv WHERE iv.candidate_id = c.candidate_id
         ) AS interviews
  FROM   rec_candidates c
  JOIN   rec_job_requests j ON j.job_req_id = c.job_req_id
  JOIN   employees re ON re.employee_id = c.recruiter_id
  WHERE  c.candidate_id = p_candidate_id AND c.deleted_at IS NULL;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_update_candidate_status $$
CREATE PROCEDURE sp_rec_update_candidate_status(
  IN p_candidate_id INT,
  IN p_status       VARCHAR(50),
  IN p_updated_by   INT,
  IN p_ip           VARCHAR(45)
)
BEGIN
  DECLARE v_old_status VARCHAR(50);

  IF NOT EXISTS (SELECT 1 FROM rec_candidates WHERE candidate_id = p_candidate_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  SELECT status INTO v_old_status FROM rec_candidates WHERE candidate_id = p_candidate_id;

  UPDATE rec_candidates SET status = p_status, updated_by = p_updated_by
  WHERE  candidate_id = p_candidate_id;

  CALL sp_rec_audit('candidate', p_candidate_id, 'status_changed',
    JSON_OBJECT('status', v_old_status),
    JSON_OBJECT('status', p_status),
    p_updated_by, p_ip, NULL);

  SELECT candidate_id, candidate_code, name, status FROM rec_candidates WHERE candidate_id = p_candidate_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- INTERVIEWS
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_schedule_interview $$
CREATE PROCEDURE sp_rec_schedule_interview(
  IN  p_candidate_id      INT,
  IN  p_job_req_id        INT,
  IN  p_level             VARCHAR(30),
  IN  p_interview_type    VARCHAR(30),
  IN  p_interview_date    DATE,
  IN  p_interview_time    TIME,
  IN  p_interviewer       VARCHAR(200),
  IN  p_teams_subject     VARCHAR(500),
  IN  p_teams_participants TEXT,
  IN  p_teams_start       DATETIME,
  IN  p_teams_end         DATETIME,
  IN  p_scheduled_by      INT,
  IN  p_ip                VARCHAR(45),
  OUT p_interview_id      INT,
  OUT p_interview_code    VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_candidates WHERE candidate_id = p_candidate_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  -- Warn if candidate already has a Scheduled interview at same level
  IF EXISTS (
    SELECT 1 FROM rec_interviews
    WHERE candidate_id = p_candidate_id AND level = p_level AND status = 'Scheduled'
  ) THEN
    SIGNAL SQLSTATE '45003' SET MESSAGE_TEXT = 'An active interview already exists for this candidate at this level';
  END IF;

  START TRANSACTION;
    CALL sp_rec_next_code('INT', 'rec_interviews', 'interview_code', v_code);

    INSERT INTO rec_interviews (
      interview_code, candidate_id, job_req_id, level, interview_type,
      interview_date, interview_time, interviewer,
      teams_subject, teams_participants, teams_start, teams_end,
      status, scheduled_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_level, p_interview_type,
      p_interview_date, p_interview_time, p_interviewer,
      p_teams_subject, p_teams_participants, p_teams_start, p_teams_end,
      'Scheduled', p_scheduled_by
    );

    SET p_interview_id   = LAST_INSERT_ID();
    SET p_interview_code = v_code;

    -- Update candidate status
    UPDATE rec_candidates SET status = 'Schedule Interview', updated_by = p_scheduled_by
    WHERE  candidate_id = p_candidate_id;

    CALL sp_rec_audit('interview', p_interview_id, 'scheduled',
      NULL, JSON_OBJECT('code', v_code, 'level', p_level, 'date', p_interview_date),
      p_scheduled_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_interview(p_interview_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_list_interviews $$
CREATE PROCEDURE sp_rec_list_interviews(
  IN p_candidate_id INT,
  IN p_job_req_id   INT,
  IN p_level        VARCHAR(30),
  IN p_status       VARCHAR(20),
  IN p_search       VARCHAR(200),
  IN p_role_id      INT,
  IN p_rec_emp_id   INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  SELECT SQL_CALC_FOUND_ROWS
         iv.interview_id, iv.interview_code, iv.candidate_id, iv.job_req_id,
         iv.level, iv.interview_type, iv.interview_date, iv.interview_time,
         iv.interviewer, iv.status, iv.feedback_status, iv.feedback_comments,
         iv.shortlisted, iv.teams_subject, iv.scheduled_by, iv.created_at,
         c.name AS candidate_name, c.email AS candidate_email,
         c.candidate_code, c.recruiter_id,
         j.title AS job_title, j.job_req_code
  FROM   rec_interviews iv
  JOIN   rec_candidates c ON c.candidate_id = iv.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id = iv.job_req_id
  WHERE  (p_candidate_id IS NULL OR iv.candidate_id = p_candidate_id)
    AND  (p_job_req_id   IS NULL OR iv.job_req_id   = p_job_req_id)
    AND  (p_level        IS NULL OR iv.level         = p_level)
    AND  (p_status       IS NULL OR iv.status        = p_status)
    AND  (p_search IS NULL OR c.name LIKE CONCAT('%',p_search,'%')
                           OR iv.interview_code LIKE CONCAT('%',p_search,'%'))
    AND  (p_role_id != 5 OR c.recruiter_id = p_rec_emp_id)
  ORDER BY iv.interview_date DESC, iv.interview_time DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_interview $$
CREATE PROCEDURE sp_rec_get_interview(IN p_interview_id INT)
BEGIN
  SELECT iv.*,
         c.name AS candidate_name, c.email AS candidate_email,
         c.candidate_code, c.mobile AS candidate_mobile,
         j.title AS job_title, j.client AS job_client, j.job_req_code,
         CONCAT(eu.first_name,' ',eu.last_name) AS scheduled_by_name
  FROM   rec_interviews iv
  JOIN   rec_candidates c ON c.candidate_id = iv.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id = iv.job_req_id
  JOIN   users su ON su.user_id = iv.scheduled_by
  JOIN   employees eu ON eu.employee_id = su.employee_id
  WHERE  iv.interview_id = p_interview_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_submit_feedback $$
CREATE PROCEDURE sp_rec_submit_feedback(
  IN p_interview_id       INT,
  IN p_feedback_status    VARCHAR(20),
  IN p_feedback_comments  TEXT,
  IN p_shortlisted        TINYINT(1),
  IN p_submitted_by       INT,
  IN p_ip                 VARCHAR(45)
)
BEGIN
  DECLARE v_cand_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id AND status = 'Scheduled') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found or already completed';
  END IF;

  SELECT candidate_id INTO v_cand_id FROM rec_interviews WHERE interview_id = p_interview_id;

  START TRANSACTION;
    UPDATE rec_interviews SET
      feedback_status   = p_feedback_status,
      feedback_comments = p_feedback_comments,
      shortlisted       = COALESCE(p_shortlisted, 0),
      status            = 'Completed',
      feedback_by       = p_submitted_by
    WHERE interview_id = p_interview_id;

    -- Update candidate status if shortlisted
    IF p_shortlisted = 1 THEN
      UPDATE rec_candidates SET status = 'Shortlisted', updated_by = p_submitted_by
      WHERE candidate_id = v_cand_id;
    END IF;

    CALL sp_rec_audit('interview', p_interview_id, 'feedback_submitted',
      NULL, JSON_OBJECT('feedback_status', p_feedback_status, 'shortlisted', p_shortlisted),
      p_submitted_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_interview(p_interview_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_cancel_interview $$
CREATE PROCEDURE sp_rec_cancel_interview(
  IN p_interview_id INT,
  IN p_cancelled_by INT,
  IN p_ip           VARCHAR(45)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id AND status = 'Scheduled') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found or not in Scheduled state';
  END IF;
  UPDATE rec_interviews SET status = 'Cancelled' WHERE interview_id = p_interview_id;
  CALL sp_rec_audit('interview', p_interview_id, 'cancelled', NULL, NULL, p_cancelled_by, p_ip, NULL);
  SELECT ROW_COUNT() AS affected;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- OFFERS
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_create_offer $$
CREATE PROCEDURE sp_rec_create_offer(
  IN  p_candidate_id        INT,
  IN  p_job_req_id          INT,
  IN  p_designation         VARCHAR(200),
  IN  p_date_of_joining     DATE,
  IN  p_basic               DECIMAL(15,2),
  IN  p_hra                 DECIMAL(15,2),
  IN  p_telephone_allowance DECIMAL(15,2),
  IN  p_special_allowance   DECIMAL(15,2),
  IN  p_gross_salary        DECIMAL(15,2),
  IN  p_pf_contribution     DECIMAL(15,2),
  IN  p_statutory_bonus     DECIMAL(15,2),
  IN  p_gratuity            DECIMAL(15,2),
  IN  p_esi                 DECIMAL(15,2),
  IN  p_ctc                 DECIMAL(15,2),
  IN  p_ctc_in_words        VARCHAR(500),
  IN  p_created_by          INT,
  IN  p_ip                  VARCHAR(45),
  OUT p_offer_id            INT,
  OUT p_offer_code          VARCHAR(20)
)
BEGIN
  DECLARE v_code VARCHAR(20);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_candidates WHERE candidate_id = p_candidate_id AND deleted_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  IF EXISTS (SELECT 1 FROM rec_offers WHERE candidate_id = p_candidate_id AND status NOT IN ('Rejected')) THEN
    SIGNAL SQLSTATE '45004' SET MESSAGE_TEXT = 'An active offer already exists for this candidate';
  END IF;

  START TRANSACTION;
    CALL sp_rec_next_code('OFR', 'rec_offers', 'offer_code', v_code);

    INSERT INTO rec_offers (
      offer_code, candidate_id, job_req_id, designation, date_of_joining,
      basic, hra, telephone_allowance, special_allowance, gross_salary,
      pf_contribution, statutory_bonus, gratuity, esi, ctc, ctc_in_words,
      status, created_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_designation, p_date_of_joining,
      p_basic, p_hra, p_telephone_allowance, p_special_allowance, p_gross_salary,
      p_pf_contribution, p_statutory_bonus, p_gratuity, p_esi, p_ctc, p_ctc_in_words,
      'Draft', p_created_by
    );

    SET p_offer_id   = LAST_INSERT_ID();
    SET p_offer_code = v_code;

    UPDATE rec_candidates SET status = 'Offer Released', updated_by = p_created_by
    WHERE candidate_id = p_candidate_id;

    CALL sp_rec_audit('offer', p_offer_id, 'created',
      NULL, JSON_OBJECT('code', v_code, 'ctc', p_ctc, 'candidate_id', p_candidate_id),
      p_created_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_offer(p_offer_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_list_offers $$
CREATE PROCEDURE sp_rec_list_offers(
  IN p_status  VARCHAR(20),
  IN p_search  VARCHAR(200),
  IN p_limit   INT,
  IN p_offset  INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  SELECT SQL_CALC_FOUND_ROWS
         o.offer_id, o.offer_code, o.candidate_id, o.job_req_id,
         o.designation, o.date_of_joining, o.ctc, o.ctc_in_words,
         o.status, o.released_at, o.responded_at, o.created_at,
         c.name AS candidate_name, c.candidate_code,
         j.title AS job_title, j.job_req_code, j.client
  FROM   rec_offers o
  JOIN   rec_candidates c ON c.candidate_id = o.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id = o.job_req_id
  WHERE  (p_status IS NULL OR o.status = p_status)
    AND  (p_search IS NULL OR c.name LIKE CONCAT('%',p_search,'%')
                           OR o.offer_code LIKE CONCAT('%',p_search,'%'))
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_offer $$
CREATE PROCEDURE sp_rec_get_offer(IN p_offer_id INT)
BEGIN
  SELECT o.*,
         c.name AS candidate_name, c.email AS candidate_email,
         c.candidate_code, c.mobile AS candidate_mobile,
         j.title AS job_title, j.client AS job_client, j.job_req_code,
         CONCAT(eu.first_name,' ',eu.last_name) AS created_by_name
  FROM   rec_offers o
  JOIN   rec_candidates c ON c.candidate_id = o.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id = o.job_req_id
  JOIN   users cu ON cu.user_id = o.created_by
  JOIN   employees eu ON eu.employee_id = cu.employee_id
  WHERE  o.offer_id = p_offer_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_release_offer $$
CREATE PROCEDURE sp_rec_release_offer(
  IN p_offer_id    INT,
  IN p_released_by INT,
  IN p_ip          VARCHAR(45)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rec_offers WHERE offer_id = p_offer_id AND status = 'Draft') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Offer not found or already released';
  END IF;
  UPDATE rec_offers SET status = 'Released', released_at = NOW() WHERE offer_id = p_offer_id;
  CALL sp_rec_audit('offer', p_offer_id, 'released', NULL, NULL, p_released_by, p_ip, NULL);
  CALL sp_rec_get_offer(p_offer_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_respond_offer $$
CREATE PROCEDURE sp_rec_respond_offer(
  IN p_offer_id      INT,
  IN p_response      VARCHAR(10),
  IN p_responded_by  INT,
  IN p_ip            VARCHAR(45)
)
BEGIN
  DECLARE v_cand_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF p_response NOT IN ('Accepted','Rejected') THEN
    SIGNAL SQLSTATE '45005' SET MESSAGE_TEXT = 'Response must be Accepted or Rejected';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM rec_offers WHERE offer_id = p_offer_id AND status = 'Released') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Offer not found or not in Released state';
  END IF;

  SELECT candidate_id INTO v_cand_id FROM rec_offers WHERE offer_id = p_offer_id;

  START TRANSACTION;
    UPDATE rec_offers SET status = p_response, responded_at = NOW() WHERE offer_id = p_offer_id;

    UPDATE rec_candidates SET
      status = IF(p_response = 'Accepted', 'Offer Accepted', 'Offer Rejected'),
      updated_by = p_responded_by
    WHERE candidate_id = v_cand_id;

    CALL sp_rec_audit('offer', p_offer_id, LOWER(p_response),
      NULL, JSON_OBJECT('response', p_response), p_responded_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_offer(p_offer_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
-- ONBOARDING
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_create_onboarding $$
CREATE PROCEDURE sp_rec_create_onboarding(
  IN  p_candidate_id   INT,
  IN  p_offer_id       INT,
  IN  p_effective_date DATE,
  IN  p_created_by     INT,
  IN  p_ip             VARCHAR(45),
  OUT p_onboarding_id  INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF NOT EXISTS (SELECT 1 FROM rec_offers WHERE offer_id = p_offer_id AND status = 'Accepted') THEN
    SIGNAL SQLSTATE '45006' SET MESSAGE_TEXT = 'Offer must be Accepted before creating onboarding';
  END IF;

  IF EXISTS (SELECT 1 FROM rec_onboarding WHERE candidate_id = p_candidate_id) THEN
    SIGNAL SQLSTATE '45007' SET MESSAGE_TEXT = 'Onboarding record already exists for this candidate';
  END IF;

  START TRANSACTION;
    INSERT INTO rec_onboarding (candidate_id, offer_id, effective_date, created_by)
    VALUES (p_candidate_id, p_offer_id, p_effective_date, p_created_by);

    SET p_onboarding_id = LAST_INSERT_ID();

    UPDATE rec_candidates SET status = 'Joining Formalities', updated_by = p_created_by
    WHERE candidate_id = p_candidate_id;

    CALL sp_rec_audit('onboarding', p_onboarding_id, 'created',
      NULL, JSON_OBJECT('candidate_id', p_candidate_id, 'effective_date', p_effective_date),
      p_created_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_onboarding(p_onboarding_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_list_onboarding $$
CREATE PROCEDURE sp_rec_list_onboarding(
  IN p_status  VARCHAR(50),
  IN p_search  VARCHAR(200),
  IN p_limit   INT,
  IN p_offset  INT
)
BEGIN
  SET p_limit  = COALESCE(p_limit, 20);
  SET p_offset = COALESCE(p_offset, 0);

  SELECT SQL_CALC_FOUND_ROWS
         ob.onboarding_id, ob.candidate_id, ob.offer_id, ob.effective_date,
         ob.current_status, ob.employee_info_submitted, ob.photo_uploaded,
         ob.joining_formalities, ob.hr_verified, ob.finalized_at, ob.created_at,
         c.name AS candidate_name, c.candidate_code,
         j.title AS job_title, j.job_req_code
  FROM   rec_onboarding ob
  JOIN   rec_candidates c ON c.candidate_id = ob.candidate_id
  JOIN   rec_offers o ON o.offer_id = ob.offer_id
  JOIN   rec_job_requests j ON j.job_req_id = o.job_req_id
  WHERE  (p_status IS NULL OR ob.current_status = p_status)
    AND  (p_search IS NULL OR c.name LIKE CONCAT('%',p_search,'%'))
  ORDER BY ob.created_at DESC
  LIMIT p_limit OFFSET p_offset;

  SELECT FOUND_ROWS() AS total;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_onboarding $$
CREATE PROCEDURE sp_rec_get_onboarding(IN p_onboarding_id INT)
BEGIN
  SELECT ob.*,
         c.name AS candidate_name, c.email AS candidate_email,
         c.candidate_code, c.mobile AS candidate_mobile,
         o.designation, o.ctc, o.ctc_in_words, o.date_of_joining,
         j.title AS job_title, j.client, j.job_req_code
  FROM   rec_onboarding ob
  JOIN   rec_candidates c ON c.candidate_id = ob.candidate_id
  JOIN   rec_offers o ON o.offer_id = ob.offer_id
  JOIN   rec_job_requests j ON j.job_req_id = o.job_req_id
  WHERE  ob.onboarding_id = p_onboarding_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_update_onboarding_task $$
CREATE PROCEDURE sp_rec_update_onboarding_task(
  IN p_onboarding_id INT,
  IN p_task_name     VARCHAR(100),
  IN p_task_value    VARCHAR(50),
  IN p_updated_by    INT,
  IN p_ip            VARCHAR(45)
)
BEGIN
  DECLARE v_old JSON;

  IF NOT EXISTS (SELECT 1 FROM rec_onboarding WHERE onboarding_id = p_onboarding_id AND finalized_at IS NULL) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Onboarding record not found or already finalized';
  END IF;

  SELECT JSON_OBJECT(p_task_name, employee_info_submitted) INTO v_old
  FROM rec_onboarding WHERE onboarding_id = p_onboarding_id;

  CASE p_task_name
    WHEN 'employee_info_submitted' THEN UPDATE rec_onboarding SET employee_info_submitted = (p_task_value = '1' OR p_task_value = 'true') WHERE onboarding_id = p_onboarding_id;
    WHEN 'photo_uploaded'          THEN UPDATE rec_onboarding SET photo_uploaded          = (p_task_value = '1' OR p_task_value = 'true') WHERE onboarding_id = p_onboarding_id;
    WHEN 'joining_formalities'     THEN UPDATE rec_onboarding SET joining_formalities     = p_task_value WHERE onboarding_id = p_onboarding_id;
    WHEN 'team_life_insurance'     THEN UPDATE rec_onboarding SET team_life_insurance     = p_task_value WHERE onboarding_id = p_onboarding_id;
    WHEN 'gratuity_nomination'     THEN UPDATE rec_onboarding SET gratuity_nomination     = p_task_value WHERE onboarding_id = p_onboarding_id;
    WHEN 'insurance_nomination'    THEN UPDATE rec_onboarding SET insurance_nomination    = p_task_value WHERE onboarding_id = p_onboarding_id;
    WHEN 'pf_declaration'          THEN UPDATE rec_onboarding SET pf_declaration          = p_task_value WHERE onboarding_id = p_onboarding_id;
    WHEN 'hr_verified'             THEN UPDATE rec_onboarding SET hr_verified             = (p_task_value = '1' OR p_task_value = 'true') WHERE onboarding_id = p_onboarding_id;
    ELSE SIGNAL SQLSTATE '45008' SET MESSAGE_TEXT = 'Unknown onboarding task name';
  END CASE;

  UPDATE rec_onboarding SET updated_by = p_updated_by WHERE onboarding_id = p_onboarding_id;

  CALL sp_rec_audit('onboarding', p_onboarding_id, 'task_updated',
    v_old, JSON_OBJECT(p_task_name, p_task_value), p_updated_by, p_ip, NULL);

  CALL sp_rec_get_onboarding(p_onboarding_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_finalize_onboarding $$
CREATE PROCEDURE sp_rec_finalize_onboarding(
  IN p_onboarding_id INT,
  IN p_finalized_by  INT,
  IN p_ip            VARCHAR(45)
)
BEGIN
  DECLARE v_cand_id INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  SELECT candidate_id INTO v_cand_id FROM rec_onboarding
  WHERE onboarding_id = p_onboarding_id AND finalized_at IS NULL;

  IF v_cand_id IS NULL THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Onboarding record not found or already finalized';
  END IF;

  START TRANSACTION;
    UPDATE rec_onboarding SET
      current_status = 'Completed', finalized_at = NOW(), updated_by = p_finalized_by
    WHERE onboarding_id = p_onboarding_id;

    UPDATE rec_candidates SET status = 'Onboarded', updated_by = p_finalized_by
    WHERE candidate_id = v_cand_id;

    CALL sp_rec_audit('onboarding', p_onboarding_id, 'finalized',
      NULL, JSON_OBJECT('finalized_by', p_finalized_by), p_finalized_by, p_ip, NULL);
  COMMIT;

  CALL sp_rec_get_onboarding(p_onboarding_id);
END $$

-- ─────────────────────────────────────────────────────────────────────
-- DASHBOARD & REPORTS
-- ─────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_admin_dashboard $$
CREATE PROCEDURE sp_rec_admin_dashboard()
BEGIN
  -- Stat cards
  SELECT
    (SELECT COUNT(*) FROM rec_job_requests WHERE deleted_at IS NULL)                                     AS total_jobs,
    (SELECT COUNT(*) FROM rec_job_requests WHERE assignment_status = 'Open' AND deleted_at IS NULL)      AS open_jobs,
    (SELECT COUNT(*) FROM rec_candidates  WHERE deleted_at IS NULL)                                     AS total_candidates,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Schedule Interview' AND deleted_at IS NULL)    AS in_interview,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Shortlisted'        AND deleted_at IS NULL)    AS shortlisted,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Released')                                     AS offers_pending,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Accepted')                                     AS offers_accepted,
    (SELECT COUNT(*) FROM rec_onboarding  WHERE current_status != 'Completed')                           AS active_onboarding;

  -- Candidate pipeline by status
  SELECT status, COUNT(*) AS count
  FROM   rec_candidates WHERE deleted_at IS NULL
  GROUP BY status ORDER BY count DESC;

  -- Recruiter performance (last 30 days)
  SELECT CONCAT(e.first_name,' ',e.last_name) AS recruiter,
         COUNT(c.candidate_id)                AS candidates_added,
         SUM(iv.cnt)                          AS interviews_scheduled,
         SUM(ol.cnt)                          AS offers_created
  FROM   employees e
  JOIN   users u ON u.employee_id = e.employee_id AND u.role_id = 5
  LEFT JOIN rec_candidates c ON c.recruiter_id = e.employee_id
    AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  LEFT JOIN (SELECT iv2.scheduled_by, COUNT(*) cnt FROM rec_interviews iv2
             WHERE iv2.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY iv2.scheduled_by) iv ON iv.scheduled_by = u.user_id
  LEFT JOIN (SELECT o.created_by, COUNT(*) cnt FROM rec_offers o
             WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY o.created_by) ol ON ol.created_by = u.user_id
  GROUP BY e.employee_id, e.first_name, e.last_name;

  -- Recent job requests (last 5)
  SELECT job_req_id, job_req_code, title, client, assignment_status, created_at
  FROM   rec_job_requests WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_recruiter_dashboard $$
CREATE PROCEDURE sp_rec_recruiter_dashboard(IN p_recruiter_emp_id INT)
BEGIN
  -- My stats
  SELECT
    (SELECT COUNT(*) FROM rec_candidates  WHERE recruiter_id = p_recruiter_emp_id AND deleted_at IS NULL)                        AS my_candidates,
    (SELECT COUNT(*) FROM rec_candidates  WHERE recruiter_id = p_recruiter_emp_id AND status = 'Schedule Interview' AND deleted_at IS NULL) AS my_in_interview,
    (SELECT COUNT(*) FROM rec_candidates  WHERE recruiter_id = p_recruiter_emp_id AND status = 'Shortlisted' AND deleted_at IS NULL)        AS my_shortlisted,
    (SELECT COUNT(*) FROM rec_job_recruiters jr
     JOIN rec_job_requests j ON j.job_req_id = jr.job_req_id AND j.deleted_at IS NULL
     WHERE jr.recruiter_id = p_recruiter_emp_id AND j.assignment_status = 'Open')                                                 AS my_open_jobs;

  -- My assigned jobs
  SELECT j.job_req_id, j.job_req_code, j.title, j.client, j.assignment_status,
         (SELECT COUNT(*) FROM rec_candidates c WHERE c.job_req_id = j.job_req_id
          AND c.recruiter_id = p_recruiter_emp_id AND c.deleted_at IS NULL) AS my_candidates
  FROM   rec_job_requests j
  JOIN   rec_job_recruiters jr ON jr.job_req_id = j.job_req_id AND jr.recruiter_id = p_recruiter_emp_id
  WHERE  j.deleted_at IS NULL AND j.assignment_status = 'Open'
  ORDER BY j.created_at DESC LIMIT 10;

  -- Upcoming interviews (next 7 days)
  SELECT iv.interview_id, iv.interview_code, iv.level, iv.interview_type,
         iv.interview_date, iv.interview_time, iv.interviewer, iv.status,
         c.name AS candidate_name, c.candidate_code
  FROM   rec_interviews iv
  JOIN   rec_candidates c ON c.candidate_id = iv.candidate_id AND c.recruiter_id = p_recruiter_emp_id
  WHERE  iv.status = 'Scheduled'
    AND  iv.interview_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  ORDER BY iv.interview_date ASC, iv.interview_time ASC;
END $$

-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_pipeline_report $$
CREATE PROCEDURE sp_rec_pipeline_report(
  IN p_from_date    DATE,
  IN p_to_date      DATE,
  IN p_recruiter_id INT
)
BEGIN
  SET p_from_date = COALESCE(p_from_date, DATE_SUB(CURDATE(), INTERVAL 90 DAY));
  SET p_to_date   = COALESCE(p_to_date,   CURDATE());

  -- Funnel by status
  SELECT status, COUNT(*) AS count
  FROM   rec_candidates
  WHERE  deleted_at IS NULL
    AND  created_at BETWEEN p_from_date AND DATE_ADD(p_to_date, INTERVAL 1 DAY)
    AND  (p_recruiter_id IS NULL OR recruiter_id = p_recruiter_id)
  GROUP BY status;

  -- Time to hire (avg days from candidate created to offer accepted)
  SELECT AVG(DATEDIFF(o.responded_at, c.created_at)) AS avg_days_to_hire,
         MIN(DATEDIFF(o.responded_at, c.created_at)) AS min_days,
         MAX(DATEDIFF(o.responded_at, c.created_at)) AS max_days
  FROM   rec_offers o
  JOIN   rec_candidates c ON c.candidate_id = o.candidate_id
  WHERE  o.status = 'Accepted'
    AND  c.created_at BETWEEN p_from_date AND DATE_ADD(p_to_date, INTERVAL 1 DAY)
    AND  (p_recruiter_id IS NULL OR c.recruiter_id = p_recruiter_id);

  -- Source breakdown
  SELECT source, COUNT(*) AS count,
         SUM(IF(status = 'Onboarded',1,0)) AS converted
  FROM   rec_candidates
  WHERE  deleted_at IS NULL
    AND  created_at BETWEEN p_from_date AND DATE_ADD(p_to_date, INTERVAL 1 DAY)
    AND  (p_recruiter_id IS NULL OR recruiter_id = p_recruiter_id)
  GROUP BY source ORDER BY count DESC;
END $$

DELIMITER ;

SELECT 'Migration 034 — recruitment stored procedures created.' AS status;
