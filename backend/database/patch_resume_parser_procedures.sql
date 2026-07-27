-- =====================================================================
-- Patch: Resume Parser Stored Procedures
-- =====================================================================
-- Run AFTER migration_039_resume_parser_tables.sql
-- Naming convention: sp_rec_<entity>_<action>
-- =====================================================================

USE hrms_db;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_log_parser
-- Inserts one row into rec_resume_parser_logs.
-- Returns the new log_id.
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_log_parser $$
CREATE PROCEDURE sp_rec_log_parser(
  IN  p_candidate_id    INT,
  IN  p_filename        VARCHAR(500),
  IN  p_file_size_bytes INT,
  IN  p_mime_type       VARCHAR(100),
  IN  p_parsed_by       VARCHAR(20),
  IN  p_status          VARCHAR(20),
  IN  p_error_message   TEXT,
  IN  p_raw_text_length INT,
  IN  p_fields_found    JSON,
  IN  p_duration_ms     INT,
  OUT p_log_id          INT
)
BEGIN
  INSERT INTO rec_resume_parser_logs
    (candidate_id, filename, file_size_bytes, mime_type,
     parsed_by, status, error_message, raw_text_length,
     fields_found, duration_ms)
  VALUES
    (p_candidate_id, p_filename, p_file_size_bytes, p_mime_type,
     p_parsed_by, p_status, p_error_message, p_raw_text_length,
     p_fields_found, p_duration_ms);

  SET p_log_id = LAST_INSERT_ID();
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_check_duplicate_candidate
-- Returns existing candidate rows matching email OR resume_hash.
-- Callers decide whether to block or warn.
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_check_duplicate_candidate $$
CREATE PROCEDURE sp_rec_check_duplicate_candidate(
  IN p_email       VARCHAR(200),
  IN p_resume_hash CHAR(64)
)
BEGIN
  SELECT
    c.candidate_id,
    c.candidate_code,
    c.name,
    c.email,
    c.resume_hash,
    c.job_req_id,
    j.title          AS job_title,
    c.status,
    c.created_at,
    CASE
      WHEN c.email       = p_email       THEN 'email'
      WHEN c.resume_hash = p_resume_hash THEN 'resume_hash'
      ELSE 'unknown'
    END AS match_reason
  FROM rec_candidates c
  JOIN rec_job_requests j ON j.job_req_id = c.job_req_id
  WHERE c.deleted_at IS NULL
    AND (
      (p_email       IS NOT NULL AND p_email       <> '' AND c.email       = p_email)
      OR
      (p_resume_hash IS NOT NULL AND p_resume_hash <> '' AND c.resume_hash = p_resume_hash)
    )
  ORDER BY c.created_at DESC;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_save_candidate_skills
-- Replaces all resume-sourced skills for a candidate.
-- Skills sourced as 'manual' are NOT touched.
-- p_skills_json: JSON array of skill name strings,
--   e.g. '["Java","Spring Boot","MySQL"]'
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_skills $$
CREATE PROCEDURE sp_rec_save_candidate_skills(
  IN p_candidate_id INT,
  IN p_skills_json  JSON
)
BEGIN
  DECLARE v_i   INT DEFAULT 0;
  DECLARE v_len INT DEFAULT 0;
  DECLARE v_skill VARCHAR(200);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Remove old resume-parsed skills for this candidate
  DELETE FROM rec_candidate_skills
  WHERE candidate_id = p_candidate_id
    AND source = 'resume';

  -- Insert fresh set
  SET v_len = JSON_LENGTH(p_skills_json);

  WHILE v_i < v_len DO
    SET v_skill = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_skills_json, CONCAT('$[', v_i, ']'))));
    IF v_skill IS NOT NULL AND v_skill <> '' AND CHAR_LENGTH(v_skill) <= 200 THEN
      INSERT IGNORE INTO rec_candidate_skills (candidate_id, skill_name, source)
      VALUES (p_candidate_id, v_skill, 'resume');
    END IF;
    SET v_i = v_i + 1;
  END WHILE;

  COMMIT;

  -- Return count of skills saved
  SELECT COUNT(*) AS skills_saved
  FROM rec_candidate_skills
  WHERE candidate_id = p_candidate_id AND source = 'resume';
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_save_candidate_education
-- Replaces all education rows for a candidate.
-- p_edu_json: JSON array of objects:
--   [{"degree":"B.Tech","institution":"JNTU","year":2018}, ...]
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_education $$
CREATE PROCEDURE sp_rec_save_candidate_education(
  IN p_candidate_id INT,
  IN p_edu_json     JSON
)
BEGIN
  DECLARE v_i     INT DEFAULT 0;
  DECLARE v_len   INT DEFAULT 0;
  DECLARE v_degree      VARCHAR(300);
  DECLARE v_institution VARCHAR(300);
  DECLARE v_year        SMALLINT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  DELETE FROM rec_candidate_education WHERE candidate_id = p_candidate_id;

  SET v_len = JSON_LENGTH(p_edu_json);

  WHILE v_i < v_len DO
    SET v_degree      = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_edu_json, CONCAT('$[', v_i, '].degree'))));
    SET v_institution = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_edu_json, CONCAT('$[', v_i, '].institution'))));
    SET v_year        = CAST(JSON_EXTRACT(p_edu_json, CONCAT('$[', v_i, '].year')) AS SIGNED);

    IF v_degree IS NOT NULL AND v_degree <> '' AND v_degree <> 'null' THEN
      INSERT INTO rec_candidate_education (candidate_id, degree, institution, year_of_pass)
      VALUES (
        p_candidate_id,
        v_degree,
        NULLIF(v_institution, 'null'),
        NULLIF(v_year, 0)
      );
    END IF;

    SET v_i = v_i + 1;
  END WHILE;

  COMMIT;

  SELECT COUNT(*) AS education_saved
  FROM rec_candidate_education
  WHERE candidate_id = p_candidate_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_save_candidate_experience
-- Replaces all experience rows for a candidate.
-- p_exp_json: JSON array of objects:
--   [{
--     "company_name": "Infosys",
--     "designation":  "Software Engineer",
--     "start_month":  6,
--     "start_year":   2019,
--     "end_month":    null,
--     "end_year":     null,
--     "is_current":   1,
--     "description":  "Worked on ..."
--   }, ...]
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_experience $$
CREATE PROCEDURE sp_rec_save_candidate_experience(
  IN p_candidate_id INT,
  IN p_exp_json     JSON
)
BEGIN
  DECLARE v_i          INT DEFAULT 0;
  DECLARE v_len        INT DEFAULT 0;
  DECLARE v_company    VARCHAR(300);
  DECLARE v_desig      VARCHAR(300);
  DECLARE v_sm         TINYINT;
  DECLARE v_sy         SMALLINT;
  DECLARE v_em         TINYINT;
  DECLARE v_ey         SMALLINT;
  DECLARE v_current    TINYINT(1);
  DECLARE v_desc       TEXT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  DELETE FROM rec_candidate_experience WHERE candidate_id = p_candidate_id;

  SET v_len = JSON_LENGTH(p_exp_json);

  WHILE v_i < v_len DO
    SET v_company = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].company_name'))));
    SET v_desig   = TRIM(JSON_UNQUOTE(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].designation'))));
    SET v_sm      = CAST(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].start_month')) AS SIGNED);
    SET v_sy      = CAST(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].start_year'))  AS SIGNED);
    SET v_em      = CAST(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].end_month'))   AS SIGNED);
    SET v_ey      = CAST(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].end_year'))    AS SIGNED);
    SET v_current = CAST(COALESCE(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].is_current')), 0) AS SIGNED);
    SET v_desc    = JSON_UNQUOTE(JSON_EXTRACT(p_exp_json, CONCAT('$[', v_i, '].description')));

    IF v_company IS NOT NULL AND v_company <> '' AND v_company <> 'null' THEN
      INSERT INTO rec_candidate_experience
        (candidate_id, company_name, designation, start_month, start_year,
         end_month, end_year, is_current, description)
      VALUES (
        p_candidate_id,
        v_company,
        NULLIF(v_desig,   'null'),
        NULLIF(v_sm,  0),
        NULLIF(v_sy,  0),
        NULLIF(v_em,  0),
        NULLIF(v_ey,  0),
        v_current,
        NULLIF(v_desc, 'null')
      );
    END IF;

    SET v_i = v_i + 1;
  END WHILE;

  COMMIT;

  SELECT COUNT(*) AS experience_saved
  FROM rec_candidate_experience
  WHERE candidate_id = p_candidate_id;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_update_candidate_parse_status
-- Updates parse_status and enriched fields on rec_candidates after
-- background parsing completes.
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_update_candidate_parse_status $$
CREATE PROCEDURE sp_rec_update_candidate_parse_status(
  IN p_candidate_id         INT,
  IN p_parse_status         VARCHAR(20),
  IN p_resume_hash          CHAR(64),
  IN p_linkedin_url         VARCHAR(500),
  IN p_github_url           VARCHAR(500),
  IN p_notice_period        TINYINT,
  IN p_companies            TEXT,
  IN p_current_designation  VARCHAR(200)
)
BEGIN
  UPDATE rec_candidates SET
    parse_status         = p_parse_status,
    resume_hash          = p_resume_hash,
    linkedin_url         = p_linkedin_url,
    github_url           = p_github_url,
    notice_period        = p_notice_period,
    companies            = p_companies,
    current_designation  = p_current_designation,
    updated_at           = CURRENT_TIMESTAMP
  WHERE candidate_id = p_candidate_id;

  SELECT ROW_COUNT() AS rows_affected;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_get_candidate_skills
-- Returns all skills for a candidate.
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_skills $$
CREATE PROCEDURE sp_rec_get_candidate_skills(
  IN p_candidate_id INT
)
BEGIN
  SELECT skill_id, skill_name, source, created_at
  FROM rec_candidate_skills
  WHERE candidate_id = p_candidate_id
  ORDER BY source DESC, skill_name ASC;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_get_candidate_education
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_education $$
CREATE PROCEDURE sp_rec_get_candidate_education(
  IN p_candidate_id INT
)
BEGIN
  SELECT edu_id, degree, institution, year_of_pass, created_at
  FROM rec_candidate_education
  WHERE candidate_id = p_candidate_id
  ORDER BY year_of_pass DESC;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_get_candidate_experience
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_experience $$
CREATE PROCEDURE sp_rec_get_candidate_experience(
  IN p_candidate_id INT
)
BEGIN
  SELECT exp_id, company_name, designation,
         start_month, start_year, end_month, end_year,
         is_current, description, created_at
  FROM rec_candidate_experience
  WHERE candidate_id = p_candidate_id
  ORDER BY is_current DESC, start_year DESC, start_month DESC;
END $$

-- ─────────────────────────────────────────────────────────────────────
-- sp_rec_get_parser_logs
-- Returns parser log rows for a candidate or all recent logs.
-- p_candidate_id = NULL → return all recent logs (admin view).
-- ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_rec_get_parser_logs $$
CREATE PROCEDURE sp_rec_get_parser_logs(
  IN p_candidate_id INT,
  IN p_limit        INT
)
BEGIN
  SET p_limit = COALESCE(p_limit, 50);

  IF p_candidate_id IS NOT NULL THEN
    SELECT log_id, candidate_id, filename, file_size_bytes, mime_type,
           parsed_by, status, error_message, raw_text_length,
           fields_found, duration_ms, created_at
    FROM rec_resume_parser_logs
    WHERE candidate_id = p_candidate_id
    ORDER BY created_at DESC
    LIMIT p_limit;
  ELSE
    SELECT log_id, candidate_id, filename, file_size_bytes, mime_type,
           parsed_by, status, error_message, raw_text_length,
           fields_found, duration_ms, created_at
    FROM rec_resume_parser_logs
    ORDER BY created_at DESC
    LIMIT p_limit;
  END IF;
END $$

DELIMITER ;
