-- =============================================================================
-- HRMS — ALL STORED PROCEDURES
-- Generated 2026-09-25 from the live hrms_db (336 procedures, all verified by end-to-end tests).
-- MySQL Workbench: File → Open SQL Script → Execute All. Also used by deploy_procedures.js / DEPLOY_PRODUCTION.bat.
-- Safe to re-run: each procedure is dropped and re-created with its current definition.
-- =============================================================================
USE hrms_db;
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_accrue_earned_leave $$
CREATE PROCEDURE `sp_accrue_earned_leave`(IN p_month INT, IN p_year INT)
BEGIN
  DECLARE v_lt_id INT;
  DECLARE v_work_days INT DEFAULT 0;
  DECLARE v_d DATE;
  DECLARE v_last DATE;
  SELECT leave_type_id INTO v_lt_id FROM leave_types
   WHERE leave_type_name LIKE '%Earned%' OR leave_type_name LIKE '%EL%' OR leave_type_name LIKE '%PL%'
   ORDER BY leave_type_id ASC LIMIT 1;
  IF v_lt_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No Earned Leave type configured';
  END IF;
  SET v_d    = DATE(CONCAT(p_year,'-',LPAD(p_month,2,'0'),'-01'));
  SET v_last = LAST_DAY(v_d);
  WHILE v_d <= v_last DO
    IF DAYOFWEEK(v_d) NOT IN (1,7) THEN SET v_work_days = v_work_days + 1; END IF;
    SET v_d = DATE_ADD(v_d, INTERVAL 1 DAY);
  END WHILE;
  INSERT INTO leave_balances
    (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
  SELECT e.employee_id, v_lt_id, p_year, 0,
         FLOOR(IFNULL(IFNULL(ps.paid_days, ps.working_days), v_work_days) / 14 * 2) / 2,
         0,
         FLOOR(IFNULL(IFNULL(ps.paid_days, ps.working_days), v_work_days) / 14 * 2) / 2
    FROM employees e
    LEFT JOIN payslips ps
           ON ps.employee_id = e.employee_id AND ps.month = p_month AND ps.year = p_year
   WHERE e.employee_status = 'Active'
     AND FLOOR(IFNULL(IFNULL(ps.paid_days, ps.working_days), v_work_days) / 14 * 2) / 2 > 0
  ON DUPLICATE KEY UPDATE
    granted = granted + VALUES(granted),
    balance = GREATEST(0, opening_balance + granted + VALUES(granted) - availed);
  SELECT v_lt_id AS leave_type_id, v_work_days AS calendar_work_days, ROW_COUNT() AS accrued;
END $$
DROP PROCEDURE IF EXISTS sp_add_helpdesk_comment $$
CREATE PROCEDURE `sp_add_helpdesk_comment`(
  IN p_ticket_id INT, IN p_commented_by INT, IN p_comment TEXT
)
BEGIN
  INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (p_ticket_id, p_commented_by, p_comment);
  SELECT LAST_INSERT_ID() AS comment_id;
END $$
DROP PROCEDURE IF EXISTS sp_add_team_member $$
CREATE PROCEDURE `sp_add_team_member`(
  IN p_team_id INT, IN p_employee_id INT, IN p_title VARCHAR(100), IN p_is_lead TINYINT
)
BEGIN
  INSERT INTO team_members (team_id, employee_id, title, is_lead)
  VALUES (p_team_id, p_employee_id, p_title, p_is_lead)
  ON DUPLICATE KEY UPDATE title = p_title, is_lead = p_is_lead;
  IF p_is_lead = 1 THEN
    UPDATE teams SET lead_employee_id = p_employee_id WHERE team_id = p_team_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_adjust_leave_balance $$
CREATE PROCEDURE `sp_adjust_leave_balance`(
  IN p_employee_id   INT,
  IN p_leave_type_id INT,
  IN p_year          INT,
  IN p_opening       DECIMAL(6,2),
  IN p_granted       DECIMAL(6,2),
  IN p_availed       DECIMAL(6,2)
)
BEGIN
  DECLARE v_bal DECIMAL(6,2);
  SET v_bal = GREATEST(0, p_opening + p_granted - p_availed);
  INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
  VALUES (p_employee_id, p_leave_type_id, p_year, p_opening, p_granted, p_availed, v_bal)
  ON DUPLICATE KEY UPDATE
    opening_balance = p_opening, granted = p_granted, availed = p_availed, balance = v_bal;
END $$
DROP PROCEDURE IF EXISTS sp_admin_dashboard $$
CREATE PROCEDURE `sp_admin_dashboard`()
BEGIN
  SELECT SUM(status='pending') AS pending_timesheets,
         SUM(status='approved')  AS approved_timesheets,
         COUNT(*)                AS total_timesheets
    FROM weekly_timesheets;
  SELECT (SELECT COUNT(*) FROM employees WHERE employee_status='Active') AS active_employees,
         (SELECT COUNT(*) FROM leave_requests WHERE status='Pending')    AS pending_leaves,
         (SELECT COUNT(*) FROM helpdesk_tickets WHERE status='Open')     AS open_tickets;
END $$
DROP PROCEDURE IF EXISTS sp_admin_review_resignation $$
CREATE PROCEDURE `sp_admin_review_resignation`(
  IN p_admin_id INT, IN p_resignation_id INT, IN p_status VARCHAR(20), IN p_remarks TEXT
)
BEGIN
  UPDATE resignations SET status = p_status, admin_remarks = p_remarks,
         reviewed_by = p_admin_id, reviewed_at = NOW()
   WHERE resignation_id = p_resignation_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_admin_timesheet_counts $$
CREATE PROCEDURE `sp_admin_timesheet_counts`()
BEGIN
  SELECT COALESCE(SUM(status = 'pending'), 0)   AS pending,
         COALESCE(SUM(status = 'approved'), 0)  AS approved,
         COALESCE(SUM(status = 'rejected'), 0)  AS rejected
    FROM weekly_timesheets;
  SELECT COUNT(*) AS cnt
    FROM users u JOIN roles r ON r.role_id = u.role_id
   WHERE r.role_name = 'Employee' AND u.status = 'Active';
  SELECT COUNT(*) AS cnt
    FROM users u JOIN roles r ON r.role_id = u.role_id
   WHERE r.role_name = 'Reporting Manager' AND u.status = 'Active';
END $$
DROP PROCEDURE IF EXISTS sp_ai_interview_create_session $$
CREATE PROCEDURE `sp_ai_interview_create_session`(
  IN p_token           VARCHAR(64),
  IN p_candidate_id    INT,
  IN p_job_req_id      INT,
  IN p_recruiter_id    INT,
  IN p_candidate_name  VARCHAR(255),
  IN p_candidate_email VARCHAR(255),
  IN p_job_title       VARCHAR(255),
  IN p_questions_json  LONGTEXT,
  IN p_expires_at      DATETIME
)
BEGIN
  INSERT INTO ai_interview_sessions
    (token, candidate_id, job_req_id, recruiter_id, candidate_name, candidate_email, job_title, questions_json, expires_at)
  VALUES
    (p_token, p_candidate_id, p_job_req_id, p_recruiter_id, p_candidate_name, p_candidate_email, p_job_title, p_questions_json, p_expires_at);
  SELECT LAST_INSERT_ID() AS session_id;
END $$
DROP PROCEDURE IF EXISTS sp_ai_interview_get_report $$
CREATE PROCEDURE `sp_ai_interview_get_report`(IN p_session_id INT)
BEGIN
  SELECT session_id, candidate_name, candidate_email, job_title,
         questions_json, answers_json, evaluation_json,
         overall_score, recommendation, status, submitted_at, created_at
  FROM   ai_interview_sessions
  WHERE  session_id = p_session_id
  LIMIT  1;
END $$
DROP PROCEDURE IF EXISTS sp_ai_interview_get_session $$
CREATE PROCEDURE `sp_ai_interview_get_session`(IN p_token VARCHAR(64))
BEGIN
  SELECT session_id, token, candidate_id, job_req_id, recruiter_id,
         candidate_name, candidate_email, job_title,
         questions_json, status, expires_at, submitted_at
  FROM   ai_interview_sessions
  WHERE  token = p_token
  LIMIT  1;
END $$
DROP PROCEDURE IF EXISTS sp_ai_interview_list_by_recruiter $$
CREATE PROCEDURE `sp_ai_interview_list_by_recruiter`(
  IN p_recruiter_id INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SELECT session_id, candidate_name, candidate_email, job_title,
         overall_score, recommendation, status, expires_at, submitted_at, created_at
  FROM   ai_interview_sessions
  WHERE  recruiter_id = p_recruiter_id
  ORDER  BY created_at DESC
  LIMIT  p_limit OFFSET p_offset;
END $$
DROP PROCEDURE IF EXISTS sp_ai_interview_submit $$
CREATE PROCEDURE `sp_ai_interview_submit`(
  IN p_token       VARCHAR(64),
  IN p_answers     LONGTEXT,
  IN p_evaluation  LONGTEXT
)
BEGIN
  UPDATE ai_interview_sessions
  SET
    answers_json    = p_answers,
    evaluation_json = p_evaluation,
    overall_score   = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_evaluation, '$.overallScore')) AS UNSIGNED),
    recommendation  = JSON_UNQUOTE(JSON_EXTRACT(p_evaluation, '$.recommendation')),
    status          = 'completed',
    submitted_at    = NOW()
  WHERE token = p_token;
END $$
DROP PROCEDURE IF EXISTS sp_all_leave_balances $$
CREATE PROCEDURE `sp_all_leave_balances`(IN p_year INT)
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name,
         m.emp_code AS manager_emp_code
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees m  ON m.employee_id    = e.reporting_to
   WHERE e.employee_status = 'Active' ORDER BY e.emp_code;
  SELECT leave_type_id, leave_type_name, annual_quota, carry_forward_limit
    FROM leave_types ORDER BY leave_type_name;
  SELECT lb.employee_id, lb.leave_type_id, lb.opening_balance, lb.granted, lb.availed, lb.balance
    FROM leave_balances lb WHERE lb.year = p_year;
END $$
DROP PROCEDURE IF EXISTS sp_apply_leave $$
CREATE PROCEDURE `sp_apply_leave`(
  IN  p_employee_id    INT,
  IN  p_leave_type_id  INT,
  IN  p_from_date      DATE,
  IN  p_from_session   VARCHAR(10),
  IN  p_to_date        DATE,
  IN  p_to_session     VARCHAR(10),
  IN  p_days           DECIMAL(5,2),
  IN  p_reason         TEXT,
  OUT p_request_id     INT,
  OUT p_status_msg     VARCHAR(200)
)
BEGIN
  DECLARE v_balance DECIMAL(6,2) DEFAULT 0;
  DECLARE v_year INT;
  SET v_year = YEAR(p_from_date);
  SELECT IFNULL(lb.balance, lt.annual_quota) INTO v_balance
    FROM leave_types lt
    LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id
          AND lb.employee_id   = p_employee_id
          AND lb.year          = v_year
   WHERE lt.leave_type_id = p_leave_type_id LIMIT 1;
  IF v_balance < p_days THEN
    SET p_request_id = NULL;
    SET p_status_msg = CONCAT('Insufficient leave balance. Available: ', v_balance, ' day(s)');
  ELSE
    INSERT INTO leave_requests
      (employee_id, leave_type_id, from_date, from_session, to_date, to_session, days, reason, status)
    VALUES (p_employee_id, p_leave_type_id, p_from_date, p_from_session,
            p_to_date, p_to_session, p_days, p_reason, 'Pending');
    SET p_request_id = LAST_INSERT_ID();
    SET p_status_msg = 'OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_assign_manager $$
CREATE PROCEDURE `sp_assign_manager`(
    IN p_employee_id INT,
    IN p_new_manager_id INT,
    IN p_changed_by INT,
    IN p_reason TEXT
)
main_block: BEGIN
    DECLARE v_old_manager INT DEFAULT NULL;
    DECLARE v_employee_exists INT DEFAULT 0;
    SELECT COUNT(*)
    INTO v_employee_exists
    FROM employees
    WHERE employee_id = p_employee_id;
    IF v_employee_exists = 0 THEN
        LEAVE main_block;
    END IF;
    SELECT reporting_to
    INTO v_old_manager
    FROM employees
    WHERE employee_id = p_employee_id
    LIMIT 1;
    UPDATE employees
    SET reporting_to = p_new_manager_id
    WHERE employee_id = p_employee_id;
    INSERT INTO reporting_history (
        employee_id,
        old_manager_id,
        new_manager_id,
        changed_by,
        reason,
        change_type
    )
    VALUES (
        p_employee_id,
        v_old_manager,
        p_new_manager_id,
        p_changed_by,
        p_reason,
        'assign'
    );
END main_block $$
DROP PROCEDURE IF EXISTS sp_assign_salary_structure $$
CREATE PROCEDURE `sp_assign_salary_structure`(
  IN p_employee_id  INT,
  IN p_structure_id INT,
  IN p_ctc_annual   DECIMAL(14,2),
  IN p_effective_from DATE,
  IN p_assigned_by  INT
)
BEGIN
  -- Close previous active assignment
  UPDATE employee_salary_assignments
     SET effective_to = DATE_SUB(p_effective_from, INTERVAL 1 DAY),
         is_active    = 0
   WHERE employee_id = p_employee_id
     AND is_active   = 1;
  -- Insert new assignment
  INSERT INTO employee_salary_assignments
    (employee_id, structure_id, ctc_annual, effective_from, is_active)
  VALUES
    (p_employee_id, p_structure_id, p_ctc_annual, p_effective_from, 1);
  SELECT LAST_INSERT_ID() AS assignment_id;
END $$
DROP PROCEDURE IF EXISTS sp_assign_ticket $$
CREATE PROCEDURE `sp_assign_ticket`(IN p_ticket_id INT, IN p_assigned_to INT)
BEGIN
  UPDATE helpdesk_tickets SET assigned_to = p_assigned_to WHERE ticket_id = p_ticket_id;
END $$
DROP PROCEDURE IF EXISTS sp_attendance_dashboard $$
CREATE PROCEDURE `sp_attendance_dashboard`(
  IN p_date DATE
)
BEGIN
  SELECT
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active') AS total_employees,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND check_in IS NOT NULL) AS checked_in_today,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND status = 'present') AS present_today,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND status = 'absent') AS absent_today,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND status = 'leave') AS on_leave_today,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND status = 'late') AS late_today,
    (SELECT COUNT(*) FROM attendance WHERE attendance_date = p_date AND work_hours >= 9) AS met_nine_hour_rule,
    (SELECT ROUND(AVG(work_hours), 1) FROM attendance WHERE attendance_date = p_date AND work_hours > 0) AS avg_hours_per_day;
END $$
DROP PROCEDURE IF EXISTS sp_attendance_report $$
CREATE PROCEDURE `sp_attendance_report`(IN p_from_date DATE, IN p_to_date DATE, IN p_department_id INT)
BEGIN
  SELECT a.status, COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.employee_id=a.employee_id
   WHERE (p_from_date     IS NULL OR a.attendance_date>=p_from_date)
     AND (p_to_date       IS NULL OR a.attendance_date<=p_to_date)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
   GROUP BY a.status;
  SELECT a.attendance_id, a.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, a.attendance_date, a.check_in, a.check_out, a.work_hours, a.late_by_minutes, a.status
    FROM attendance a
    JOIN employees e ON e.employee_id=a.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id
   WHERE (p_from_date     IS NULL OR a.attendance_date>=p_from_date)
     AND (p_to_date       IS NULL OR a.attendance_date<=p_to_date)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
   ORDER BY a.attendance_date DESC, e.emp_code LIMIT 500;
END $$
DROP PROCEDURE IF EXISTS sp_birthdays_anniversaries $$
CREATE PROCEDURE `sp_birthdays_anniversaries`(IN p_month INT)
BEGIN
  SELECT employee_id, emp_code, CONCAT(first_name, ' ', IFNULL(last_name,'')) AS employee_name,
         dob, emp_joining_date
    FROM employees
   WHERE employee_status = 'Active'
     AND (MONTH(dob) = p_month OR MONTH(emp_joining_date) = p_month);
END $$
DROP PROCEDURE IF EXISTS sp_break_end $$
CREATE PROCEDURE `sp_break_end`(
    IN p_employee_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_lat DECIMAL(10,6),
    IN p_lng DECIMAL(10,6),
    IN p_location VARCHAR(200)
)
BEGIN
    DECLARE v_last_type VARCHAR(10) DEFAULT NULL;
    DECLARE v_last_time TIME DEFAULT NULL;
    DECLARE v_break_minutes DECIMAL(10,2) DEFAULT 0;
    SELECT
        punch_type,
        punch_time
    INTO
        v_last_type,
        v_last_time
    FROM attendance_punches
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    ORDER BY
        punch_time DESC,
        punch_id DESC
    LIMIT 1;
    IF v_last_type IS NULL
       OR v_last_type <> 'OUT' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You are not currently on a break';
    END IF;
    SET v_break_minutes =
        GREATEST(
            0,
            TIME_TO_SEC(
                TIMEDIFF(p_time, v_last_time)
            ) / 60
        );
    INSERT INTO attendance_punches (
        employee_id,
        attendance_date,
        punch_time,
        punch_type,
        source,
        lat,
        lng,
        location
    )
    VALUES (
        p_employee_id,
        p_date,
        p_time,
        'IN',
        'web',
        p_lat,
        p_lng,
        p_location
    );
    UPDATE attendance
    SET
        total_punches =
            COALESCE(total_punches, 0) + 1,
        break_minutes =
            COALESCE(break_minutes, 0) + v_break_minutes
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date;
END $$
DROP PROCEDURE IF EXISTS sp_break_start $$
CREATE PROCEDURE `sp_break_start`(
    IN p_employee_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_lat DECIMAL(10,6),
    IN p_lng DECIMAL(10,6),
    IN p_location VARCHAR(200)
)
BEGIN
    DECLARE v_check_in TIME DEFAULT NULL;
    DECLARE v_last_type VARCHAR(10) DEFAULT NULL;
    SELECT check_in
    INTO v_check_in
    FROM attendance
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    LIMIT 1;
    IF v_check_in IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You must check in before starting a break';
    END IF;
    SELECT punch_type
    INTO v_last_type
    FROM attendance_punches
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date
    ORDER BY
        punch_time DESC,
        punch_id DESC
    LIMIT 1;
    IF v_last_type = 'OUT' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'You are already on a break';
    END IF;
    INSERT INTO attendance_punches (
        employee_id,
        attendance_date,
        punch_time,
        punch_type,
        source,
        lat,
        lng,
        location
    )
    VALUES (
        p_employee_id,
        p_date,
        p_time,
        'OUT',
        'web',
        p_lat,
        p_lng,
        p_location
    );
    UPDATE attendance
    SET total_punches = COALESCE(total_punches, 0) + 1
    WHERE
        employee_id = p_employee_id
        AND attendance_date = p_date;
END $$
DROP PROCEDURE IF EXISTS sp_bulk_assign_manager $$
CREATE PROCEDURE `sp_bulk_assign_manager`(
    IN p_employee_id INT,
    IN p_new_manager_id INT,
    IN p_changed_by INT,
    IN p_reason TEXT
)
main_block: BEGIN
    DECLARE v_old_manager INT DEFAULT NULL;
    DECLARE v_employee_exists INT DEFAULT 0;
    SELECT COUNT(*)
    INTO v_employee_exists
    FROM employees
    WHERE employee_id = p_employee_id;
    IF v_employee_exists = 0 THEN
        LEAVE main_block;
    END IF;
    SELECT reporting_to
    INTO v_old_manager
    FROM employees
    WHERE employee_id = p_employee_id
    LIMIT 1;
    UPDATE employees
    SET reporting_to = p_new_manager_id
    WHERE employee_id = p_employee_id;
    INSERT INTO reporting_history (
        employee_id,
        old_manager_id,
        new_manager_id,
        changed_by,
        reason,
        change_type
    )
    VALUES (
        p_employee_id,
        v_old_manager,
        p_new_manager_id,
        p_changed_by,
        p_reason,
        'bulk_transfer'
    );
END main_block $$
DROP PROCEDURE IF EXISTS sp_bulk_import_holidays $$
CREATE PROCEDURE `sp_bulk_import_holidays`(
  IN  p_json     JSON,
  OUT p_imported INT
)
BEGIN
  DECLARE v_i       INT DEFAULT 0;
  DECLARE v_total   INT;
  DECLARE v_name    VARCHAR(100);
  DECLARE v_date    DATE;
  DECLARE v_cal     VARCHAR(100);
  DECLARE v_shift   VARCHAR(10);
  DECLARE v_loc     VARCHAR(100);
  DECLARE v_restr   TINYINT(1);
  SET p_imported = 0;
  SET v_total    = JSON_LENGTH(p_json);
  WHILE v_i < v_total DO
    SET v_name  = JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].holiday_name')));
    SET v_date  = JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].holiday_date')));
    SET v_cal   = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].holiday_calendar'))), 'India - Default');
    SET v_shift = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].shift'))), 'general');
    SET v_loc   = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].location'))), '');
    SET v_restr = IFNULL(JSON_EXTRACT(p_json, CONCAT('$[', v_i, '].is_restricted')), 0);
    IF v_name IS NOT NULL AND v_name <> 'null' AND v_date IS NOT NULL THEN
      INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
      VALUES (v_name, v_date, v_cal, v_shift, v_loc, v_restr);
      SET p_imported = p_imported + 1;
    END IF;
    SET v_i = v_i + 1;
  END WHILE;
  SELECT p_imported AS imported;
END $$
DROP PROCEDURE IF EXISTS sp_cancel_delegation $$
CREATE PROCEDURE `sp_cancel_delegation`(IN p_id INT)
BEGIN
  UPDATE workflow_delegations SET status = 'Cancelled' WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_cancel_leave_request $$
CREATE PROCEDURE `sp_cancel_leave_request`(
  IN p_id INT, IN p_employee_id INT, OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_emp_id INT; DECLARE v_status VARCHAR(30);
  SELECT employee_id, status INTO v_emp_id, v_status
    FROM leave_requests WHERE leave_request_id = p_id LIMIT 1;
  IF v_emp_id IS NULL      THEN SET p_ok=0; SET p_msg='Leave request not found';
  ELSEIF v_emp_id != p_employee_id THEN SET p_ok=0; SET p_msg='You can only cancel your own leave requests';
  ELSEIF v_status != 'Pending'     THEN SET p_ok=0; SET p_msg='Only pending leave requests can be cancelled';
  ELSE
    UPDATE leave_requests SET status='Cancelled' WHERE leave_request_id = p_id;
    SET p_ok=1; SET p_msg='Cancelled';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_cancel_workflow_delegate $$
CREATE PROCEDURE `sp_cancel_workflow_delegate`(IN p_id INT)
BEGIN
  UPDATE workflow_delegates SET status = 'Cancelled' WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_change_employee_role $$
CREATE PROCEDURE `sp_change_employee_role`(
  IN p_employee_id INT,
  IN p_role_id INT
)
BEGIN
  DECLARE v_user_id INT DEFAULT NULL;
  SELECT user_id INTO v_user_id
  FROM users
  WHERE employee_id = p_employee_id
  LIMIT 1;
  IF v_user_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No user account linked to this employee';
  END IF;
  UPDATE users
  SET role_id = p_role_id
  WHERE employee_id = p_employee_id;
  SELECT 1 AS changed;
END $$
DROP PROCEDURE IF EXISTS sp_change_password $$
CREATE PROCEDURE `sp_change_password`(IN p_user_id INT, IN p_new_hash VARCHAR(255))
BEGIN
  UPDATE users SET password_hash = p_new_hash WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_check_email_exists $$
CREATE PROCEDURE `sp_check_email_exists`(IN p_email VARCHAR(120))
BEGIN
  SELECT user_id FROM users WHERE email = p_email LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_check_employee_exists $$
CREATE PROCEDURE `sp_check_employee_exists`(IN p_employee_id INT)
BEGIN
  SELECT employee_id FROM employees WHERE employee_id = p_employee_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_check_role_permission $$
CREATE PROCEDURE `sp_check_role_permission`(
  IN p_role_id INT,
  IN p_module VARCHAR(100),
  IN p_action VARCHAR(100)
)
BEGIN
  SELECT COALESCE(MAX(rp.allowed), 0) AS allowed
  FROM role_permissions rp
  JOIN permissions p ON p.permission_id = rp.permission_id
  WHERE rp.role_id = p_role_id
    AND p.module = p_module
    AND p.action = p_action;
END $$
DROP PROCEDURE IF EXISTS sp_close_ticket $$
CREATE PROCEDURE `sp_close_ticket`(
  IN p_employee_id INT, IN p_ticket_id INT, OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_emp INT; DECLARE v_status VARCHAR(30);
  SELECT employee_id, status INTO v_emp, v_status FROM helpdesk_tickets WHERE ticket_id=p_ticket_id LIMIT 1;
  IF v_emp IS NULL THEN SET p_ok=0; SET p_msg='Ticket not found';
  ELSEIF v_emp != p_employee_id THEN SET p_ok=0; SET p_msg='Not your ticket';
  ELSEIF v_status != 'Resolved' THEN SET p_ok=0; SET p_msg='Ticket must be Resolved before closing';
  ELSE
    UPDATE helpdesk_tickets SET status='Closed', resolved_at=NOW() WHERE ticket_id=p_ticket_id;
    SET p_ok=1; SET p_msg='OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_complete_review $$
CREATE PROCEDURE `sp_complete_review`(IN p_review_id INT)
BEGIN
  UPDATE reviews SET status = 'Completed' WHERE review_id = p_review_id;
END $$
DROP PROCEDURE IF EXISTS sp_consume_mfa_temp_token $$
CREATE PROCEDURE `sp_consume_mfa_temp_token`(IN p_token_hash VARCHAR(64), OUT p_user_id INT)
BEGIN
  DECLARE v_id INT;
  SELECT id, user_id INTO v_id, p_user_id
    FROM mfa_temp_tokens WHERE token_hash = p_token_hash AND used = 0 AND expires_at > NOW() LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE mfa_temp_tokens SET used = 1 WHERE id = v_id;
  ELSE
    SET p_user_id = NULL;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_count_teams $$
CREATE PROCEDURE `sp_count_teams`(IN p_department_id INT, IN p_search VARCHAR(100))
BEGIN
  SELECT COUNT(*) AS total FROM teams t
   WHERE (p_department_id IS NULL OR t.department_id=p_department_id)
     AND (p_search        IS NULL OR t.team_name LIKE p_search);
END $$
DROP PROCEDURE IF EXISTS sp_create_appraisal_cycle $$
CREATE PROCEDURE `sp_create_appraisal_cycle`(
  IN  p_admin_id    INT,
  IN  p_fy_label    VARCHAR(50),
  IN  p_cycle_type  VARCHAR(30),
  IN  p_deadline    DATE,
  OUT p_cycle_id    INT
)
BEGIN
  INSERT INTO appraisal_cycles (fy_label, cycle_type, status, deadline, rolled_out_by)
  VALUES (p_fy_label, p_cycle_type, 'inactive', p_deadline, p_admin_id);
  SET p_cycle_id = LAST_INSERT_ID();
  SELECT * FROM appraisal_cycles WHERE cycle_id = p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_designation $$
CREATE PROCEDURE `sp_create_designation`(
  IN p_name VARCHAR(200), IN p_department_id INT, OUT p_id INT
)
BEGIN
  INSERT INTO designations (designation_name, department_id) VALUES (p_name, p_department_id);
  SET p_id = LAST_INSERT_ID();
  SELECT * FROM designations WHERE designation_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_employee $$
CREATE PROCEDURE `sp_create_employee`(
  IN p_emp_code        VARCHAR(30),
  IN p_first_name      VARCHAR(80),
  IN p_last_name       VARCHAR(80),
  IN p_email           VARCHAR(150),
  IN p_mobile          VARCHAR(20),
  IN p_job_title       VARCHAR(100),
  IN p_department_id   INT,
  IN p_designation_id  INT,
  IN p_reporting_to    INT,
  IN p_employee_type   VARCHAR(30),
  IN p_joining_date    DATE,
  IN p_ctc             DECIMAL(12,2),
  IN p_base_salary     DECIMAL(12,2),
  IN p_role_id         INT,
  IN p_password_hash   VARCHAR(255),
  OUT p_employee_id    INT
)
BEGIN
  DECLARE v_code VARCHAR(30);
  START TRANSACTION;
  IF p_emp_code IS NULL OR p_emp_code = '' THEN
    SET v_code = CONCAT('EMP', LPAD(FLOOR(RAND() * 100000), 5, '0'));
  ELSE
    SET v_code = p_emp_code;
  END IF;
  INSERT INTO employees (
    emp_code, first_name, last_name, email, mobile, emp_job_title,
    department_id, designation_id, reporting_to, employee_type,
    employee_status, emp_joining_date, ctc, base_salary
  ) VALUES (
    v_code, p_first_name, p_last_name, p_email, p_mobile, p_job_title,
    p_department_id, p_designation_id, p_reporting_to, p_employee_type,
    'Active', p_joining_date, p_ctc, p_base_salary
  );
  SET p_employee_id = LAST_INSERT_ID();
  IF p_password_hash IS NOT NULL AND p_password_hash <> '' THEN
    INSERT INTO users (email, password_hash, role_id, employee_id, status)
    VALUES (p_email, p_password_hash, IFNULL(p_role_id, 2), p_employee_id, 'Active');
  END IF;
  COMMIT;
END $$
DROP PROCEDURE IF EXISTS sp_create_extra_work_request $$
CREATE PROCEDURE `sp_create_extra_work_request`(
  IN p_employee_id  INT, IN p_timesheet_id INT, IN p_work_date DATE,
  IN p_task_name    VARCHAR(200), IN p_extra_hours DECIMAL(5,2), IN p_reason TEXT,
  OUT p_id INT
)
BEGIN
  INSERT INTO extra_work_requests (employee_id, timesheet_id, work_date, task_name, extra_hours, reason)
  VALUES (p_employee_id, p_timesheet_id, p_work_date, p_task_name, p_extra_hours, p_reason);
  SET p_id = LAST_INSERT_ID();
  SELECT * FROM extra_work_requests WHERE extra_work_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_holiday $$
CREATE PROCEDURE `sp_create_holiday`(
  IN  p_holiday_name     VARCHAR(100),
  IN  p_holiday_date     DATE,
  IN  p_holiday_calendar VARCHAR(100),
  IN  p_shift            ENUM('general','mid','night'),
  IN  p_location         VARCHAR(100),
  IN  p_is_restricted    TINYINT(1),
  OUT p_holiday_id       INT
)
BEGIN
  INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
  VALUES (
    p_holiday_name,
    p_holiday_date,
    IFNULL(p_holiday_calendar, 'India - Default'),
    IFNULL(p_shift, 'general'),
    NULLIF(p_location, ''),
    IFNULL(p_is_restricted, 0)
  );
  SET p_holiday_id = LAST_INSERT_ID();
END $$
DROP PROCEDURE IF EXISTS sp_create_it_cycle $$
CREATE PROCEDURE `sp_create_it_cycle`(
  IN p_fy_label VARCHAR(20), IN p_fy_start_year INT,
  IN p_start_date DATE, IN p_end_date DATE, IN p_created_by INT,
  OUT p_cycle_id INT
)
BEGIN
  INSERT INTO it_declaration_cycles (fy_label, fy_start_year, start_date, end_date, created_by)
  VALUES (p_fy_label, p_fy_start_year, p_start_date, p_end_date, p_created_by);
  SET p_cycle_id = LAST_INSERT_ID();
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_org_delegation $$
CREATE PROCEDURE `sp_create_org_delegation`(
  IN p_employee_id INT, IN p_delegate_id INT, IN p_module VARCHAR(100),
  IN p_from_date DATE, IN p_to_date DATE, IN p_reason TEXT, IN p_created_by INT,
  OUT p_delegation_id INT
)
BEGIN
  UPDATE workflow_delegates SET status='Cancelled'
   WHERE employee_id=p_employee_id AND status='Active' AND to_date>=p_from_date AND from_date<=p_to_date;
  INSERT INTO workflow_delegates (employee_id, delegate_employee_id, module, from_date, to_date, status)
  VALUES (p_employee_id, p_delegate_id, p_module, p_from_date, p_to_date, 'Active');
  SET p_delegation_id = LAST_INSERT_ID();
  SELECT * FROM workflow_delegates WHERE id=p_delegation_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_salary_template $$
CREATE PROCEDURE `sp_create_salary_template`(
  IN p_name            VARCHAR(100),
  IN p_description     VARCHAR(255),
  IN p_basic_pct       DECIMAL(5,2),
  IN p_hra_pct         DECIMAL(5,2),
  IN p_variable_pct    DECIMAL(5,2),
  IN p_telephone       DECIMAL(10,2),
  IN p_lta_annual      DECIMAL(10,2),
  IN p_pf_applicable   TINYINT(1),
  IN p_pf_cap          TINYINT(1),
  IN p_gratuity        TINYINT(1),
  IN p_bonus           TINYINT(1),
  IN p_insurance       DECIMAL(10,2),
  IN p_other           DECIMAL(10,2),
  IN p_pt              DECIMAL(10,2),
  IN p_is_default      TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_templates SET is_default = 0;
  END IF;
  INSERT INTO salary_templates (
    template_name, description, basic_pct, hra_pct, variable_pct,
    telephone_monthly, lta_annual, pf_applicable, pf_cap,
    gratuity_applicable, bonus_applicable, insurance_cost,
    other_allowances, professional_tax, is_default
  ) VALUES (
    p_name, p_description, p_basic_pct, p_hra_pct, p_variable_pct,
    p_telephone, p_lta_annual, p_pf_applicable, p_pf_cap,
    p_gratuity, p_bonus, p_insurance,
    p_other, p_pt, p_is_default
  );
  SELECT LAST_INSERT_ID() AS template_id;
END $$
DROP PROCEDURE IF EXISTS sp_create_task $$
CREATE PROCEDURE `sp_create_task`(
  IN p_employee_id INT, IN p_task_name VARCHAR(200), IN p_project_name VARCHAR(200),
  IN p_description TEXT, IN p_start_date DATE, IN p_end_date DATE,
  IN p_start_time TIME, IN p_end_time TIME, IN p_duration_hours DECIMAL(5,2),
  OUT p_task_id INT
)
BEGIN
  INSERT INTO employee_tasks (employee_id, task_name, project_name, description,
    start_date, end_date, start_time, end_time, duration_hours)
  VALUES (p_employee_id, p_task_name, IFNULL(p_project_name,''), IFNULL(p_description,''),
    p_start_date, p_end_date, p_start_time, p_end_time, p_duration_hours);
  SET p_task_id = LAST_INSERT_ID();
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END $$
DROP PROCEDURE IF EXISTS sp_dashboard_stats $$
CREATE PROCEDURE `sp_dashboard_stats`()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active') AS employees_count,
    (SELECT COUNT(*) FROM companies) AS companies_count,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending') AS pending_leaves_count,
    (SELECT COUNT(*) FROM payslips WHERE month = MONTH(CURDATE()) AND year = YEAR(CURDATE())) AS salaries_count,
    (SELECT COUNT(*) FROM helpdesk_tickets WHERE status IN ('Open','In Progress')) AS open_tickets_count,
    (SELECT COUNT(*) FROM jobs WHERE status = 'Open') AS open_jobs_count;
END $$
DROP PROCEDURE IF EXISTS sp_delete_designation $$
CREATE PROCEDURE `sp_delete_designation`(IN p_id INT)
BEGIN
  DELETE FROM designations WHERE designation_id = p_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_delete_holiday $$
CREATE PROCEDURE `sp_delete_holiday`(
  IN p_holiday_id INT
)
BEGIN
  DELETE FROM holidays WHERE holiday_id = p_holiday_id;
END $$
DROP PROCEDURE IF EXISTS sp_delete_it_proof $$
CREATE PROCEDURE `sp_delete_it_proof`(IN p_proof_id INT)
BEGIN
  DELETE FROM it_proof_documents WHERE proof_id = p_proof_id;
END $$
DROP PROCEDURE IF EXISTS sp_delete_salary_template $$
CREATE PROCEDURE `sp_delete_salary_template`(IN p_id INT)
BEGIN
  UPDATE salary_templates SET is_active = 0 WHERE template_id = p_id;
  SELECT ROW_COUNT() AS deleted;
END $$
DROP PROCEDURE IF EXISTS sp_delete_task $$
CREATE PROCEDURE `sp_delete_task`(IN p_task_id INT, IN p_employee_id INT, OUT p_affected INT)
BEGIN
  DELETE FROM employee_tasks WHERE task_id = p_task_id AND employee_id = p_employee_id;
  SET p_affected = ROW_COUNT();
END $$
DROP PROCEDURE IF EXISTS sp_delete_work_schedule $$
CREATE PROCEDURE `sp_delete_work_schedule`(IN p_employee_id INT)
BEGIN
  DELETE FROM employee_work_schedules WHERE employee_id = p_employee_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_disable_appraisal_cycle $$
CREATE PROCEDURE `sp_disable_appraisal_cycle`(
  IN p_admin_id INT, IN p_cycle_id INT, OUT p_ok TINYINT
)
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM appraisal_cycles WHERE cycle_id = p_cycle_id LIMIT 1;
  IF v_status != 'active' THEN SET p_ok = 0;
  ELSE
    UPDATE self_appraisals SET status='draft', submitted_at=NULL WHERE cycle_id=p_cycle_id;
    UPDATE appraisal_cycles SET status='inactive', disabled_at=NOW(), disabled_by=p_admin_id
     WHERE cycle_id=p_cycle_id;
    SET p_ok = 1;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_disable_mfa $$
CREATE PROCEDURE `sp_disable_mfa`(IN p_user_id INT)
BEGIN
  UPDATE users SET mfa_secret = NULL, mfa_enabled = 0 WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_disable_mfa_full $$
CREATE PROCEDURE `sp_disable_mfa_full`(IN p_user_id INT)
BEGIN
  UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_employee_checkin $$
CREATE PROCEDURE `sp_employee_checkin`(
  IN p_employee_id INT, IN p_date DATE, IN p_time TIME, IN p_shift_start TIME,
  IN p_lat DECIMAL(10,6), IN p_lng DECIMAL(10,6), IN p_location VARCHAR(200)
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;
  DECLARE v_existing_checkin TIME DEFAULT NULL;
  SELECT check_in INTO v_existing_checkin FROM attendance
   WHERE employee_id=p_employee_id AND attendance_date=p_date LIMIT 1;
  IF v_existing_checkin IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Already checked in for this date';
  END IF;
  IF p_shift_start IS NOT NULL AND p_time > p_shift_start THEN
    SET v_late_minutes=TIME_TO_SEC(TIMEDIFF(p_time,p_shift_start))/60;
  END IF;
  INSERT INTO attendance (employee_id,attendance_date,check_in,status,late_by_minutes,checkin_lat,checkin_lng,checkin_location,source)
  VALUES (p_employee_id,p_date,p_time,IF(v_late_minutes>0,'late','present'),v_late_minutes,p_lat,p_lng,p_location,'web')
  ON DUPLICATE KEY UPDATE check_in=IF(check_in IS NULL,VALUES(check_in),check_in),
    status=IF(check_in IS NULL,VALUES(status),status), late_by_minutes=IF(check_in IS NULL,VALUES(late_by_minutes),late_by_minutes),
    checkin_lat=IF(check_in IS NULL,VALUES(checkin_lat),checkin_lat), checkin_lng=IF(check_in IS NULL,VALUES(checkin_lng),checkin_lng),
    checkin_location=IF(check_in IS NULL,VALUES(checkin_location),checkin_location);
END $$
DROP PROCEDURE IF EXISTS sp_employee_checkout $$
CREATE PROCEDURE `sp_employee_checkout`(
    IN p_employee_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_lat DECIMAL(10,6),
    IN p_lng DECIMAL(10,6),
    IN p_location VARCHAR(200)
)
BEGIN
    DECLARE v_check_in TIME DEFAULT NULL;
    DECLARE v_last_punch ENUM('IN','OUT') DEFAULT NULL;
    DECLARE v_work_mins INT DEFAULT 0;
    DECLARE v_break_mins INT DEFAULT 0;
    DECLARE v_total_elapsed INT DEFAULT 0;
    DECLARE v_new_status VARCHAR(20) DEFAULT 'present';
    -- Get first check-in
    SELECT check_in
    INTO v_check_in
    FROM attendance
    WHERE employee_id = p_employee_id
      AND attendance_date = p_date
    LIMIT 1;
    -- No check-in
    IF v_check_in IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'No check-in found for today';
    END IF;
    -- Get latest punch
    SELECT punch_type
    INTO v_last_punch
    FROM attendance_punches
    WHERE employee_id = p_employee_id
      AND attendance_date = p_date
    ORDER BY punch_time DESC, punch_id DESC
    LIMIT 1;
    -- Prevent duplicate OUT
    IF v_last_punch = 'OUT' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Already checked out';
    END IF;
    -- Insert OUT punch
    INSERT INTO attendance_punches (
        employee_id,
        attendance_date,
        punch_time,
        punch_type,
        source,
        lat,
        lng,
        location
    )
    VALUES (
        p_employee_id,
        p_date,
        p_time,
        'OUT',
        'web',
        p_lat,
        p_lng,
        p_location
    );
    -- Calculate work minutes
    SET v_work_mins = (
        SELECT COALESCE(
            SUM(
                TIMESTAMPDIFF(
                    MINUTE,
                    in_punch.punch_time,
                    out_punch.punch_time
                )
            ),
            0
        )
        FROM (
            SELECT
                punch_time,
                ROW_NUMBER() OVER (
                    ORDER BY punch_time, punch_id
                ) AS rn
            FROM attendance_punches
            WHERE employee_id = p_employee_id
              AND attendance_date = p_date
              AND punch_type = 'IN'
        ) in_punch
        JOIN (
            SELECT
                punch_time,
                ROW_NUMBER() OVER (
                    ORDER BY punch_time, punch_id
                ) AS rn
            FROM attendance_punches
            WHERE employee_id = p_employee_id
              AND attendance_date = p_date
              AND punch_type = 'OUT'
        ) out_punch
            ON in_punch.rn = out_punch.rn
        WHERE out_punch.punch_time > in_punch.punch_time
    );
    -- Total elapsed time
    SET v_total_elapsed =
        TIMESTAMPDIFF(
            MINUTE,
            v_check_in,
            p_time
        );
    -- Handle overnight
    IF v_total_elapsed < 0 THEN
        SET v_total_elapsed =
            v_total_elapsed + 1440;
    END IF;
    -- Calculate break
    SET v_break_mins =
        GREATEST(
            0,
            v_total_elapsed - v_work_mins
        );
    -- Determine attendance status
    IF v_work_mins >= 540 THEN
        SET v_new_status = 'present';
    ELSEIF v_work_mins >= 360 THEN
        SET v_new_status = 'half_day';
    ELSE
        SET v_new_status = 'present';
    END IF;
    -- Update attendance
    UPDATE attendance
    SET
        check_out = p_time,
        work_hours =
            ROUND(
                v_work_mins / 60.0,
                2
            ),
        break_minutes = v_break_mins,
        total_punches =
            COALESCE(total_punches, 0) + 1,
        checkout_lat = p_lat,
        checkout_lng = p_lng,
        checkout_location = p_location,
        status = v_new_status,
        updated_at = NOW()
    WHERE employee_id = p_employee_id
      AND attendance_date = p_date;
    -- Return updated attendance
    SELECT
        a.*,
        ap_list.punches
    FROM attendance a
    LEFT JOIN (
        SELECT
            employee_id,
            attendance_date,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'time', punch_time,
                    'type', punch_type,
                    'location', location
                )
            ) AS punches
        FROM attendance_punches
        WHERE employee_id = p_employee_id
          AND attendance_date = p_date
        GROUP BY
            employee_id,
            attendance_date
    ) ap_list
        ON ap_list.employee_id = a.employee_id
       AND ap_list.attendance_date = a.attendance_date
    WHERE a.employee_id = p_employee_id
      AND a.attendance_date = p_date;
END $$
DROP PROCEDURE IF EXISTS sp_employee_dashboard $$
CREATE PROCEDURE `sp_employee_dashboard`(IN p_employee_id INT)
BEGIN
  SELECT SUM(status='approved') AS approved, SUM(status='pending') AS pending,
         SUM(status='rejected') AS rejected, SUM(status='draft') AS draft
    FROM weekly_timesheets WHERE employee_id = p_employee_id;
  SELECT COUNT(*) AS open_tasks FROM employee_tasks
   WHERE employee_id = p_employee_id AND status NOT IN ('completed','in_timesheet');
  SELECT COUNT(*) AS pending_leaves FROM leave_requests
   WHERE employee_id = p_employee_id AND status = 'Pending';
  SELECT lt.leave_type_name, IFNULL(lb.balance, lt.annual_quota) AS balance
    FROM leave_types lt
    LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id
          AND lb.employee_id   = p_employee_id
          AND lb.year          = YEAR(CURDATE())
   ORDER BY lt.leave_type_name;
END $$
DROP PROCEDURE IF EXISTS sp_employee_summary_report $$
CREATE PROCEDURE `sp_employee_summary_report`()
BEGIN
  SELECT employee_status AS status, COUNT(*) AS total FROM employees GROUP BY employee_status;
  SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS total
    FROM departments d
    LEFT JOIN employees e ON e.department_id=d.department_id AND e.employee_status='Active'
   GROUP BY d.department_id, d.department_name ORDER BY d.department_name;
  SELECT employee_type, COUNT(*) AS total FROM employees WHERE employee_status='Active' GROUP BY employee_type;
END $$
DROP PROCEDURE IF EXISTS sp_employee_timesheet_counts $$
CREATE PROCEDURE `sp_employee_timesheet_counts`(IN p_employee_id INT)
BEGIN
  SELECT SUM(status='draft') AS draft, SUM(status='pending') AS pending,
         SUM(status='approved') AS approved, SUM(status='rejected') AS rejected
    FROM weekly_timesheets WHERE employee_id = p_employee_id;
  SELECT COUNT(*) AS cnt FROM timesheet_entries WHERE employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_enable_mfa $$
CREATE PROCEDURE `sp_enable_mfa`(IN p_user_id INT, IN p_encrypted_secret VARCHAR(500))
BEGIN
  UPDATE users SET mfa_secret = p_encrypted_secret, mfa_enabled = 1 WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_enable_mfa_with_backup $$
CREATE PROCEDURE `sp_enable_mfa_with_backup`(IN p_user_id INT, IN p_backup_codes_json TEXT)
BEGIN
  UPDATE users SET mfa_enabled = 1, mfa_backup_codes = p_backup_codes_json WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_enroll_employee_appraisal $$
CREATE PROCEDURE `sp_enroll_employee_appraisal`(IN p_cycle_id INT, IN p_employee_id INT, IN p_admin_id INT)
BEGIN
  INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by)
  VALUES (p_cycle_id, p_employee_id, p_admin_id);
END $$
DROP PROCEDURE IF EXISTS sp_find_employee_by_empcode $$
CREATE PROCEDURE `sp_find_employee_by_empcode`(IN p_emp_code VARCHAR(30))
BEGIN
  SELECT employee_id FROM employees WHERE emp_code = p_emp_code LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_find_salary_structure $$
CREATE PROCEDURE `sp_find_salary_structure`(IN p_employee_id INT, IN p_effective_from DATE)
BEGIN
  SELECT id FROM salary_structures
   WHERE employee_id = p_employee_id AND effective_from = p_effective_from LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_generate_payslip $$
CREATE PROCEDURE `sp_generate_payslip`(
  IN p_employee_id INT,
  IN p_month TINYINT,
  IN p_year INT,
  IN p_payroll_run_id INT,
  OUT p_payslip_id INT
)
BEGIN
  DECLARE v_monthly_salary DECIMAL(12,2) DEFAULT 0;
  DECLARE v_basic DECIMAL(12,2) DEFAULT 0;
  DECLARE v_hra DECIMAL(12,2) DEFAULT 0;
  DECLARE v_allowances DECIMAL(12,2) DEFAULT 0;
  DECLARE v_deductions DECIMAL(12,2) DEFAULT 0;
  DECLARE v_gross DECIMAL(12,2) DEFAULT 0;
  DECLARE v_net DECIMAL(12,2) DEFAULT 0;
  DECLARE v_ctc DECIMAL(12,2) DEFAULT 0;
  DECLARE v_working_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_lop_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_paid_days DECIMAL(4,1) DEFAULT 0;
  DECLARE v_per_day DECIMAL(12,2) DEFAULT 0;
  SELECT COALESCE(
    (SELECT esa.ctc_annual / 12
       FROM employee_salary_assignments esa
      WHERE esa.employee_id = p_employee_id
        AND esa.is_active = 1
        AND esa.effective_from <= LAST_DAY(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'))
      ORDER BY esa.effective_from DESC
      LIMIT 1),
    e.base_salary,
    0
  )
  INTO v_monthly_salary
  FROM employees e
  WHERE e.employee_id = p_employee_id;
  SET v_basic = ROUND(v_monthly_salary * 0.50, 2);
  SET v_hra = ROUND(v_monthly_salary * 0.20, 2);
  SET v_allowances = ROUND(v_monthly_salary * 0.30, 2);
  SET v_deductions = ROUND(LEAST(v_basic, 15000) * 0.12, 2);
  SELECT COUNT(*) INTO v_working_days
  FROM (
    SELECT DATE_ADD(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'), INTERVAL seq.n DAY) AS work_date
    FROM (
      SELECT ones.n + tens.n * 10 AS n
      FROM (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones
      CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) tens
    ) seq
  ) dates
  WHERE dates.work_date <= LAST_DAY(STR_TO_DATE(CONCAT(p_year, '-', p_month, '-01'), '%Y-%m-%d'))
    AND DAYOFWEEK(dates.work_date) <> 1
    AND NOT EXISTS (
      SELECT 1 FROM holidays h
      JOIN employees e ON e.employee_id = p_employee_id
      WHERE h.holiday_date = dates.work_date
        AND (h.holiday_calendar = e.holiday_calendar OR h.holiday_calendar IS NULL)
    );
  SELECT COALESCE(SUM(CASE WHEN a.status = 'half_day' THEN 0.5 ELSE 1 END), 0)
    INTO v_lop_days
    FROM attendance a
   WHERE a.employee_id = p_employee_id
     AND MONTH(a.attendance_date) = p_month
     AND YEAR(a.attendance_date) = p_year
     AND a.status IN ('absent', 'half_day')
     AND NOT EXISTS (
       SELECT 1 FROM leave_requests lr
        WHERE lr.employee_id = a.employee_id
          AND lr.status = 'Approved'
          AND a.attendance_date BETWEEN lr.from_date AND lr.to_date
     );
  SET v_paid_days = GREATEST(v_working_days - v_lop_days, 0);
  SET v_per_day = IF(v_working_days > 0, v_monthly_salary / v_working_days, 0);
  SET v_gross = ROUND(v_per_day * v_paid_days, 2);
  SET v_net = GREATEST(ROUND(v_gross - v_deductions, 2), 0);
  SET v_ctc = ROUND(v_monthly_salary * 12, 2);
  INSERT INTO payslips (
    payroll_run_id, employee_id, month, year, basic, hra, allowances,
    gross_earnings, ctc, deductions, net_pay, working_days, paid_days, lop_days, status
  ) VALUES (
    p_payroll_run_id, p_employee_id, p_month, p_year, v_basic, v_hra, v_allowances,
    v_gross, v_ctc, v_deductions, v_net, v_working_days, v_paid_days, v_lop_days, 'Generated'
  )
  ON DUPLICATE KEY UPDATE
    payroll_run_id = COALESCE(p_payroll_run_id, payroll_run_id),
    basic = v_basic,
    hra = v_hra,
    allowances = v_allowances,
    gross_earnings = v_gross,
    ctc = v_ctc,
    deductions = v_deductions,
    net_pay = v_net,
    working_days = v_working_days,
    paid_days = v_paid_days,
    lop_days = v_lop_days,
    status = 'Generated',
    generated_on = NOW();
  SELECT payslip_id INTO p_payslip_id
    FROM payslips
   WHERE employee_id = p_employee_id AND month = p_month AND year = p_year;
END $$
DROP PROCEDURE IF EXISTS sp_get_active_appraisal_cycle $$
CREATE PROCEDURE `sp_get_active_appraisal_cycle`()
BEGIN
  SELECT * FROM appraisal_cycles WHERE status = 'active' ORDER BY cycle_id DESC LIMIT 1;
  SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_active_employees_basic $$
CREATE PROCEDURE `sp_get_active_employees_basic`()
BEGIN
  SELECT employee_id, emp_code, email,
         CONCAT(first_name,' ',IFNULL(last_name,'')) AS employee_name
    FROM employees WHERE employee_status='Active';
END $$
DROP PROCEDURE IF EXISTS sp_get_all_appraisals $$
CREATE PROCEDURE `sp_get_all_appraisals`(IN p_cycle_id INT, IN p_status VARCHAR(20), IN p_department_id INT)
BEGIN
  SELECT sa.appraisal_id, sa.status AS appraisal_status, sa.submitted_at, sa.overall_comments,
         e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_job_title, d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name
    FROM self_appraisals sa
    JOIN employees e ON e.employee_id = sa.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
   WHERE sa.cycle_id = p_cycle_id
     AND (p_status        IS NULL OR sa.status       = p_status)
     AND (p_department_id IS NULL OR e.department_id = p_department_id)
   ORDER BY sa.submitted_at DESC;
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_job_title, d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name
    FROM appraisal_enrollments ae
    JOIN employees e ON e.employee_id = ae.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
   WHERE ae.cycle_id = p_cycle_id
     AND ae.employee_id NOT IN (SELECT employee_id FROM self_appraisals WHERE cycle_id = p_cycle_id)
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_all_appraisal_cycles $$
CREATE PROCEDURE `sp_get_all_appraisal_cycles`()
BEGIN
  SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_all_it_cycles $$
CREATE PROCEDURE `sp_get_all_it_cycles`()
BEGIN
  SELECT * FROM it_declaration_cycles ORDER BY cycle_id DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_all_it_declarations $$
CREATE PROCEDURE `sp_get_all_it_declarations`(IN p_cycle_id INT)
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.email, e.emp_job_title AS job_title, d.department_name
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
   ORDER BY e.first_name, e.last_name;
  SELECT d.*, CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name
    FROM it_declarations d
    LEFT JOIN employees rev ON rev.employee_id = d.reviewed_by
   WHERE d.cycle_id = p_cycle_id;
  SELECT i.* FROM it_declaration_items i
    JOIN it_declarations d ON d.declaration_id = i.declaration_id
   WHERE d.cycle_id = p_cycle_id;
  SELECT p.* FROM it_proof_documents p
    JOIN it_declarations d ON d.declaration_id = p.declaration_id
   WHERE d.cycle_id = p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_all_resignations $$
CREATE PROCEDURE `sp_get_all_resignations`(
    IN p_status VARCHAR(30),
    IN p_search VARCHAR(200)
)
BEGIN
    SELECT r.*,
           CONCAT(e.first_name,' ',e.last_name) AS employee_name,
           e.emp_code,
           e.emp_job_title AS job_title,
           d.department_name,
           CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
           CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rev ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr ON mgr.employee_id = r.manager_reviewed_by
    WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
      AND (
          p_search IS NULL
          OR CONCAT(e.first_name,' ',e.last_name)
             COLLATE utf8mb4_unicode_ci
             LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
          OR e.emp_code
             COLLATE utf8mb4_unicode_ci
             LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
          OR d.department_name
             COLLATE utf8mb4_unicode_ci
             LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
      )
    ORDER BY r.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_appraisal $$
CREATE PROCEDURE `sp_get_appraisal`(IN p_appraisal_id INT)
BEGIN
  SELECT sa.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.reporting_to
    FROM self_appraisals sa
    JOIN employees e ON e.employee_id = sa.employee_id
   WHERE sa.appraisal_id = p_appraisal_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_appraisal_enrollments $$
CREATE PROCEDURE `sp_get_appraisal_enrollments`(IN p_cycle_id INT)
BEGIN
  SELECT ae.employee_id, ae.enrolled_at,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name,
         sa.status AS appraisal_status
    FROM appraisal_enrollments ae
    JOIN employees e ON e.employee_id = ae.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees m  ON m.employee_id    = e.reporting_to
    LEFT JOIN self_appraisals sa
           ON sa.employee_id = ae.employee_id AND sa.cycle_id = ae.cycle_id
   WHERE ae.cycle_id = p_cycle_id
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_appraisal_ratings $$
CREATE PROCEDURE `sp_get_appraisal_ratings`(IN p_appraisal_id INT)
BEGIN
  SELECT * FROM appraisal_ratings WHERE appraisal_id = p_appraisal_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_appraisal_ratings_summary $$
CREATE PROCEDURE `sp_get_appraisal_ratings_summary`(IN p_appraisal_id INT)
BEGIN
  SELECT self_rating, manager_rating FROM appraisal_ratings WHERE appraisal_id = p_appraisal_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_attendance_regularization $$
CREATE PROCEDURE `sp_get_attendance_regularization`(IN p_id INT)
BEGIN
  SELECT r.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM attendance_regularization r
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id = r.reviewed_by
   WHERE r.regularization_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_auto_seed_employees $$
CREATE PROCEDURE `sp_get_auto_seed_employees`()
BEGIN
  SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name,
         e.department_id, d.designation_name
    FROM employees e
    LEFT JOIN designations d ON d.designation_id=e.designation_id
   WHERE e.employee_status='Active'
   ORDER BY e.employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_company $$
CREATE PROCEDURE `sp_get_company`()
BEGIN
  SELECT * FROM companies LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_delegation $$
CREATE PROCEDURE `sp_get_delegation`(IN p_id INT)
BEGIN
  SELECT wd.*,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegator_name,
         CONCAT(dt.first_name,' ',IFNULL(dt.last_name,'')) AS delegate_name
    FROM workflow_delegations wd
    LEFT JOIN employees d  ON d.employee_id  = wd.delegator_id
    LEFT JOIN employees dt ON dt.employee_id = wd.delegate_id
   WHERE wd.id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_departments $$
CREATE PROCEDURE `sp_get_departments`()
BEGIN
  SELECT * FROM departments ORDER BY department_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_designation $$
CREATE PROCEDURE `sp_get_designation`(IN p_id INT)
BEGIN
  SELECT * FROM designations WHERE designation_id = p_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_designations $$
CREATE PROCEDURE `sp_get_designations`(IN p_department_id INT)
BEGIN
  SELECT * FROM designations
   WHERE (p_department_id IS NULL OR department_id = p_department_id)
   ORDER BY designation_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_document $$
CREATE PROCEDURE `sp_get_document`(IN p_id INT)
BEGIN
  SELECT d.*, dc.category_name,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(u.first_name,' ',IFNULL(u.last_name,'')) AS uploaded_by_name
    FROM documents d
    LEFT JOIN document_categories dc ON dc.category_id=d.category_id
    LEFT JOIN employees e ON e.employee_id=d.employee_id
    LEFT JOIN employees u ON u.employee_id=d.uploaded_by
   WHERE d.document_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_directory $$
CREATE PROCEDURE `sp_get_employee_directory`(
  IN p_location         VARCHAR(100),
  IN p_department       INT,
  IN p_holiday_calendar VARCHAR(100)
)
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reporting_to_name,
         m.emp_code AS reporting_to_code
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
   WHERE e.employee_status = 'Active'
     AND (p_department       IS NULL OR e.department_id    = p_department)
     AND (p_location         IS NULL OR e.location         = p_location)
     AND (p_holiday_calendar IS NULL OR e.holiday_calendar = p_holiday_calendar)
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_display_name $$
CREATE PROCEDURE `sp_get_employee_display_name`(IN p_employee_id INT)
BEGIN
  SELECT CONCAT(first_name, ' ', IFNULL(last_name, '')) AS name
  FROM employees
  WHERE employee_id = p_employee_id
  LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_profile $$
CREATE PROCEDURE `sp_get_employee_profile`(IN p_employee_id INT)
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reporting_to_name,
         m.emp_code AS reporting_to_code,
         ci.current_address, ci.permanent_address, ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         ci.contact_name, ci.contact_city, ci.contact_country,
         ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3,
         bd.bank_name, bd.account_number, bd.ifsc_code,
         bd.uan_number, bd.account_type, bd.bank_branch, bd.dd_payable_at,
         bd.account_holder_name, bd.payment_type,
         EXISTS(SELECT 1 FROM resignations r
                WHERE r.employee_id = e.employee_id
                  AND r.status IN ('pending','rm_approved','accepted')) AS serving_notice
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
   WHERE e.employee_id = p_employee_id;
  SELECT * FROM employee_contact_info WHERE employee_id = p_employee_id;
  SELECT * FROM employee_bank_details  WHERE employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_salary_assignment $$
CREATE PROCEDURE `sp_get_employee_salary_assignment`(
  IN p_employee_id INT
)
BEGIN
  -- Result set 1: assignment meta
  SELECT
    esa.assignment_id,
    esa.employee_id,
    esa.structure_id,
    ss.structure_name,
    ss.description  AS structure_description,
    esa.ctc_annual,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
    esa.effective_from,
    esa.effective_to,
    esa.is_active
  FROM employee_salary_assignments esa
  JOIN salary_structures ss ON ss.structure_id = esa.structure_id
  WHERE esa.employee_id = p_employee_id
    AND esa.is_active   = 1
  ORDER BY esa.effective_from DESC
  LIMIT 1;
  -- Result set 2: structure component lines (with effective calc values)
  SELECT
    l.line_id,
    l.structure_id,
    l.component_id,
    c.component_name,
    c.component_code,
    c.category,
    c.frequency,
    c.show_offer_letter,
    c.show_ctc_breakup,
    c.show_payslip,
    c.is_taxable,
    c.pf_applicable,
    c.esi_applicable,
    c.gratuity_applicable,
    COALESCE(l.calc_type_override,       c.calc_type)         AS effective_calc_type,
    COALESCE(l.percentage_override,      c.percentage_value)  AS effective_pct,
    COALESCE(l.percentage_of_override,   c.percentage_of)     AS effective_pct_of,
    COALESCE(l.formula_override,         c.formula_expr)      AS effective_formula,
    l.fixed_amount,
    l.sort_order,
    c.is_system,
    c.is_active
  FROM employee_salary_assignments esa
  JOIN salary_structure_lines l ON l.structure_id = esa.structure_id AND l.is_active = 1
  JOIN salary_components c      ON c.component_id  = l.component_id  AND c.is_active = 1
  WHERE esa.employee_id = p_employee_id
    AND esa.is_active   = 1
  ORDER BY l.sort_order, c.sort_order;
END $$
DROP PROCEDURE IF EXISTS sp_get_employee_team $$
CREATE PROCEDURE `sp_get_employee_team`(
    IN p_employee_id INT
)
BEGIN
    SELECT
        e.*,
        d.department_name,
        ds.designation_name,
        CONCAT(
            m.first_name,
            ' ',
            IFNULL(m.last_name, '')
        ) AS reporting_to_name,
        m.emp_code AS reporting_to_code
    FROM employees e
    LEFT JOIN departments d
        ON d.department_id = e.department_id
    LEFT JOIN designations ds
        ON ds.designation_id = e.designation_id
    LEFT JOIN employees m
        ON m.employee_id = e.reporting_to
    WHERE e.employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_holiday_by_id $$
CREATE PROCEDURE `sp_get_holiday_by_id`(IN p_holiday_id INT)
BEGIN
  SELECT * FROM holidays WHERE holiday_id = p_holiday_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_it_declaration_by_id $$
CREATE PROCEDURE `sp_get_it_declaration_by_id`(IN p_declaration_id INT)
BEGIN
  SELECT * FROM it_declarations WHERE declaration_id = p_declaration_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_it_proof $$
CREATE PROCEDURE `sp_get_it_proof`(IN p_proof_id INT, IN p_employee_id INT, IN p_is_admin TINYINT)
BEGIN
  IF p_is_admin THEN
    SELECT * FROM it_proof_documents WHERE proof_id = p_proof_id;
  ELSE
    SELECT * FROM it_proof_documents WHERE proof_id = p_proof_id AND employee_id = p_employee_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_get_job $$
CREATE PROCEDURE `sp_get_job`(IN p_id INT)
BEGIN
  SELECT j.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name,
         d.department_name, NULL AS designation_name
    FROM jobs j
    LEFT JOIN employees e   ON e.employee_id   = j.created_by
    LEFT JOIN departments d ON d.department_id = j.department_id
   WHERE j.job_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_job_application $$
CREATE PROCEDURE `sp_get_job_application`(IN p_id INT)
BEGIN
  SELECT ja.*, j.title AS job_title, j.department_id,
         NULL AS referred_by_name,
         d.department_name
    FROM job_applications ja
    JOIN jobs j ON j.job_id = ja.job_id
    LEFT JOIN departments d ON d.department_id = j.department_id
   WHERE ja.application_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_latest_it_cycle $$
CREATE PROCEDURE `sp_get_latest_it_cycle`()
BEGIN
  SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
    FROM it_declaration_cycles c
    LEFT JOIN employees e ON e.employee_id = c.created_by
   ORDER BY c.cycle_id DESC LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_latest_salary_structure $$
CREATE PROCEDURE `sp_get_latest_salary_structure`(IN p_employee_id INT)
BEGIN
  SELECT s.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM salary_structures s
    JOIN employees e ON e.employee_id = s.employee_id
   WHERE s.employee_id = p_employee_id
   ORDER BY s.effective_from DESC LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_leave_balances $$
CREATE PROCEDURE `sp_get_leave_balances`(IN p_employee_id INT, IN p_year INT)
BEGIN
  SELECT lt.leave_type_id, lt.leave_type_name, lt.annual_quota, lt.carry_forward_limit,
         IFNULL(lb.opening_balance, 0)       AS opening_balance,
         IFNULL(lb.granted, lt.annual_quota) AS granted,
         IFNULL(lb.availed, 0)               AS availed,
         IFNULL(lb.balance, lt.annual_quota) AS balance
    FROM leave_types lt
    LEFT JOIN leave_balances lb
           ON lb.leave_type_id = lt.leave_type_id
          AND lb.employee_id   = p_employee_id
          AND lb.year          = p_year
   ORDER BY lt.leave_type_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_leave_email_pair $$
CREATE PROCEDURE `sp_get_leave_email_pair`(IN p_employee_id INT)
BEGIN
  SELECT
    e.email                                              AS emp_email,
    CONCAT(e.first_name, ' ', IFNULL(e.last_name, ''))   AS emp_name,
    mgr.email                                            AS mgr_email,
    CONCAT(mgr.first_name, ' ', IFNULL(mgr.last_name, '')) AS mgr_name
  FROM employees e
  LEFT JOIN employees mgr ON mgr.employee_id = e.reporting_to
  WHERE e.employee_id = p_employee_id
  LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_leave_request $$
CREATE PROCEDURE `sp_get_leave_request`(IN p_id INT)
BEGIN
  SELECT lr.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, lt.leave_type_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e    ON e.employee_id   = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv  ON rv.employee_id  = lr.reviewed_by
   WHERE lr.leave_request_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_leave_summary $$
CREATE PROCEDURE `sp_get_leave_summary`(IN p_year INT, IN p_department_id INT, IN p_status VARCHAR(30))
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.employee_status, e.emp_joining_date, NULL AS confirmation_date,
         d.department_name, des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status != 'Deleted'
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_status        IS NULL OR e.employee_status = p_status)
   ORDER BY e.emp_code;
  SELECT leave_type_id, leave_type_name FROM leave_types ORDER BY leave_type_name;
  SELECT lb.employee_id, lb.leave_type_id, lb.opening_balance, lb.granted, lb.availed,
         GREATEST(0, lb.opening_balance + lb.granted - lb.availed) AS closing_balance
    FROM leave_balances lb WHERE lb.year = p_year;
  SELECT lr.employee_id, lr.leave_type_id, MONTH(lr.from_date) AS month, SUM(lr.days) AS days_taken
    FROM leave_requests lr
   WHERE lr.status = 'Approved' AND YEAR(lr.from_date) = p_year
   GROUP BY lr.employee_id, lr.leave_type_id, MONTH(lr.from_date);
END $$
DROP PROCEDURE IF EXISTS sp_get_managers_list $$
CREATE PROCEDURE `sp_get_managers_list`()
BEGIN
  SELECT mgr.employee_id,
         CONCAT(mgr.first_name,' ',IFNULL(mgr.last_name,'')) AS full_name,
         d.designation_name, dp.department_name, dp.department_id,
         mgr.employee_status,
         (SELECT COUNT(*) FROM employees s WHERE s.reporting_to=mgr.employee_id AND s.employee_status='Active') AS team_count
    FROM employees mgr
    INNER JOIN users u ON u.employee_id = mgr.employee_id AND u.role_id = 3
    LEFT JOIN designations d  ON d.designation_id = mgr.designation_id
    LEFT JOIN departments  dp ON dp.department_id = mgr.department_id
   WHERE mgr.employee_status='Active'
   ORDER BY mgr.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_manager_details $$
CREATE PROCEDURE `sp_get_manager_details`(IN p_manager_id INT)
BEGIN
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.employee_id=p_manager_id;
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.reporting_to=p_manager_id AND e.employee_status != 'Terminated';
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.reporting_to IN (
     SELECT employee_id FROM employees WHERE reporting_to=p_manager_id AND employee_status != 'Terminated'
   )
   AND e.employee_status != 'Terminated';
END $$
DROP PROCEDURE IF EXISTS sp_get_mfa_secret $$
CREATE PROCEDURE `sp_get_mfa_secret`(IN p_user_id INT)
BEGIN
  SELECT mfa_secret, mfa_enabled FROM users WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_mfa_status $$
CREATE PROCEDURE `sp_get_mfa_status`(IN p_user_id INT)
BEGIN
  SELECT email, mfa_enabled FROM users WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_monthly_attendance $$
CREATE PROCEDURE `sp_get_monthly_attendance`(
    IN p_employee_id INT,
    IN p_month INT,
    IN p_year INT
)
BEGIN
    SELECT
        a.*,
        COALESCE(
            pc.punch_count,
            0
        ) AS punch_count,
        COALESCE(
            pc.break_sessions,
            0
        ) AS break_sessions
    FROM attendance a
    LEFT JOIN (
        SELECT
            employee_id,
            attendance_date,
            COUNT(*) AS punch_count,
            GREATEST(
                FLOOR(COUNT(*) / 2) - 1,
                0
            ) AS break_sessions
        FROM attendance_punches
        WHERE employee_id = p_employee_id
          AND MONTH(attendance_date) = p_month
          AND YEAR(attendance_date) = p_year
        GROUP BY
            employee_id,
            attendance_date
    ) pc
        ON pc.employee_id = a.employee_id
       AND pc.attendance_date = a.attendance_date
    WHERE a.employee_id = p_employee_id
      AND MONTH(a.attendance_date) = p_month
      AND YEAR(a.attendance_date) = p_year
    ORDER BY
        a.attendance_date;
END $$
DROP PROCEDURE IF EXISTS sp_get_my_appraisal $$
CREATE PROCEDURE `sp_get_my_appraisal`(IN p_employee_id INT, IN p_cycle_id INT)
BEGIN
  SELECT * FROM self_appraisals WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id;
  SELECT ar.* FROM appraisal_ratings ar
    JOIN self_appraisals sa ON sa.appraisal_id = ar.appraisal_id
   WHERE sa.cycle_id = p_cycle_id AND sa.employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_my_it_declaration $$
CREATE PROCEDURE `sp_get_my_it_declaration`(IN p_employee_id INT)
BEGIN
  SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
    FROM it_declaration_cycles c
    LEFT JOIN employees e ON e.employee_id = c.created_by
   ORDER BY c.cycle_id DESC LIMIT 1;
  SELECT d.* FROM it_declarations d
    JOIN (SELECT cycle_id FROM it_declaration_cycles ORDER BY cycle_id DESC LIMIT 1) latest USING (cycle_id)
   WHERE d.employee_id = p_employee_id LIMIT 1;
  SELECT i.* FROM it_declaration_items i
    JOIN it_declarations d ON d.declaration_id = i.declaration_id
    JOIN (SELECT cycle_id FROM it_declaration_cycles ORDER BY cycle_id DESC LIMIT 1) latest USING (cycle_id)
   WHERE d.employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_my_it_proofs $$
CREATE PROCEDURE `sp_get_my_it_proofs`(IN p_employee_id INT)
BEGIN
  SELECT p.*, CONCAT(e.first_name,' ',e.last_name) AS reviewed_by_name
    FROM it_proof_documents p
    LEFT JOIN employees e ON e.employee_id = p.reviewed_by
   WHERE p.declaration_id IN (
     SELECT d.declaration_id FROM it_declarations d
       JOIN (SELECT cycle_id FROM it_declaration_cycles ORDER BY cycle_id DESC LIMIT 1) latest USING (cycle_id)
      WHERE d.employee_id = p_employee_id
   )
   ORDER BY p.uploaded_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_my_resignations $$
CREATE PROCEDURE `sp_get_my_resignations`(IN p_employee_id INT)
BEGIN
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.emp_code, e.emp_job_title AS job_title, d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e      ON e.employee_id  = r.employee_id
    LEFT JOIN departments d   ON d.department_id = e.department_id
    LEFT JOIN employees rev   ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr   ON mgr.employee_id = r.manager_reviewed_by
   WHERE r.employee_id = p_employee_id
   ORDER BY r.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_my_timesheets $$
CREATE PROCEDURE `sp_get_my_timesheets`(IN p_employee_id INT)
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
    LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
   WHERE wt.employee_id = p_employee_id
   ORDER BY wt.week_start DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_org_chart $$
CREATE PROCEDURE `sp_get_org_chart`()
BEGIN
  SELECT e.employee_id, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.reporting_to, e.profile_photo,
         d.department_name, d.department_id, des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status = 'Active' AND e.has_left_organization = 0
   ORDER BY e.employee_id ASC;
END $$
DROP PROCEDURE IF EXISTS sp_get_org_employees $$
CREATE PROCEDURE `sp_get_org_employees`(IN p_department_id INT, IN p_status VARCHAR(20))
BEGIN
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email,
         e.employee_status, e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE (p_department_id IS NULL OR dp.department_id = p_department_id)
     AND (p_status        IS NULL OR e.employee_status = p_status)
   ORDER BY e.employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_org_history $$
CREATE PROCEDURE `sp_get_org_history`(
  IN p_employee_id INT, IN p_manager_id INT, IN p_change_type VARCHAR(20),
  IN p_limit INT, IN p_offset INT
)
BEGIN
DECLARE v_limit INT DEFAULT 50;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = COALESCE(p_limit, 50);
    SET v_offset = COALESCE(p_offset, 0);
  SELECT rh.*,
         CONCAT(emp.first_name,' ',IFNULL(emp.last_name,''))   AS employee_name,
         CONCAT(omgr.first_name,' ',IFNULL(omgr.last_name,'')) AS old_manager_name,
         CONCAT(nmgr.first_name,' ',IFNULL(nmgr.last_name,'')) AS new_manager_name,
         CONCAT(cb.first_name,' ',IFNULL(cb.last_name,''))     AS changed_by_name
    FROM reporting_history rh
    JOIN employees emp ON emp.employee_id=rh.employee_id
    LEFT JOIN employees omgr ON omgr.employee_id=rh.old_manager_id
    LEFT JOIN employees nmgr ON nmgr.employee_id=rh.new_manager_id
    LEFT JOIN employees cb   ON cb.employee_id=rh.changed_by
   WHERE (p_employee_id IS NULL OR rh.employee_id=p_employee_id)
     AND (p_manager_id  IS NULL OR rh.old_manager_id=p_manager_id OR rh.new_manager_id=p_manager_id)
     AND (p_change_type IS NULL OR rh.change_type=p_change_type)
   ORDER BY rh.created_at DESC
    LIMIT v_offset, v_limit;
  SELECT COUNT(*) AS total FROM reporting_history rh
   WHERE (p_employee_id IS NULL OR rh.employee_id=p_employee_id)
     AND (p_manager_id  IS NULL OR rh.old_manager_id=p_manager_id OR rh.new_manager_id=p_manager_id)
     AND (p_change_type IS NULL OR rh.change_type=p_change_type);
END $$
DROP PROCEDURE IF EXISTS sp_get_org_tree_data $$
CREATE PROCEDURE `sp_get_org_tree_data`(
    IN p_department_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    -- Result 1: Employees
    SELECT
        e.employee_id,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.email,
        e.employee_status,
        e.reporting_to,
        e.emp_joining_date,
        e.employee_type,
        d.designation_name,
        dp.department_name,
        dp.department_id,
        CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS full_name
    FROM employees e
    LEFT JOIN designations d
        ON d.designation_id = e.designation_id
    LEFT JOIN departments dp
        ON dp.department_id = e.department_id
    WHERE e.employee_status <> 'Terminated'
      AND (p_department_id IS NULL OR dp.department_id = p_department_id)
      AND (
            p_status IS NULL
            OR e.employee_status COLLATE utf8mb4_unicode_ci =
               p_status COLLATE utf8mb4_unicode_ci
          )
    ORDER BY e.first_name;
    -- Result 2: Active Delegations
    SELECT
        wd.employee_id,
        CONCAT(d.first_name, ' ', IFNULL(d.last_name, '')) AS delegate_name
    FROM workflow_delegates wd
    INNER JOIN employees d
        ON d.employee_id = wd.delegate_employee_id
    WHERE wd.status = 'Active'
      AND wd.to_date >= CURDATE();
    -- Result 3: Direct Report Counts
    SELECT
        reporting_to,
        COUNT(*) AS cnt
    FROM employees
    WHERE employee_status <> 'Terminated'
      AND reporting_to IS NOT NULL
    GROUP BY reporting_to;
END $$
DROP PROCEDURE IF EXISTS sp_get_or_create_appraisal $$
CREATE PROCEDURE `sp_get_or_create_appraisal`(
  IN  p_cycle_id         INT,
  IN  p_employee_id      INT,
  IN  p_overall_comments TEXT,
  OUT p_appraisal_id     INT,
  OUT p_is_submitted     TINYINT
)
BEGIN
  SELECT appraisal_id, IF(status = 'submitted', 1, 0)
    INTO p_appraisal_id, p_is_submitted
    FROM self_appraisals WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id LIMIT 1;
  IF p_appraisal_id IS NULL THEN
    INSERT INTO self_appraisals (cycle_id, employee_id, status, overall_comments)
    VALUES (p_cycle_id, p_employee_id, 'draft', p_overall_comments);
    SET p_appraisal_id = LAST_INSERT_ID();
    SET p_is_submitted = 0;
  ELSE
    UPDATE self_appraisals SET overall_comments = p_overall_comments WHERE appraisal_id = p_appraisal_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_get_or_create_it_declaration $$
CREATE PROCEDURE `sp_get_or_create_it_declaration`(
  IN p_employee_id INT, IN p_cycle_id INT, OUT p_declaration_id INT
)
BEGIN
  DECLARE v_id INT;
  SELECT declaration_id INTO v_id FROM it_declarations
   WHERE employee_id=p_employee_id AND cycle_id=p_cycle_id LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO it_declarations (cycle_id, employee_id) VALUES (p_cycle_id, p_employee_id);
    SET v_id = LAST_INSERT_ID();
  END IF;
  SET p_declaration_id = v_id;
  SELECT * FROM it_declarations WHERE declaration_id=v_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_payroll_run $$
CREATE PROCEDURE `sp_get_payroll_run`(IN p_id INT)
BEGIN
  SELECT pr.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS processed_by_name
    FROM payroll_runs pr
    LEFT JOIN employees e ON e.employee_id = pr.processed_by
   WHERE pr.payroll_run_id = p_id;
  SELECT p.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
   WHERE p.payroll_run_id = p_id
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_payslip $$
CREATE PROCEDURE `sp_get_payslip`(IN p_id INT)
BEGIN
  SELECT p.*,
         ROUND(p.gross_earnings + LEAST(p.basic, 15000) * 0.12, 2) AS ctc_computed,
         e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, des.designation_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE p.payslip_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_payslip_full $$
CREATE PROCEDURE `sp_get_payslip_full`(IN p_id INT)
BEGIN
  SELECT p.*,
         e.emp_code, e.first_name, e.last_name, e.emp_job_title, e.location,
         e.pf_number, e.employee_id AS emp_id,
         e.emp_joining_date,
         d.department_name, d.company_id,
         des.designation_name,
         c.company_name, c.address AS company_address,
         b.bank_name, b.account_number, b.pan_number, b.uan_number
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
    LEFT JOIN companies c ON c.company_id = d.company_id
    LEFT JOIN employee_bank_details b ON b.employee_id = e.employee_id
   WHERE p.payslip_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_payslip_raw $$
CREATE PROCEDURE `sp_get_payslip_raw`(IN p_id INT)
BEGIN
  SELECT * FROM payslips WHERE payslip_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_referral $$
CREATE PROCEDURE `sp_get_referral`(IN p_id INT)
BEGIN
  SELECT r.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS referred_by_name,
         e.emp_code, j.title AS job_title
    FROM referrals r
    JOIN employees e ON e.employee_id = r.referred_by
    JOIN jobs j      ON j.job_id      = r.job_id
   WHERE r.referral_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_request_hub $$
CREATE PROCEDURE `sp_get_request_hub`(IN p_id INT)
BEGIN
  SELECT rh.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS approved_by_name,
         d.department_name
    FROM request_hub rh
    JOIN employees e ON e.employee_id = rh.employee_id
    LEFT JOIN employees a ON a.employee_id = rh.reviewed_by
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE rh.request_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_resignation_by_id $$
CREATE PROCEDURE `sp_get_resignation_by_id`(IN p_resignation_id INT)
BEGIN
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.emp_code, e.emp_job_title AS job_title, d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e    ON e.employee_id  = r.employee_id
    LEFT JOIN departments d  ON d.department_id = e.department_id
    LEFT JOIN employees rev  ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr  ON mgr.employee_id = r.manager_reviewed_by
   WHERE r.resignation_id = p_resignation_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_review $$
CREATE PROCEDURE `sp_get_review`(IN p_review_id INT)
BEGIN
  SELECT r.*, rt.name AS review_type_name, rt.frequency,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM reviews r
    JOIN review_types rt ON rt.review_type_id = r.review_type_id
    JOIN employees e     ON e.employee_id      = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id   = r.reviewer_id
   WHERE r.review_id = p_review_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_role $$
CREATE PROCEDURE `sp_get_role`(IN p_role_id INT)
BEGIN
  SELECT * FROM roles WHERE role_id = p_role_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_role_permissions $$
CREATE PROCEDURE `sp_get_role_permissions`(IN p_role_id INT)
BEGIN
  SELECT p.permission_id, p.module, p.action,
         IFNULL(rp.allowed, 0) AS allowed
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.permission_id AND rp.role_id = p_role_id
   ORDER BY p.module, p.action;
END $$
DROP PROCEDURE IF EXISTS sp_get_salary_assignment_history $$
CREATE PROCEDURE `sp_get_salary_assignment_history`(IN p_employee_id INT)
BEGIN
  SELECT
    esa.*,
    ss.structure_name,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly
  FROM employee_salary_assignments esa
  JOIN salary_structures ss ON ss.structure_id = esa.structure_id
  WHERE esa.employee_id = p_employee_id
  ORDER BY esa.effective_from DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_salary_component $$
CREATE PROCEDURE `sp_get_salary_component`(IN p_id INT)
BEGIN
  SELECT * FROM salary_components WHERE component_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_salary_structure $$
CREATE PROCEDURE `sp_get_salary_structure`(IN p_id INT)
BEGIN
  SELECT s.*, COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.structure_id = p_id
   GROUP BY s.structure_id;
  SELECT l.*, c.component_name, c.component_code, c.category,
         c.calc_type AS master_calc_type,
         c.percentage_value AS master_pct_value,
         c.percentage_of AS master_pct_of,
         c.formula_expr AS master_formula,
         c.frequency, c.show_offer_letter, c.show_ctc_breakup, c.show_payslip,
         COALESCE(l.calc_type_override, c.calc_type)       AS effective_calc_type,
         COALESCE(l.percentage_override, c.percentage_value) AS effective_pct,
         COALESCE(l.percentage_of_override, c.percentage_of) AS effective_pct_of,
         COALESCE(l.formula_override, c.formula_expr)       AS effective_formula
    FROM salary_structure_lines l
    JOIN salary_components c ON c.component_id = l.component_id
   WHERE l.structure_id = p_id AND l.is_active = 1
   ORDER BY l.sort_order, c.sort_order;
END $$
DROP PROCEDURE IF EXISTS sp_get_salary_structure_raw $$
CREATE PROCEDURE `sp_get_salary_structure_raw`(IN p_id INT)
BEGIN
  SELECT * FROM salary_structures WHERE id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_salary_template $$
CREATE PROCEDURE `sp_get_salary_template`(IN p_id INT)
BEGIN
  SELECT * FROM salary_templates WHERE template_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_task $$
CREATE PROCEDURE `sp_get_task`(IN p_task_id INT)
BEGIN
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_team_appraisals $$
CREATE PROCEDURE `sp_get_team_appraisals`(IN p_manager_id INT, IN p_cycle_id INT)
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_job_title, d.department_name,
         sa.appraisal_id, sa.status AS appraisal_status,
         sa.submitted_at, sa.overall_comments
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN self_appraisals sa ON sa.employee_id = e.employee_id AND sa.cycle_id = p_cycle_id
    INNER JOIN appraisal_enrollments ae ON ae.employee_id = e.employee_id AND ae.cycle_id = p_cycle_id
   WHERE e.reporting_to = p_manager_id AND e.employee_status = 'Active'
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_team_details $$
CREATE PROCEDURE `sp_get_team_details`(IN p_team_id INT)
BEGIN
  SELECT t.*, CONCAT(l.first_name,' ',IFNULL(l.last_name,'')) AS lead_name
    FROM teams t
    LEFT JOIN employees l ON l.employee_id = t.lead_employee_id
   WHERE t.team_id = p_team_id;
  SELECT tm.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, d.department_name
    FROM team_members tm
    JOIN employees e ON e.employee_id = tm.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE tm.team_id = p_team_id
   ORDER BY tm.is_lead DESC, e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_team_resignations $$
CREATE PROCEDURE `sp_get_team_resignations`(IN p_manager_id INT, IN p_status VARCHAR(30))
BEGIN
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.emp_code, e.emp_job_title AS job_title, d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e    ON e.employee_id  = r.employee_id
    LEFT JOIN departments d  ON d.department_id = e.department_id
    LEFT JOIN employees rev  ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr  ON mgr.employee_id = r.manager_reviewed_by
   WHERE e.reporting_to = p_manager_id
     AND (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
   ORDER BY r.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_get_ticket_with_comments $$
CREATE PROCEDURE `sp_get_ticket_with_comments`(IN p_ticket_id INT)
BEGIN
  SELECT t.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS assigned_to_name
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
    LEFT JOIN employees a ON a.employee_id = t.assigned_to
   WHERE t.ticket_id = p_ticket_id;
  SELECT c.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS commented_by_name
    FROM helpdesk_comments c
    JOIN employees e ON e.employee_id = c.commented_by
   WHERE c.ticket_id = p_ticket_id
   ORDER BY c.created_at ASC;
END $$
DROP PROCEDURE IF EXISTS sp_get_timesheet $$
CREATE PROCEDURE `sp_get_timesheet`(IN p_timesheet_id INT)
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
    LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
   WHERE wt.timesheet_id = p_timesheet_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_timesheet_entries $$
CREATE PROCEDURE `sp_get_timesheet_entries`(IN p_timesheet_id INT)
BEGIN
  SELECT te.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name
    FROM timesheet_entries te
    JOIN employees e ON e.employee_id = te.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE te.timesheet_id = p_timesheet_id
   ORDER BY te.work_date, te.start_time;
END $$
DROP PROCEDURE IF EXISTS sp_get_today_attendance $$
CREATE PROCEDURE `sp_get_today_attendance`(IN p_employee_id INT)
BEGIN
  SELECT a.attendance_id, a.employee_id, a.attendance_date,
         a.check_in, a.check_out, a.status,
         a.work_hours, a.break_minutes, a.late_by_minutes,
         a.is_on_break, a.total_punches, a.source,
         a.checkin_lat, a.checkin_lng, a.checkin_location,
         a.checkout_lat, a.checkout_lng, a.checkout_location
  FROM attendance a
  WHERE a.employee_id = p_employee_id AND a.attendance_date = CURDATE();
  SELECT punch_id, punch_type, DATE_FORMAT(punch_time,'%H:%i') AS punch_time, location
  FROM attendance_punches
  WHERE employee_id = p_employee_id AND attendance_date = CURDATE()
  ORDER BY punch_time ASC;
END $$
DROP PROCEDURE IF EXISTS sp_get_unassigned_employees $$
CREATE PROCEDURE `sp_get_unassigned_employees`()
BEGIN
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN users u ON u.employee_id=e.employee_id
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE (e.reporting_to IS NULL OR e.reporting_to=0)
     AND e.employee_status='Active'
     AND (u.role_id IS NULL OR u.role_id != 1)
   ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_get_user_by_id $$
CREATE PROCEDURE `sp_get_user_by_id`(IN p_user_id INT)
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.user_id = p_user_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_user_for_login $$
CREATE PROCEDURE `sp_get_user_for_login`(IN p_email VARCHAR(150))
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.email = p_email LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_user_mfa $$
CREATE PROCEDURE `sp_get_user_mfa`(IN p_user_id INT)
BEGIN
  SELECT email, mfa_enabled, mfa_secret, mfa_backup_codes FROM users WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_user_password_hash $$
CREATE PROCEDURE `sp_get_user_password_hash`(IN p_user_id INT)
BEGIN
  SELECT password_hash FROM users WHERE user_id = p_user_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_get_weekly_timesheet $$
CREATE PROCEDURE `sp_get_weekly_timesheet`(
  IN p_employee_id INT, IN p_week_start DATE, IN p_week_end DATE, OUT p_ts_id INT
)
BEGIN
  SELECT timesheet_id INTO p_ts_id
    FROM weekly_timesheets WHERE employee_id = p_employee_id AND week_start = p_week_start LIMIT 1;
  IF p_ts_id IS NULL THEN
    INSERT INTO weekly_timesheets (employee_id, week_start, week_end, status)
    VALUES (p_employee_id, p_week_start, p_week_end, 'draft');
    SET p_ts_id = LAST_INSERT_ID();
  END IF;
  SELECT * FROM weekly_timesheets WHERE timesheet_id = p_ts_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_workflow_delegate $$
CREATE PROCEDURE `sp_get_workflow_delegate`(IN p_id INT)
BEGIN
  SELECT wd.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegate_name
    FROM workflow_delegates wd
    JOIN employees e ON e.employee_id = wd.employee_id
    JOIN employees d ON d.employee_id = wd.delegate_employee_id
   WHERE wd.id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_get_work_schedule $$
CREATE PROCEDURE `sp_get_work_schedule`(IN p_employee_id INT)
BEGIN
  SELECT ws.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, e.employee_status, d.department_name
    FROM employee_work_schedules ws
    JOIN employees e ON e.employee_id = ws.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE ws.employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_helpdesk_report $$
CREATE PROCEDURE `sp_helpdesk_report`(IN p_from_date DATETIME, IN p_to_date DATETIME)
BEGIN
  SELECT t.status, COUNT(*) AS total FROM helpdesk_tickets t
   WHERE (p_from_date IS NULL OR t.created_at>=p_from_date)
     AND (p_to_date   IS NULL OR t.created_at<=p_to_date)
   GROUP BY t.status;
  SELECT t.category, COUNT(*) AS total FROM helpdesk_tickets t
   WHERE (p_from_date IS NULL OR t.created_at>=p_from_date)
     AND (p_to_date   IS NULL OR t.created_at<=p_to_date)
   GROUP BY t.category;
  SELECT t.priority, COUNT(*) AS total FROM helpdesk_tickets t
   WHERE (p_from_date IS NULL OR t.created_at>=p_from_date)
     AND (p_to_date   IS NULL OR t.created_at<=p_to_date)
   GROUP BY t.priority;
END $$
DROP PROCEDURE IF EXISTS sp_hiring_report $$
CREATE PROCEDURE `sp_hiring_report`()
BEGIN
  SELECT status, COUNT(*) AS total FROM jobs GROUP BY status;
  SELECT status, COUNT(*) AS total FROM job_applications GROUP BY status;
  SELECT status, COUNT(*) AS total FROM referrals GROUP BY status;
  SELECT j.job_id, j.title, d.department_name, j.status, j.posted_on, j.closing_date,
         (SELECT COUNT(*) FROM job_applications a WHERE a.job_id=j.job_id) AS application_count
    FROM jobs j
    LEFT JOIN departments d ON d.department_id=j.department_id
   WHERE j.status='Open'
   ORDER BY j.posted_on DESC;
END $$
DROP PROCEDURE IF EXISTS sp_import_holiday $$
CREATE PROCEDURE `sp_import_holiday`(
  IN p_name VARCHAR(200), IN p_date DATE, IN p_calendar VARCHAR(50),
  IN p_shift VARCHAR(20), IN p_location VARCHAR(100), IN p_is_restricted TINYINT
)
BEGIN
  INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
  VALUES (p_name, p_date, p_calendar, p_shift, p_location, p_is_restricted);
END $$
DROP PROCEDURE IF EXISTS sp_init_leave_balances_year $$
CREATE PROCEDURE `sp_init_leave_balances_year`(IN p_year INT)
BEGIN
  INSERT IGNORE INTO leave_balances
    (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
  SELECT e.employee_id, lt.leave_type_id, p_year,
         LEAST(IFNULL(prev.balance, 0), IFNULL(lt.carry_forward_limit, 0)),
         IFNULL(lt.annual_quota, 0),
         0,
         LEAST(IFNULL(prev.balance, 0), IFNULL(lt.carry_forward_limit, 0)) + IFNULL(lt.annual_quota, 0)
    FROM employees e
   CROSS JOIN leave_types lt
    LEFT JOIN leave_balances prev
           ON prev.employee_id   = e.employee_id
          AND prev.leave_type_id = lt.leave_type_id
          AND prev.year          = p_year - 1
   WHERE e.employee_status = 'Active';
  SELECT ROW_COUNT() AS created;
END $$
DROP PROCEDURE IF EXISTS sp_insert_it_declaration_item $$
CREATE PROCEDURE `sp_insert_it_declaration_item`(
  IN p_declaration_id INT, IN p_section_key VARCHAR(100),
  IN p_section_label VARCHAR(200), IN p_sub_label VARCHAR(200),
  IN p_declared_amount DECIMAL(12,2)
)
BEGIN
  INSERT INTO it_declaration_items
    (declaration_id, section_key, section_label, sub_label, declared_amount)
  VALUES (p_declaration_id, p_section_key, p_section_label, p_sub_label, p_declared_amount);
END $$
DROP PROCEDURE IF EXISTS sp_insert_salary_audit_log $$
CREATE PROCEDURE `sp_insert_salary_audit_log`(
  IN p_user_id INT,
  IN p_employee_id INT,
  IN p_action VARCHAR(50),
  IN p_resource VARCHAR(100),
  IN p_ip_address VARCHAR(45),
  IN p_user_agent VARCHAR(255),
  IN p_status VARCHAR(20)
)
BEGIN
  INSERT INTO salary_audit_log
    (user_id, employee_id, action, resource, ip_address, user_agent, status)
  VALUES
    (p_user_id, p_employee_id, p_action, p_resource, p_ip_address, p_user_agent, p_status);
END $$
DROP PROCEDURE IF EXISTS sp_issue_mfa_temp_token_hash $$
CREATE PROCEDURE `sp_issue_mfa_temp_token_hash`(
  IN p_user_id    INT,
  IN p_token_hash VARCHAR(64),
  IN p_expires_at DATETIME
)
BEGIN
  DELETE FROM mfa_temp_tokens WHERE user_id = p_user_id OR expires_at < NOW();
  INSERT INTO mfa_temp_tokens (user_id, token_hash, expires_at) VALUES (p_user_id, p_token_hash, p_expires_at);
END $$
DROP PROCEDURE IF EXISTS sp_issue_mfa_token $$
CREATE PROCEDURE `sp_issue_mfa_token`(IN p_user_id INT, IN p_token VARCHAR(64), IN p_expires_at DATETIME)
BEGIN
  DELETE FROM mfa_temp_tokens WHERE user_id = p_user_id OR expires_at < NOW();
  INSERT INTO mfa_temp_tokens (user_id, token, expires_at) VALUES (p_user_id, p_token, p_expires_at);
END $$
DROP PROCEDURE IF EXISTS sp_is_enrolled $$
CREATE PROCEDURE `sp_is_enrolled`(IN p_cycle_id INT, IN p_employee_id INT)
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM appraisal_enrollments WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id
  ) AS enrolled;
END $$
DROP PROCEDURE IF EXISTS sp_joining_create_invitation $$
CREATE PROCEDURE `sp_joining_create_invitation`(
  IN p_candidate_id    INT,
  IN p_offer_id        INT,
  IN p_token           VARCHAR(64),
  IN p_candidate_name  VARCHAR(255),
  IN p_candidate_email VARCHAR(255),
  IN p_job_title       VARCHAR(255),
  IN p_expires_at      DATETIME
)
BEGIN
  INSERT INTO joining_invitations
    (candidate_id, offer_id, token, candidate_name, candidate_email, job_title, expires_at)
  VALUES
    (p_candidate_id, p_offer_id, p_token, p_candidate_name, p_candidate_email, p_job_title, p_expires_at)
  ON DUPLICATE KEY UPDATE
    token       = p_token,
    status      = 'pending',
    expires_at  = p_expires_at,
    updated_at  = CURRENT_TIMESTAMP;
  SELECT * FROM joining_invitations WHERE token = p_token LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_by_offer $$
CREATE PROCEDURE `sp_joining_get_by_offer`(IN p_offer_id INT)
BEGIN
  SELECT id, token, status, expires_at,
         candidate_name, candidate_email, job_title,
         created_at, updated_at
  FROM   joining_invitations
  WHERE  offer_id = p_offer_id
  ORDER  BY created_at DESC
  LIMIT  1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_employee_id_by_code $$
CREATE PROCEDURE `sp_joining_get_employee_id_by_code`(
    IN p_emp_code VARCHAR(100)
)
BEGIN
    SELECT employee_id
    FROM employees
    WHERE emp_code = p_emp_code
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_formality $$
CREATE PROCEDURE `sp_joining_get_formality`(IN p_invitation_id INT)
BEGIN
  SELECT
    ji.id AS invitation_id, ji.candidate_id, ji.candidate_name, ji.candidate_email,
    ji.job_title, ji.expires_at, ji.status AS invitation_status,
    jf.*,
    jf.status AS formality_status
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id
  LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_form_by_token $$
CREATE PROCEDURE `sp_joining_get_form_by_token`(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
    jf.*,
    ji.candidate_name, ji.candidate_email, ji.job_title,
    ji.expires_at, ji.status AS invitation_status,
    jf.hr_remarks
  FROM joining_invitations ji
  INNER JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.token     = p_token
    AND ji.expires_at > NOW()
    AND ji.status NOT IN ('approved','rejected')
  LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_invitation $$
CREATE PROCEDURE `sp_joining_get_invitation`(IN p_invitation_id INT)
BEGIN
  SELECT ji.*
  FROM   joining_invitations ji
  WHERE  ji.id = p_invitation_id
  LIMIT  1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_get_my_documents $$
CREATE PROCEDURE `sp_joining_get_my_documents`(
    IN p_employee_id INT
)
BEGIN
    SELECT
        jf.aadhar_doc_url,
        jf.pan_doc_url,
        jf.handbook_acknowledged,
        jf.privacy_policy_accepted,
        jf.status,
        jf.reviewed_at,
        COALESCE(
            jf.full_name,
            ji.candidate_name
        ) AS candidate_name
    FROM joining_formalities jf
    INNER JOIN joining_invitations ji
        ON ji.id = jf.invitation_id
    INNER JOIN employees e
        ON e.employee_id = jf.admin_employee_id
    WHERE e.employee_id = p_employee_id
    ORDER BY jf.updated_at DESC
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_list_pending $$
CREATE PROCEDURE `sp_joining_list_pending`(
    IN p_status VARCHAR(30)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_0900_ai_ci,
    IN p_search VARCHAR(255)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_0900_ai_ci,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT
        ji.id,
        ji.candidate_id,
        ji.offer_id,
        ji.token,
        ji.candidate_name,
        ji.candidate_email,
        ji.job_title,
        ji.status AS invitation_status,
        ji.created_at,
        ji.expires_at,
        jf.id AS formality_id,
        jf.status AS formality_status,
        jf.submitted_at,
        jf.reviewed_at,
        jf.review_remarks,
        jf.full_name,
        jf.mobile
    FROM joining_invitations ji
    LEFT JOIN joining_formalities jf
        ON jf.invitation_id = ji.id
    WHERE
        (
            p_status IS NULL
            OR ji.status COLLATE utf8mb4_0900_ai_ci =
               p_status COLLATE utf8mb4_0900_ai_ci
        )
        AND
        (
            p_search IS NULL
            OR ji.candidate_name COLLATE utf8mb4_0900_ai_ci
                LIKE CONCAT('%', p_search COLLATE utf8mb4_0900_ai_ci, '%')
            OR ji.candidate_email COLLATE utf8mb4_0900_ai_ci
                LIKE CONCAT('%', p_search COLLATE utf8mb4_0900_ai_ci, '%')
        )
    ORDER BY ji.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    SELECT
        COUNT(*) AS total
    FROM joining_invitations ji
    WHERE
        (
            p_status IS NULL
            OR ji.status COLLATE utf8mb4_0900_ai_ci =
               p_status COLLATE utf8mb4_0900_ai_ci
        )
        AND
        (
            p_search IS NULL
            OR ji.candidate_name COLLATE utf8mb4_0900_ai_ci
                LIKE CONCAT('%', p_search COLLATE utf8mb4_0900_ai_ci, '%')
            OR ji.candidate_email COLLATE utf8mb4_0900_ai_ci
                LIKE CONCAT('%', p_search COLLATE utf8mb4_0900_ai_ci, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_joining_review $$
CREATE PROCEDURE `sp_joining_review`(
  IN p_invitation_id   INT,
  IN p_decision        VARCHAR(30),
  IN p_reviewed_by     INT,
  IN p_remarks         TEXT,
  IN p_changes_fields  TEXT,
  IN p_employee_id     VARCHAR(50),
  IN p_designation     VARCHAR(255),
  IN p_reporting_to    VARCHAR(255),
  IN p_department      VARCHAR(255)
)
BEGIN
  DECLARE v_jf_status VARCHAR(30);
  SET v_jf_status = CASE p_decision
    WHEN 'approve'         THEN 'approved'
    WHEN 'request_changes' THEN 'changes_requested'
    WHEN 'reject'          THEN 'rejected'
    ELSE p_decision
  END;
  UPDATE joining_invitations SET
    status = CASE p_decision
               WHEN 'approve'         THEN 'approved'
               WHEN 'request_changes' THEN 'pending_verification'
               WHEN 'reject'          THEN 'rejected'
               ELSE status
             END,
    expires_at = CASE p_decision
                   WHEN 'request_changes' THEN DATE_ADD(NOW(), INTERVAL 5 DAY)
                   ELSE expires_at
                 END,
    updated_at = NOW()
  WHERE id = p_invitation_id;
  UPDATE joining_formalities SET
    status             = v_jf_status,
    hr_remarks         = p_remarks,
    reviewed_by        = p_reviewed_by,
    reviewed_at        = NOW(),
    admin_employee_id  = COALESCE(p_employee_id,  admin_employee_id),
    admin_designation  = COALESCE(p_designation,  admin_designation),
    admin_reporting_to = COALESCE(p_reporting_to, admin_reporting_to),
    admin_department   = COALESCE(p_department,   admin_department),
    updated_at         = NOW()
  WHERE invitation_id = p_invitation_id;
  SELECT ji.*, jf.status AS formality_status, jf.hr_remarks AS review_remarks,
         jf.reviewed_at, jf.admin_employee_id, jf.admin_designation,
         jf.admin_reporting_to, jf.admin_department
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf ON jf.invitation_id = ji.id
  WHERE ji.id = p_invitation_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_save_formalities $$
CREATE PROCEDURE `sp_joining_save_formalities`(
  IN p_invitation_id  INT,
  IN p_candidate_id   INT,
  IN p_status         VARCHAR(30),
  IN p_handbook_ack   TINYINT,
  IN p_hr_policy_ack  TINYINT,
  IN p_full_name           VARCHAR(255),
  IN p_dob                 DATE,
  IN p_actual_dob          DATE,
  IN p_pan_no              VARCHAR(20),
  IN p_father_name         VARCHAR(255),
  IN p_marital_status      VARCHAR(30),
  IN p_spouse_name         VARCHAR(255),
  IN p_present_address     TEXT,
  IN p_permanent_address   TEXT,
  IN p_photo_url           LONGTEXT,
  IN p_signature_url       LONGTEXT,
  IN p_education_json      LONGTEXT,
  IN p_references_json     LONGTEXT,
  IN p_joining_date_text   DATE,
  IN p_designation_text    VARCHAR(255),
  IN p_bank_name           VARCHAR(100),
  IN p_account_holder_name VARCHAR(255),
  IN p_account_number      VARCHAR(50),
  IN p_ifsc_code           VARCHAR(20),
  IN p_branch_details      VARCHAR(255),
  IN p_tl_employee_name              VARCHAR(255),
  IN p_tl_father_or_husband_name     VARCHAR(255),
  IN p_tl_date_of_birth              DATE,
  IN p_tl_sex                        VARCHAR(10),
  IN p_tl_employee_id                VARCHAR(50),
  IN p_tl_address                    TEXT,
  IN p_term_life_nominees_json       LONGTEXT,
  IN p_tl_declaration_employee_name  VARCHAR(255),
  IN p_tl_declaration_date           DATE,
  IN p_tl_place                      VARCHAR(255),
  IN p_tl_signature                  VARCHAR(255),
  IN p_gratuity_employee_intro_name       TEXT,
  IN p_gratuity_sex                       VARCHAR(10),
  IN p_gratuity_religion                  VARCHAR(100),
  IN p_gratuity_marital_status            VARCHAR(30),
  IN p_gratuity_department_branch_section VARCHAR(255),
  IN p_gratuity_employee_id              VARCHAR(50),
  IN p_gratuity_date_of_joining          DATE,
  IN p_gratuity_permanent_address        TEXT,
  IN p_gratuity_nominees_json            LONGTEXT,
  IN p_gratuity_witnesses_json           LONGTEXT,
  IN p_gratuity_place                    VARCHAR(255),
  IN p_gratuity_date                     DATE,
  IN p_gratuity_employee_signature       VARCHAR(255),
  IN p_gratuity_employee_statement_name  TEXT,
  IN p_ins_employee_name             VARCHAR(255),
  IN p_ins_father_or_husband_name    VARCHAR(255),
  IN p_ins_date_of_birth             DATE,
  IN p_ins_sex                       VARCHAR(10),
  IN p_ins_employee_id               VARCHAR(50),
  IN p_ins_address                   TEXT,
  IN p_ins_nominees_json             LONGTEXT,
  IN p_ins_declaration_employee_name VARCHAR(255),
  IN p_ins_declaration_date          DATE,
  IN p_ins_signature                 VARCHAR(255),
  IN p_pf_employee_name              VARCHAR(255),
  IN p_pf_date_of_birth              DATE,
  IN p_pf_father_or_spouse_name      VARCHAR(255),
  IN p_pf_relation_type              VARCHAR(20),
  IN p_pf_gender                     VARCHAR(10),
  IN p_pf_marital_status             VARCHAR(30),
  IN p_pf_email                      VARCHAR(255),
  IN p_pf_mobile_no                  VARCHAR(20),
  IN p_pf_epf_1952                   VARCHAR(5),
  IN p_pf_eps_1995                   VARCHAR(5),
  IN p_pf_uan                        VARCHAR(50),
  IN p_pf_previous_pf                VARCHAR(50),
  IN p_pf_international_worker       VARCHAR(5),
  IN p_pf_educational_qualification  VARCHAR(100),
  IN p_pf_specially_abled            VARCHAR(5),
  IN p_pf_disability_category        VARCHAR(100),
  IN p_pf_bank_acc_no                VARCHAR(50),
  IN p_pf_ifsc_code                  VARCHAR(20),
  IN p_pf_aadhar_no                  VARCHAR(20),
  IN p_pf_do_have_pan                VARCHAR(5),
  IN p_pf_pan                        VARCHAR(20),
  IN p_pf_place                      VARCHAR(255),
  IN p_pf_declaration_accepted       TINYINT,
  IN p_pf_employee_signature         VARCHAR(255)
)
BEGIN
  IF EXISTS (SELECT 1 FROM joining_formalities WHERE invitation_id = p_invitation_id) THEN
    UPDATE joining_formalities SET
      status = p_status, handbook_acknowledged = p_handbook_ack, privacy_policy_accepted = p_hr_policy_ack,
      full_name = p_full_name, dob = p_dob, actual_dob = p_actual_dob, pan_no = p_pan_no,
      father_name = p_father_name, marital_status = p_marital_status, spouse_name = p_spouse_name,
      present_address = p_present_address, permanent_address = p_permanent_address,
      photo_url = p_photo_url, signature_url = p_signature_url,
      education_json = p_education_json, references_json = p_references_json,
      joining_date_text = p_joining_date_text, designation_text = p_designation_text,
      bank_name = p_bank_name, account_holder_name = p_account_holder_name,
      account_number = p_account_number, ifsc_code = p_ifsc_code, branch_details = p_branch_details,
      tl_employee_name = p_tl_employee_name, tl_father_or_husband_name = p_tl_father_or_husband_name,
      tl_date_of_birth = p_tl_date_of_birth, tl_sex = p_tl_sex, tl_employee_id = p_tl_employee_id,
      tl_address = p_tl_address, term_life_nominees_json = p_term_life_nominees_json,
      tl_declaration_employee_name = p_tl_declaration_employee_name, tl_declaration_date = p_tl_declaration_date,
      tl_place = p_tl_place, tl_signature = p_tl_signature,
      gratuity_employee_intro_name = p_gratuity_employee_intro_name, gratuity_sex = p_gratuity_sex,
      gratuity_religion = p_gratuity_religion, gratuity_marital_status = p_gratuity_marital_status,
      gratuity_department_branch_section = p_gratuity_department_branch_section,
      gratuity_employee_id = p_gratuity_employee_id, gratuity_date_of_joining = p_gratuity_date_of_joining,
      gratuity_permanent_address = p_gratuity_permanent_address, gratuity_nominees_json = p_gratuity_nominees_json,
      gratuity_witnesses_json = p_gratuity_witnesses_json, gratuity_place = p_gratuity_place,
      gratuity_date = p_gratuity_date, gratuity_employee_signature = p_gratuity_employee_signature,
      gratuity_employee_statement_name = p_gratuity_employee_statement_name,
      ins_employee_name = p_ins_employee_name, ins_father_or_husband_name = p_ins_father_or_husband_name,
      ins_date_of_birth = p_ins_date_of_birth, ins_sex = p_ins_sex, ins_employee_id = p_ins_employee_id,
      ins_address = p_ins_address, ins_nominees_json = p_ins_nominees_json,
      ins_declaration_employee_name = p_ins_declaration_employee_name, ins_declaration_date = p_ins_declaration_date,
      ins_signature = p_ins_signature,
      pf_employee_name = p_pf_employee_name, pf_date_of_birth = p_pf_date_of_birth,
      pf_father_or_spouse_name = p_pf_father_or_spouse_name, pf_relation_type = p_pf_relation_type,
      pf_gender = p_pf_gender, pf_marital_status = p_pf_marital_status,
      pf_email = p_pf_email, pf_mobile_no = p_pf_mobile_no,
      pf_epf_1952 = p_pf_epf_1952, pf_eps_1995 = p_pf_eps_1995, pf_uan = p_pf_uan,
      pf_previous_pf = p_pf_previous_pf, pf_international_worker = p_pf_international_worker,
      pf_educational_qualification = p_pf_educational_qualification, pf_specially_abled = p_pf_specially_abled,
      pf_disability_category = p_pf_disability_category, pf_bank_acc_no = p_pf_bank_acc_no,
      pf_ifsc_code = p_pf_ifsc_code, pf_aadhar_no = p_pf_aadhar_no,
      pf_do_have_pan = p_pf_do_have_pan, pf_pan = p_pf_pan, pf_place = p_pf_place,
      pf_declaration_accepted = p_pf_declaration_accepted, pf_employee_signature = p_pf_employee_signature,
      submitted_at = IF(p_status='submitted' AND submitted_at IS NULL, NOW(), submitted_at),
      updated_at = NOW()
    WHERE invitation_id = p_invitation_id;
  ELSE
    INSERT INTO joining_formalities (
      invitation_id, candidate_id, status, handbook_acknowledged, privacy_policy_accepted,
      full_name, dob, actual_dob, pan_no, father_name, marital_status, spouse_name,
      present_address, permanent_address, photo_url, signature_url, education_json, references_json,
      joining_date_text, designation_text,
      bank_name, account_holder_name, account_number, ifsc_code, branch_details,
      tl_employee_name, tl_father_or_husband_name, tl_date_of_birth, tl_sex, tl_employee_id, tl_address,
      term_life_nominees_json, tl_declaration_employee_name, tl_declaration_date, tl_place, tl_signature,
      gratuity_employee_intro_name, gratuity_sex, gratuity_religion, gratuity_marital_status,
      gratuity_department_branch_section, gratuity_employee_id, gratuity_date_of_joining,
      gratuity_permanent_address, gratuity_nominees_json, gratuity_witnesses_json,
      gratuity_place, gratuity_date, gratuity_employee_signature, gratuity_employee_statement_name,
      ins_employee_name, ins_father_or_husband_name, ins_date_of_birth, ins_sex, ins_employee_id, ins_address,
      ins_nominees_json, ins_declaration_employee_name, ins_declaration_date, ins_signature,
      pf_employee_name, pf_date_of_birth, pf_father_or_spouse_name, pf_relation_type, pf_gender,
      pf_marital_status, pf_email, pf_mobile_no, pf_epf_1952, pf_eps_1995, pf_uan, pf_previous_pf,
      pf_international_worker, pf_educational_qualification, pf_specially_abled, pf_disability_category,
      pf_bank_acc_no, pf_ifsc_code, pf_aadhar_no, pf_do_have_pan, pf_pan, pf_place,
      pf_declaration_accepted, pf_employee_signature,
      submitted_at, created_at, updated_at
    ) VALUES (
      p_invitation_id, p_candidate_id, p_status, p_handbook_ack, p_hr_policy_ack,
      p_full_name, p_dob, p_actual_dob, p_pan_no, p_father_name, p_marital_status, p_spouse_name,
      p_present_address, p_permanent_address, p_photo_url, p_signature_url, p_education_json, p_references_json,
      p_joining_date_text, p_designation_text,
      p_bank_name, p_account_holder_name, p_account_number, p_ifsc_code, p_branch_details,
      p_tl_employee_name, p_tl_father_or_husband_name, p_tl_date_of_birth, p_tl_sex, p_tl_employee_id, p_tl_address,
      p_term_life_nominees_json, p_tl_declaration_employee_name, p_tl_declaration_date, p_tl_place, p_tl_signature,
      p_gratuity_employee_intro_name, p_gratuity_sex, p_gratuity_religion, p_gratuity_marital_status,
      p_gratuity_department_branch_section, p_gratuity_employee_id, p_gratuity_date_of_joining,
      p_gratuity_permanent_address, p_gratuity_nominees_json, p_gratuity_witnesses_json,
      p_gratuity_place, p_gratuity_date, p_gratuity_employee_signature, p_gratuity_employee_statement_name,
      p_ins_employee_name, p_ins_father_or_husband_name, p_ins_date_of_birth, p_ins_sex, p_ins_employee_id, p_ins_address,
      p_ins_nominees_json, p_ins_declaration_employee_name, p_ins_declaration_date, p_ins_signature,
      p_pf_employee_name, p_pf_date_of_birth, p_pf_father_or_spouse_name, p_pf_relation_type, p_pf_gender,
      p_pf_marital_status, p_pf_email, p_pf_mobile_no, p_pf_epf_1952, p_pf_eps_1995, p_pf_uan, p_pf_previous_pf,
      p_pf_international_worker, p_pf_educational_qualification, p_pf_specially_abled, p_pf_disability_category,
      p_pf_bank_acc_no, p_pf_ifsc_code, p_pf_aadhar_no, p_pf_do_have_pan, p_pf_pan, p_pf_place,
      p_pf_declaration_accepted, p_pf_employee_signature,
      IF(p_status='submitted', NOW(), NULL), NOW(), NOW()
    );
  END IF;
  SELECT * FROM joining_formalities WHERE invitation_id = p_invitation_id LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_sync_identity_documents $$
CREATE PROCEDURE `sp_joining_sync_identity_documents`(
    IN p_employee_id INT,
    IN p_uploaded_by INT,
    IN p_aadhar_doc_url TEXT,
    IN p_pan_doc_url TEXT
)
BEGIN
    DECLARE v_category_id INT DEFAULT NULL;
    SELECT category_id
    INTO v_category_id
    FROM document_categories
    WHERE category_name = 'Identity Documents'
    LIMIT 1;
    IF v_category_id IS NULL THEN
        INSERT INTO document_categories (
            category_name
        )
        VALUES (
            'Identity Documents'
        );
        SET v_category_id = LAST_INSERT_ID();
    END IF;
    IF p_aadhar_doc_url IS NOT NULL
       AND TRIM(p_aadhar_doc_url) <> '' THEN
        INSERT INTO documents (
            title,
            category_id,
            file_type,
            file_size,
            file_url,
            visibility,
            employee_id,
            uploaded_by
        )
        VALUES (
            'Aadhaar Card',
            v_category_id,
            UPPER(
                SUBSTRING_INDEX(
                    p_aadhar_doc_url,
                    '.',
                    -1
                )
            ),
            0,
            p_aadhar_doc_url,
            'employee',
            p_employee_id,
            p_uploaded_by
        )
        ON DUPLICATE KEY UPDATE
            file_url = VALUES(file_url);
    END IF;
    IF p_pan_doc_url IS NOT NULL
       AND TRIM(p_pan_doc_url) <> '' THEN
        INSERT INTO documents (
            title,
            category_id,
            file_type,
            file_size,
            file_url,
            visibility,
            employee_id,
            uploaded_by
        )
        VALUES (
            'PAN Card',
            v_category_id,
            UPPER(
                SUBSTRING_INDEX(
                    p_pan_doc_url,
                    '.',
                    -1
                )
            ),
            0,
            p_pan_doc_url,
            'employee',
            p_employee_id,
            p_uploaded_by
        )
        ON DUPLICATE KEY UPDATE
            file_url = VALUES(file_url);
    END IF;
    SELECT v_category_id AS category_id;
END $$
DROP PROCEDURE IF EXISTS sp_joining_update_formality_documents $$
CREATE PROCEDURE `sp_joining_update_formality_documents`(
    IN p_invitation_id INT,
    IN p_aadhar_doc_url TEXT,
    IN p_pan_doc_url TEXT
)
BEGIN
    UPDATE joining_formalities
    SET
        aadhar_doc_url = COALESCE(
            NULLIF(p_aadhar_doc_url, ''),
            aadhar_doc_url
        ),
        pan_doc_url = COALESCE(
            NULLIF(p_pan_doc_url, ''),
            pan_doc_url
        )
    WHERE invitation_id = p_invitation_id;
    SELECT
        aadhar_doc_url,
        pan_doc_url
    FROM joining_formalities
    WHERE invitation_id = p_invitation_id
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_joining_verify_token $$
CREATE PROCEDURE `sp_joining_verify_token`(
  IN p_token VARCHAR(64) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT
      ji.*,
      jf.id AS formality_id,
      jf.status AS formality_status,
      jf.full_name,
      jf.handbook_acknowledged,
      jf.privacy_policy_accepted,
      jf.hr_remarks,
      rc.mobile AS candidate_mobile
  FROM joining_invitations ji
  LEFT JOIN joining_formalities jf
         ON jf.invitation_id = ji.id
  LEFT JOIN rec_candidates rc
         ON rc.candidate_id = ji.candidate_id
  WHERE ji.token = p_token
    AND ji.status NOT IN ('approved', 'rejected')
    AND (
          ji.expires_at > NOW()
          OR jf.id IS NOT NULL
        )
  LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_leave_report $$
CREATE PROCEDURE `sp_leave_report`(IN p_year INT, IN p_department_id INT, IN p_status VARCHAR(20))
BEGIN
  SELECT lt.leave_type_name, lr.status, COUNT(*) AS total, SUM(lr.days) AS total_days
    FROM leave_requests lr
    JOIN leave_types lt ON lt.leave_type_id=lr.leave_type_id
    JOIN employees e ON e.employee_id=lr.employee_id
   WHERE (p_year          IS NULL OR YEAR(lr.from_date)=p_year)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
     AND (p_status        IS NULL OR lr.status=p_status)
   GROUP BY lt.leave_type_name, lr.status;
  SELECT lr.leave_request_id, lr.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, lt.leave_type_name, lr.from_date, lr.to_date, lr.days, lr.status, lr.applied_on
    FROM leave_requests lr
    JOIN leave_types lt ON lt.leave_type_id=lr.leave_type_id
    JOIN employees e ON e.employee_id=lr.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id
   WHERE (p_year          IS NULL OR YEAR(lr.from_date)=p_year)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
     AND (p_status        IS NULL OR lr.status=p_status)
   ORDER BY lr.applied_on DESC LIMIT 500;
END $$
DROP PROCEDURE IF EXISTS sp_list_all_timesheets $$
CREATE PROCEDURE `sp_list_all_timesheets`(
    IN p_status VARCHAR(20),
    IN p_employee_id INT
)
BEGIN
    SELECT wt.*,
           CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
           e.emp_code,
           d.department_name,
           CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
    WHERE (
        p_status IS NULL
        OR wt.status COLLATE utf8mb4_unicode_ci =
           p_status COLLATE utf8mb4_unicode_ci
    )
    AND (
        p_employee_id IS NULL
        OR wt.employee_id = p_employee_id
    )
    ORDER BY wt.submitted_at DESC, wt.week_start DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_attendance $$
CREATE PROCEDURE `sp_list_attendance`(
  IN p_employee_id  INT, IN p_department_id INT, IN p_from_date DATE,
  IN p_to_date      DATE, IN p_status VARCHAR(20), IN p_reporting_to INT,
  IN p_limit INT, IN p_offset INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 1000000;
    END IF;
    IF p_offset IS NULL OR p_offset < 0 THEN
        SET p_offset = 0;
    END IF;
  SELECT a.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to)
     AND (p_employee_id   IS NULL OR a.employee_id    = p_employee_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_from_date     IS NULL OR a.attendance_date >= p_from_date)
     AND (p_to_date       IS NULL OR a.attendance_date <= p_to_date)
     AND (p_status        IS NULL OR a.status         = p_status)
   ORDER BY a.attendance_date DESC, a.employee_id
    LIMIT p_offset, p_limit;
  SELECT COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
   WHERE (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to)
     AND (p_employee_id   IS NULL OR a.employee_id    = p_employee_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_from_date     IS NULL OR a.attendance_date >= p_from_date)
     AND (p_to_date       IS NULL OR a.attendance_date <= p_to_date)
     AND (p_status        IS NULL OR a.status         = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_attendance_regularization $$
CREATE PROCEDURE `sp_list_attendance_regularization`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_reporting_to INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        e.emp_code,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = r.reviewed_by
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
    ORDER BY r.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to);
END $$
DROP PROCEDURE IF EXISTS sp_list_calendar_events $$
CREATE PROCEDURE `sp_list_calendar_events`(
  IN p_employee_id INT, IN p_visibility VARCHAR(20), IN p_type VARCHAR(50),
  IN p_from DATE, IN p_to DATE, IN p_limit INT, IN p_offset INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 50;
  DECLARE v_offset INT DEFAULT 0;
  SET v_limit = COALESCE(p_limit, 50);
  SET v_offset = COALESCE(p_offset, 0);
  SELECT ce.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name
    FROM calendar_events ce
    LEFT JOIN employees e ON e.employee_id = ce.created_by
   WHERE (p_type IS NULL OR ce.event_type = p_type)
     AND (p_from IS NULL OR ce.event_date >= p_from)
     AND (p_to   IS NULL OR ce.event_date <= p_to)
   ORDER BY ce.event_date ASC
   LIMIT v_offset, v_limit;
  SELECT COUNT(*) AS total FROM calendar_events ce
   WHERE (p_type IS NULL OR ce.event_type = p_type)
     AND (p_from IS NULL OR ce.event_date >= p_from)
     AND (p_to   IS NULL OR ce.event_date <= p_to);
END $$
DROP PROCEDURE IF EXISTS sp_list_designations $$
CREATE PROCEDURE `sp_list_designations`(IN p_department_id INT)
BEGIN
  SELECT * FROM designations
   WHERE (p_department_id IS NULL OR department_id = p_department_id)
   ORDER BY designation_name;
END $$
DROP PROCEDURE IF EXISTS sp_list_documents $$
CREATE PROCEDURE `sp_list_documents`(
  IN p_employee_id INT, IN p_category_id INT, IN p_visibility VARCHAR(20),
  IN p_search VARCHAR(200), IN p_limit INT, IN p_offset INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 1000000;
    END IF;
    IF p_offset IS NULL OR p_offset < 0 THEN
        SET p_offset = 0;
    END IF;
  SELECT d.*, dc.category_name,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(u.first_name,' ',IFNULL(u.last_name,'')) AS uploaded_by_name
    FROM documents d
    LEFT JOIN document_categories dc ON dc.category_id=d.category_id
    LEFT JOIN employees e ON e.employee_id=d.employee_id
    LEFT JOIN employees u ON u.employee_id=d.uploaded_by
   WHERE (p_employee_id IS NULL OR (d.employee_id=p_employee_id OR d.visibility='all'))
     AND (p_category_id IS NULL OR d.category_id=p_category_id)
     AND (p_visibility  IS NULL OR d.visibility=p_visibility)
     AND (p_search      IS NULL OR d.title LIKE p_search)
   ORDER BY d.created_at DESC
    LIMIT p_offset, p_limit;
  SELECT COUNT(*) AS total FROM documents d
   WHERE (p_employee_id IS NULL OR (d.employee_id=p_employee_id OR d.visibility='all'))
     AND (p_category_id IS NULL OR d.category_id=p_category_id)
     AND (p_visibility  IS NULL OR d.visibility=p_visibility)
     AND (p_search      IS NULL OR d.title LIKE p_search);
END $$
DROP PROCEDURE IF EXISTS sp_list_employees $$
CREATE PROCEDURE `sp_list_employees`(
    IN p_department INT,
    IN p_status VARCHAR(30),
    IN p_search VARCHAR(200),
    IN p_reporting_to INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SELECT
            e.*,
            d.department_name,
            ds.designation_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reporting_to_name,
            m.emp_code AS reporting_to_code,
            ci.current_address,
            ci.permanent_address,
            ci.personal_email,
            ci.alternate_mobile,
            ci.emergency_contact_name,
            ci.emergency_contact_relation,
            ci.emergency_contact_phone,
            ci.contact_name,
            ci.contact_city,
            ci.contact_country,
            ci.permanent_address_line1,
            ci.permanent_address_line2,
            ci.permanent_address_line3,
            bd.bank_name,
            bd.account_number,
            bd.ifsc_code,
            bd.uan_number,
            bd.account_type,
            bd.bank_branch,
            bd.dd_payable_at,
            bd.account_holder_name,
            bd.payment_type,
            EXISTS (
                SELECT 1
                FROM resignations r
                WHERE r.employee_id = e.employee_id
                  AND r.status IN ('pending','rm_approved','accepted')
            ) AS serving_notice
        FROM employees e
        LEFT JOIN departments d
            ON d.department_id = e.department_id
        LEFT JOIN designations ds
            ON ds.designation_id = e.designation_id
        LEFT JOIN employees m
            ON m.employee_id = e.reporting_to
        LEFT JOIN employee_contact_info ci
            ON ci.employee_id = e.employee_id
        LEFT JOIN employee_bank_details bd
            ON bd.employee_id = e.employee_id
        WHERE
            (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
            AND (p_department IS NULL OR e.department_id = p_department)
            AND (
                p_status IS NULL
                OR p_status = ''
                OR e.employee_status COLLATE utf8mb4_unicode_ci =
                   p_status COLLATE utf8mb4_unicode_ci
            )
            AND (
                p_search IS NULL
                OR p_search = ''
                OR e.first_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.last_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.email COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.emp_code COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
            )
        ORDER BY e.employee_id DESC;
    ELSE
        SELECT
            e.*,
            d.department_name,
            ds.designation_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reporting_to_name,
            m.emp_code AS reporting_to_code,
            ci.current_address,
            ci.permanent_address,
            ci.personal_email,
            ci.alternate_mobile,
            ci.emergency_contact_name,
            ci.emergency_contact_relation,
            ci.emergency_contact_phone,
            ci.contact_name,
            ci.contact_city,
            ci.contact_country,
            ci.permanent_address_line1,
            ci.permanent_address_line2,
            ci.permanent_address_line3,
            bd.bank_name,
            bd.account_number,
            bd.ifsc_code,
            bd.uan_number,
            bd.account_type,
            bd.bank_branch,
            bd.dd_payable_at,
            bd.account_holder_name,
            bd.payment_type,
            EXISTS (
                SELECT 1
                FROM resignations r
                WHERE r.employee_id = e.employee_id
                  AND r.status IN ('pending','rm_approved','accepted')
            ) AS serving_notice
        FROM employees e
        LEFT JOIN departments d
            ON d.department_id = e.department_id
        LEFT JOIN designations ds
            ON ds.designation_id = e.designation_id
        LEFT JOIN employees m
            ON m.employee_id = e.reporting_to
        LEFT JOIN employee_contact_info ci
            ON ci.employee_id = e.employee_id
        LEFT JOIN employee_bank_details bd
            ON bd.employee_id = e.employee_id
        WHERE
            (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
            AND (p_department IS NULL OR e.department_id = p_department)
            AND (
                p_status IS NULL
                OR p_status = ''
                OR e.employee_status COLLATE utf8mb4_unicode_ci =
                   p_status COLLATE utf8mb4_unicode_ci
            )
            AND (
                p_search IS NULL
                OR p_search = ''
                OR e.first_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.last_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.email COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
                OR e.emp_code COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
            )
        ORDER BY e.employee_id DESC
        LIMIT p_offset, p_limit;
    END IF;
    SELECT COUNT(*) AS total
    FROM employees e
    WHERE
        (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
        AND (p_department IS NULL OR e.department_id = p_department)
        AND (
            p_status IS NULL
            OR p_status = ''
            OR e.employee_status COLLATE utf8mb4_unicode_ci =
               p_status COLLATE utf8mb4_unicode_ci
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR e.first_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
            OR e.last_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
            OR e.email COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
            OR e.emp_code COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_search COLLATE utf8mb4_unicode_ci, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_employees_with_roles $$
CREATE PROCEDURE `sp_list_employees_with_roles`()
BEGIN
  SELECT
    e.employee_id, e.emp_code, e.first_name, e.last_name, e.email,
    e.emp_job_title, ds.designation_name,
    u.role_id, r.role_name
  FROM employees e
  LEFT JOIN users u           ON u.employee_id = e.employee_id
  LEFT JOIN roles r           ON r.role_id = u.role_id
  LEFT JOIN designations ds   ON ds.designation_id = e.designation_id
  WHERE e.employee_status = 'Active'
  ORDER BY e.first_name, e.last_name;
END $$
DROP PROCEDURE IF EXISTS sp_list_employee_salary_assignments $$
CREATE PROCEDURE `sp_list_employee_salary_assignments`(
  IN p_department_id INT,
  IN p_search        VARCHAR(100)
)
BEGIN
  SELECT
    e.employee_id,
    e.emp_code,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    dsg.designation_name,
    d.department_name,
    e.employee_status,
    esa.assignment_id,
    esa.structure_id,
    ss.structure_name,
    esa.ctc_annual,
    ROUND(esa.ctc_annual / 12, 2) AS ctc_monthly,
    esa.effective_from
  FROM employees e
  LEFT JOIN departments d
         ON d.department_id = e.department_id
  LEFT JOIN designations dsg
         ON dsg.designation_id = e.designation_id
  LEFT JOIN employee_salary_assignments esa
         ON esa.employee_id = e.employee_id AND esa.is_active = 1
  LEFT JOIN salary_structures ss
         ON ss.structure_id = esa.structure_id
  WHERE e.employee_status = 'Active'
    AND (p_department_id IS NULL OR e.department_id = p_department_id)
    AND (p_search IS NULL OR p_search = '' OR
         CONCAT(e.first_name,' ',e.last_name) LIKE CONCAT('%',p_search,'%') OR
         e.emp_code LIKE CONCAT('%',p_search,'%'))
  ORDER BY d.department_name, e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_list_extra_work_requests $$
CREATE PROCEDURE `sp_list_extra_work_requests`(IN p_employee_id INT)
BEGIN
  SELECT ew.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM extra_work_requests ew
    JOIN employees e ON e.employee_id = ew.employee_id
   WHERE ew.employee_id = p_employee_id
   ORDER BY ew.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_helpdesk_tickets $$
CREATE PROCEDURE `sp_list_helpdesk_tickets`(
  IN p_employee_id INT, IN p_status VARCHAR(30), IN p_priority VARCHAR(20),
  IN p_category VARCHAR(50), IN p_assigned_to INT, IN p_forwarded_to_team VARCHAR(50),
  IN p_search VARCHAR(200), IN p_limit INT, IN p_offset INT
)
BEGIN
  IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 1000000;
    END IF;
    IF p_offset IS NULL OR p_offset < 0 THEN
        SET p_offset = 0;
    END IF;
  SELECT t.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS assigned_to_name
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
    LEFT JOIN employees a ON a.employee_id = t.assigned_to
   WHERE (p_employee_id       IS NULL OR t.employee_id       = p_employee_id)
     AND (p_status            IS NULL OR t.status            = p_status)
     AND (p_priority          IS NULL OR t.priority          = p_priority)
     AND (p_category          IS NULL OR t.category          = p_category)
     AND (p_assigned_to       IS NULL OR t.assigned_to       = p_assigned_to)
     AND (p_forwarded_to_team IS NULL OR t.forwarded_to_team = p_forwarded_to_team)
     AND (p_search            IS NULL OR t.subject LIKE CONCAT('%',p_search,'%'))
   ORDER BY t.created_at DESC
    LIMIT p_offset, p_limit;
  SELECT COUNT(*) AS total
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
   WHERE (p_employee_id       IS NULL OR t.employee_id       = p_employee_id)
     AND (p_status            IS NULL OR t.status            = p_status)
     AND (p_priority          IS NULL OR t.priority          = p_priority)
     AND (p_category          IS NULL OR t.category          = p_category)
     AND (p_assigned_to       IS NULL OR t.assigned_to       = p_assigned_to)
     AND (p_forwarded_to_team IS NULL OR t.forwarded_to_team = p_forwarded_to_team)
     AND (p_search            IS NULL OR t.subject LIKE CONCAT('%',p_search,'%'));
END $$
DROP PROCEDURE IF EXISTS sp_list_holidays $$
CREATE PROCEDURE `sp_list_holidays`(
  IN p_year             INT,
  IN p_shift            VARCHAR(10),
  IN p_location         VARCHAR(100),
  IN p_holiday_calendar VARCHAR(100),
  IN p_limit            INT,
  IN p_offset           INT
)
BEGIN
  IF p_limit > 0 THEN
    SELECT *
      FROM holidays
     WHERE (p_year             IS NULL OR p_year             = 0  OR YEAR(holiday_date) = p_year)
       AND (p_shift            IS NULL OR p_shift            = '' OR shift            = p_shift)
       AND (p_location         IS NULL OR p_location         = '' OR location         = p_location)
       AND (p_holiday_calendar IS NULL OR p_holiday_calendar = '' OR holiday_calendar = p_holiday_calendar)
     ORDER BY holiday_date ASC
     LIMIT p_limit OFFSET p_offset;
  ELSE
    SELECT *
      FROM holidays
     WHERE (p_year             IS NULL OR p_year             = 0  OR YEAR(holiday_date) = p_year)
       AND (p_shift            IS NULL OR p_shift            = '' OR shift            = p_shift)
       AND (p_location         IS NULL OR p_location         = '' OR location         = p_location)
       AND (p_holiday_calendar IS NULL OR p_holiday_calendar = '' OR holiday_calendar = p_holiday_calendar)
     ORDER BY holiday_date ASC;
  END IF;
  SELECT COUNT(*) AS total
    FROM holidays
   WHERE (p_year             IS NULL OR p_year             = 0  OR YEAR(holiday_date) = p_year)
     AND (p_shift            IS NULL OR p_shift            = '' OR shift            = p_shift)
     AND (p_location         IS NULL OR p_location         = '' OR location         = p_location)
     AND (p_holiday_calendar IS NULL OR p_holiday_calendar = '' OR holiday_calendar = p_holiday_calendar);
END $$
DROP PROCEDURE IF EXISTS sp_list_holiday_locations $$
CREATE PROCEDURE `sp_list_holiday_locations`()
BEGIN
  SELECT DISTINCT location
    FROM holidays
   WHERE location IS NOT NULL AND location <> ''
   ORDER BY location ASC;
END $$
DROP PROCEDURE IF EXISTS sp_list_jobs $$
CREATE PROCEDURE `sp_list_jobs`(
    IN p_status VARCHAR(20),
    IN p_department_id INT,
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        j.*,
        d.department_name,
        CONCAT(
            c.first_name,
            ' ',
            IFNULL(c.last_name, '')
        ) AS created_by_name,
        (
            SELECT COUNT(*)
            FROM job_applications ja
            WHERE ja.job_id = j.job_id
        ) AS application_count
    FROM jobs j
    LEFT JOIN departments d
        ON d.department_id = j.department_id
    LEFT JOIN employees c
        ON c.employee_id = j.created_by
    WHERE
        (p_status IS NULL OR j.status = p_status)
        AND (
            p_department_id IS NULL
            OR j.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR j.title LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY j.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM jobs j
    WHERE
        (p_status IS NULL OR j.status = p_status)
        AND (
            p_department_id IS NULL
            OR j.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR j.title LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_job_applications $$
CREATE PROCEDURE `sp_list_job_applications`(
    IN p_job_id INT,
    IN p_status VARCHAR(30),
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        ja.*,
        j.title AS job_title,
        j.department_id,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS applicant_employee_name
    FROM job_applications ja
    INNER JOIN jobs j
        ON j.job_id = ja.job_id
    LEFT JOIN employees e
        ON e.employee_id = ja.applicant_employee_id
    WHERE
        (p_job_id IS NULL OR ja.job_id = p_job_id)
        AND (p_status IS NULL OR ja.status = p_status)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR ja.applicant_name LIKE CONCAT('%', p_search, '%')
            OR ja.email LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY ja.applied_on DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM job_applications ja
    WHERE
        (p_job_id IS NULL OR ja.job_id = p_job_id)
        AND (p_status IS NULL OR ja.status = p_status)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR ja.applicant_name LIKE CONCAT('%', p_search, '%')
            OR ja.email LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_leave_requests $$
CREATE PROCEDURE `sp_list_leave_requests`(
    IN p_employee_id INT,
    IN p_status VARCHAR(30),
    IN p_leave_type_id INT,
    IN p_department_id INT,
    IN p_reporting_to INT,
    IN p_limit BIGINT,
    IN p_offset BIGINT,
    IN p_team_role_id INT
)
BEGIN
    DECLARE v_limit BIGINT;
    DECLARE v_offset BIGINT;
    SET v_limit = IFNULL(p_limit, 18446744073709551615);
    SET v_offset = IFNULL(p_offset, 0);
    SELECT
        lr.*,
        e.emp_code,
        CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
        d.department_name,
        lt.leave_type_name,
        CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM leave_requests lr
        INNER JOIN employees e
            ON e.employee_id = lr.employee_id
        INNER JOIN leave_types lt
            ON lt.leave_type_id = lr.leave_type_id
        INNER JOIN users u
            ON u.employee_id = e.employee_id
        LEFT JOIN departments d
            ON d.department_id = e.department_id
        LEFT JOIN employees rv
            ON rv.employee_id = lr.reviewed_by
    WHERE
        (p_employee_id IS NULL OR lr.employee_id = p_employee_id)
        AND (p_status IS NULL OR lr.status = p_status)
        AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
        AND (p_department_id IS NULL OR e.department_id = p_department_id)
        AND (
                p_reporting_to IS NULL
                OR e.reporting_to = p_reporting_to
                OR (
                    p_team_role_id IS NOT NULL
                    AND u.role_id = p_team_role_id
                )
            )
    ORDER BY lr.applied_on DESC
    LIMIT v_offset, v_limit;
    SELECT
        COUNT(*) AS total
    FROM leave_requests lr
        INNER JOIN employees e
            ON e.employee_id = lr.employee_id
        INNER JOIN users u
            ON u.employee_id = e.employee_id
    WHERE
        (p_employee_id IS NULL OR lr.employee_id = p_employee_id)
        AND (p_status IS NULL OR lr.status = p_status)
        AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
        AND (p_department_id IS NULL OR e.department_id = p_department_id)
        AND (
                p_reporting_to IS NULL
                OR e.reporting_to = p_reporting_to
                OR (
                    p_team_role_id IS NOT NULL
                    AND u.role_id = p_team_role_id
                )
            );
END $$
DROP PROCEDURE IF EXISTS sp_list_manager_extra_work $$
CREATE PROCEDURE `sp_list_manager_extra_work`(IN p_manager_id INT)
BEGIN
  SELECT ew.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code
    FROM extra_work_requests ew
    JOIN employees e ON e.employee_id = ew.employee_id
   WHERE e.reporting_to = p_manager_id
   ORDER BY ew.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_manager_timesheets $$
CREATE PROCEDURE `sp_list_manager_timesheets`(IN p_manager_id INT, IN p_status VARCHAR(20))
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id=wt.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id
    LEFT JOIN employees m ON m.employee_id=wt.reviewed_by
   WHERE e.reporting_to=p_manager_id
     AND (p_status IS NULL OR wt.status=p_status)
   ORDER BY wt.week_start DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_my_tasks $$
CREATE PROCEDURE `sp_list_my_tasks`(IN p_employee_id INT)
BEGIN
  SELECT * FROM employee_tasks WHERE employee_id = p_employee_id ORDER BY created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_org_delegations $$
CREATE PROCEDURE `sp_list_org_delegations`(IN p_status VARCHAR(20), IN p_employee_id INT)
BEGIN
  SELECT wd.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,''))  AS employee_name,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,''))  AS delegate_name,
         de.designation_name AS employee_designation,
         dd.designation_name AS delegate_designation
    FROM workflow_delegates wd
    JOIN employees e ON e.employee_id=wd.employee_id
    JOIN employees d ON d.employee_id=wd.delegate_employee_id
    LEFT JOIN designations de ON de.designation_id=e.designation_id
    LEFT JOIN designations dd ON dd.designation_id=d.designation_id
   WHERE (p_status      IS NULL OR wd.status=p_status)
     AND (p_employee_id IS NULL OR wd.employee_id=p_employee_id)
   ORDER BY wd.created_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_list_payroll_runs $$
CREATE PROCEDURE `sp_list_payroll_runs`(
  IN p_year INT, IN p_status VARCHAR(20), IN p_limit INT, IN p_offset INT
)
BEGIN
DECLARE v_limit INT DEFAULT 50;
DECLARE v_offset INT DEFAULT 0;
SET v_limit = COALESCE(p_limit, 50);
SET v_offset = COALESCE(p_offset, 0);
  SELECT pr.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS processed_by_name
    FROM payroll_runs pr
    LEFT JOIN employees e ON e.employee_id = pr.processed_by
   WHERE (p_year   IS NULL OR pr.year   = p_year)
     AND (p_status IS NULL OR pr.status = p_status)
   ORDER BY pr.year DESC, pr.month DESC
   LIMIT v_offset, v_limit;
  SELECT COUNT(*) AS total FROM payroll_runs pr
   WHERE (p_year   IS NULL OR pr.year   = p_year)
     AND (p_status IS NULL OR pr.status = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_payslips $$
CREATE PROCEDURE `sp_list_payslips`(
  IN p_employee_id INT, IN p_month INT, IN p_year INT,
  IN p_status VARCHAR(20), IN p_department_id INT,
  IN p_payroll_run_id INT, IN p_limit INT, IN p_offset INT
)
BEGIN
    IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 1000000;
    END IF;
    IF p_offset IS NULL OR p_offset < 0 THEN
        SET p_offset = 0;
    END IF;
  SELECT p.*,
         ROUND(p.gross_earnings + LEAST(p.basic, 15000) * 0.12, 2) AS ctc_computed,
         e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, des.designation_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE (p_employee_id    IS NULL OR p.employee_id    = p_employee_id)
     AND (p_month          IS NULL OR p.month          = p_month)
     AND (p_year           IS NULL OR p.year           = p_year)
     AND (p_status         IS NULL OR p.status         = p_status)
     AND (p_department_id  IS NULL OR e.department_id  = p_department_id)
     AND (p_payroll_run_id IS NULL OR p.payroll_run_id = p_payroll_run_id)
   ORDER BY p.year DESC, p.month DESC, e.first_name ASC
       LIMIT p_offset, p_limit;
  SELECT COUNT(*) AS total
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
   WHERE (p_employee_id    IS NULL OR p.employee_id    = p_employee_id)
     AND (p_month          IS NULL OR p.month          = p_month)
     AND (p_year           IS NULL OR p.year           = p_year)
     AND (p_status         IS NULL OR p.status         = p_status)
     AND (p_department_id  IS NULL OR e.department_id  = p_department_id)
     AND (p_payroll_run_id IS NULL OR p.payroll_run_id = p_payroll_run_id);
END $$
DROP PROCEDURE IF EXISTS sp_list_permissions $$
CREATE PROCEDURE `sp_list_permissions`()
BEGIN
  SELECT * FROM permissions ORDER BY module, action;
END $$
DROP PROCEDURE IF EXISTS sp_list_referrals $$
CREATE PROCEDURE `sp_list_referrals`(
    IN p_referred_by INT,
    IN p_job_id INT,
    IN p_status VARCHAR(30),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        j.title AS job_title,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS referred_by_name
    FROM referrals r
    INNER JOIN jobs j
        ON j.job_id = r.job_id
    INNER JOIN employees e
        ON e.employee_id = r.referred_by
    WHERE
        (p_referred_by IS NULL OR r.referred_by = p_referred_by)
        AND (p_job_id IS NULL OR r.job_id = p_job_id)
        AND (p_status IS NULL OR r.status = p_status)
    ORDER BY r.referred_on DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM referrals r
    WHERE
        (p_referred_by IS NULL OR r.referred_by = p_referred_by)
        AND (p_job_id IS NULL OR r.job_id = p_job_id)
        AND (p_status IS NULL OR r.status = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_request_hub $$
CREATE PROCEDURE `sp_list_request_hub`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_request_type VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        rh.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM request_hub rh
    INNER JOIN employees e
        ON e.employee_id = rh.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = rh.reviewed_by
    WHERE
        (p_employee_id IS NULL OR rh.employee_id = p_employee_id)
        AND (p_status IS NULL OR rh.status = p_status)
        AND (
            p_request_type IS NULL
            OR rh.request_type = p_request_type
        )
    ORDER BY rh.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM request_hub rh
    WHERE
        (p_employee_id IS NULL OR rh.employee_id = p_employee_id)
        AND (p_status IS NULL OR rh.status = p_status)
        AND (
            p_request_type IS NULL
            OR rh.request_type = p_request_type
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_reviews $$
CREATE PROCEDURE `sp_list_reviews`(
    IN p_employee_id INT,
    IN p_reviewer_id INT,
    IN p_status VARCHAR(30),
    IN p_review_type_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        r.*,
        rt.name AS review_type_name,
        rt.frequency,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM reviews r
    INNER JOIN review_types rt
        ON rt.review_type_id = r.review_type_id
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = r.reviewer_id
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_reviewer_id IS NULL OR r.reviewer_id = p_reviewer_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (
            p_review_type_id IS NULL
            OR r.review_type_id = p_review_type_id
        )
    ORDER BY r.due_date DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM reviews r
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_reviewer_id IS NULL OR r.reviewer_id = p_reviewer_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (
            p_review_type_id IS NULL
            OR r.review_type_id = p_review_type_id
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_roles_basic $$
CREATE PROCEDURE `sp_list_roles_basic`()
BEGIN
  SELECT role_id, role_name, description
  FROM roles
  ORDER BY role_id;
END $$
DROP PROCEDURE IF EXISTS sp_list_salary_components $$
CREATE PROCEDURE `sp_list_salary_components`(IN p_active_only TINYINT(1))
BEGIN
  SELECT * FROM salary_components
   WHERE (p_active_only IS NULL OR is_active = p_active_only)
   ORDER BY category, sort_order, component_name;
END $$
DROP PROCEDURE IF EXISTS sp_list_salary_structures $$
CREATE PROCEDURE `sp_list_salary_structures`()
BEGIN
  SELECT s.*,
         COUNT(l.line_id) AS component_count
    FROM salary_structures s
    LEFT JOIN salary_structure_lines l ON l.structure_id = s.structure_id AND l.is_active = 1
   WHERE s.is_active = 1
   GROUP BY s.structure_id
   ORDER BY s.is_default DESC, s.structure_name;
END $$
DROP PROCEDURE IF EXISTS sp_list_salary_templates $$
CREATE PROCEDURE `sp_list_salary_templates`()
BEGIN
  SELECT * FROM salary_templates WHERE is_active = 1 ORDER BY is_default DESC, template_name ASC;
END $$
DROP PROCEDURE IF EXISTS sp_list_teams $$
CREATE PROCEDURE `sp_list_teams`(
    IN p_department_id INT,
    IN p_search VARCHAR(100),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        t.*,
        d.department_name,
        CONCAT(
            le.first_name,
            ' ',
            IFNULL(le.last_name, '')
        ) AS lead_name,
        (
            SELECT COUNT(*)
            FROM team_members tm
            WHERE tm.team_id = t.team_id
        ) AS member_count
    FROM teams t
    LEFT JOIN departments d
        ON d.department_id = t.department_id
    LEFT JOIN employees le
        ON le.employee_id = t.lead_employee_id
    WHERE
        (
            p_department_id IS NULL
            OR t.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.team_name LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY t.team_name ASC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM teams t
    WHERE
        (
            p_department_id IS NULL
            OR t.department_id = p_department_id
        )
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.team_name LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_team_helpdesk $$
CREATE PROCEDURE `sp_list_team_helpdesk`(
    IN p_manager_id INT,
    IN p_status VARCHAR(30),
    IN p_priority VARCHAR(20),
    IN p_category VARCHAR(50),
    IN p_search VARCHAR(200),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        t.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        e.emp_code,
        CONCAT(
            a.first_name,
            ' ',
            IFNULL(a.last_name, '')
        ) AS assigned_to_name
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    LEFT JOIN employees a
        ON a.employee_id = t.assigned_to
    WHERE
        e.reporting_to = p_manager_id
        AND (p_status IS NULL OR t.status = p_status)
        AND (p_priority IS NULL OR t.priority = p_priority)
        AND (p_category IS NULL OR t.category = p_category)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.subject LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY t.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    WHERE
        e.reporting_to = p_manager_id
        AND (p_status IS NULL OR t.status = p_status)
        AND (p_priority IS NULL OR t.priority = p_priority)
        AND (p_category IS NULL OR t.category = p_category)
        AND (
            p_search IS NULL
            OR p_search = ''
            OR t.subject LIKE CONCAT('%', p_search, '%')
        );
END $$
DROP PROCEDURE IF EXISTS sp_list_workflow_delegates $$
CREATE PROCEDURE `sp_list_workflow_delegates`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;
    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);
    SELECT
        wd.*,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        CONCAT(
            d.first_name,
            ' ',
            IFNULL(d.last_name, '')
        ) AS delegate_name
    FROM workflow_delegates wd
    INNER JOIN employees e
        ON e.employee_id = wd.employee_id
    INNER JOIN employees d
        ON d.employee_id = wd.delegate_employee_id
    WHERE
        (
            p_employee_id IS NULL
            OR wd.employee_id = p_employee_id
            OR wd.delegate_employee_id = p_employee_id
        )
        AND (p_status IS NULL OR wd.status = p_status)
    ORDER BY wd.created_at DESC
    LIMIT v_limit OFFSET v_offset;
    SELECT COUNT(*) AS total
    FROM workflow_delegates wd
    WHERE
        (
            p_employee_id IS NULL
            OR wd.employee_id = p_employee_id
            OR wd.delegate_employee_id = p_employee_id
        )
        AND (p_status IS NULL OR wd.status = p_status);
END $$
DROP PROCEDURE IF EXISTS sp_list_work_schedules $$
CREATE PROCEDURE `sp_list_work_schedules`()
BEGIN
  SELECT e.employee_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, e.employee_status, d.department_name,
         ws.schedule_id, ws.schedule_type, ws.work_days,
         ws.start_time, ws.end_time, ws.rotation_pattern, ws.updated_at
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employee_work_schedules ws ON ws.employee_id = e.employee_id
   WHERE e.employee_status IN ('Active','Notice Period')
     AND e.has_left_organization = 0
   ORDER BY e.first_name, e.last_name;
END $$
DROP PROCEDURE IF EXISTS sp_login_fail $$
CREATE PROCEDURE `sp_login_fail`(
  IN p_user_id INT, IN p_max_attempts INT, IN p_lockout_mins INT,
  OUT p_locked TINYINT, OUT p_attempts INT
)
BEGIN
  DECLARE v_attempts INT DEFAULT 0;
  SELECT IFNULL(failed_login_attempts, 0) + 1 INTO v_attempts FROM users WHERE user_id = p_user_id;
  SET p_attempts = v_attempts;
  IF v_attempts >= p_max_attempts THEN
    UPDATE users SET failed_login_attempts = v_attempts,
           locked_until = DATE_ADD(NOW(), INTERVAL p_lockout_mins MINUTE)
     WHERE user_id = p_user_id;
    SET p_locked = 1;
  ELSE
    UPDATE users SET failed_login_attempts = v_attempts WHERE user_id = p_user_id;
    SET p_locked = 0;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_login_success $$
CREATE PROCEDURE `sp_login_success`(IN p_user_id INT)
BEGIN
  UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL
   WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_log_reporting_history $$
CREATE PROCEDURE `sp_log_reporting_history`(
  IN p_employee_id INT, IN p_old_manager_id INT, IN p_new_manager_id INT,
  IN p_changed_by INT, IN p_reason TEXT, IN p_change_type VARCHAR(30)
)
BEGIN
  INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
  VALUES (p_employee_id, p_old_manager_id, p_new_manager_id, p_changed_by, p_reason, p_change_type);
END $$
DROP PROCEDURE IF EXISTS sp_manager_action_ticket $$
CREATE PROCEDURE `sp_manager_action_ticket`(
    IN p_manager_id INT,
    IN p_ticket_id INT,
    IN p_action VARCHAR(20),
    IN p_forward_team VARCHAR(50),
    IN p_comment TEXT,
    OUT p_ok TINYINT,
    OUT p_msg VARCHAR(200)
)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    DECLARE v_status VARCHAR(30);
    SET p_ok = 0;
    SET p_msg = '';
    SELECT COUNT(*)
    INTO v_cnt
    FROM helpdesk_tickets t
    INNER JOIN employees e
        ON e.employee_id = t.employee_id
    WHERE
        t.ticket_id = p_ticket_id
        AND e.reporting_to = p_manager_id;
    IF v_cnt = 0 THEN
        SET p_msg = 'Ticket does not belong to your team';
    ELSE
        SELECT status
        INTO v_status
        FROM helpdesk_tickets
        WHERE ticket_id = p_ticket_id
        LIMIT 1;
        IF v_status <> 'Open' THEN
            SET p_msg = 'Only Open tickets can be actioned by manager';
        ELSEIF LOWER(TRIM(p_action)) = 'approve' THEN
            IF p_forward_team IS NULL OR TRIM(p_forward_team) = '' THEN
                SET p_msg = 'Forward team is required';
            ELSE
                UPDATE helpdesk_tickets
                SET
                    status = 'Forwarded',
                    forwarded_to_team = p_forward_team
                WHERE ticket_id = p_ticket_id;
                INSERT INTO helpdesk_comments (
                    ticket_id,
                    commented_by,
                    comment
                )
                VALUES (
                    p_ticket_id,
                    p_manager_id,
                    COALESCE(p_comment, '')
                );
                SET p_ok = 1;
                SET p_msg = 'Ticket forwarded successfully';
            END IF;
        ELSEIF LOWER(TRIM(p_action)) = 'reject' THEN
            UPDATE helpdesk_tickets
            SET
                status = 'Rejected',
                resolved_at = NOW()
            WHERE ticket_id = p_ticket_id;
            INSERT INTO helpdesk_comments (
                ticket_id,
                commented_by,
                comment
            )
            VALUES (
                p_ticket_id,
                p_manager_id,
                COALESCE(p_comment, '')
            );
            SET p_ok = 1;
            SET p_msg = 'Ticket rejected successfully';
        ELSE
            SET p_msg = 'Invalid action. Use approve or reject';
        END IF;
    END IF;
END $$
DROP PROCEDURE IF EXISTS sp_manager_full_dashboard $$
CREATE PROCEDURE `sp_manager_full_dashboard`(IN p_manager_id INT)
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS name,
         e.emp_job_title, d.department_name,
         EXISTS(SELECT 1 FROM resignations r WHERE r.employee_id=e.employee_id
                  AND r.status IN ('pending','rm_approved','accepted')) AS serving_notice
    FROM employees e
    LEFT JOIN departments d ON d.department_id=e.department_id
   WHERE e.reporting_to=p_manager_id AND e.employee_status='Active'
   ORDER BY e.first_name;
  SELECT a.employee_id, a.status, a.check_in, a.check_out, a.work_hours, a.late_by_minutes
    FROM attendance a
    JOIN employees e ON e.employee_id=a.employee_id
   WHERE e.reporting_to=p_manager_id AND a.attendance_date=CURDATE();
  SELECT SUM(wt.status='pending') AS pending,
         SUM(wt.status='approved') AS approved,
         SUM(wt.status='rejected') AS rejected
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id=wt.employee_id
   WHERE e.reporting_to=p_manager_id;
  SELECT * FROM (
    (SELECT 'timesheet' AS type,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS actor,
            CONCAT('Submitted timesheet for week ',DATE_FORMAT(wt.week_start,'%d %b %Y')) AS detail,
            wt.submitted_at AS occurred_at
       FROM weekly_timesheets wt
       JOIN employees e ON e.employee_id=wt.employee_id
      WHERE e.reporting_to=p_manager_id AND wt.submitted_at IS NOT NULL)
    UNION ALL
    (SELECT 'leave' AS type,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS actor,
            CONCAT('Applied for ',IFNULL(lt.leave_type_name,'Leave'),' (',lr.from_date,' to ',lr.to_date,')') AS detail,
            lr.applied_on AS occurred_at
       FROM leave_requests lr
       JOIN employees e ON e.employee_id=lr.employee_id
       LEFT JOIN leave_types lt ON lt.leave_type_id=lr.leave_type_id
      WHERE e.reporting_to=p_manager_id AND lr.applied_on IS NOT NULL)
    ORDER BY occurred_at DESC LIMIT 10
  ) AS activities;
END $$
DROP PROCEDURE IF EXISTS sp_manager_review_resignation $$
CREATE PROCEDURE `sp_manager_review_resignation`(
  IN p_manager_id INT, IN p_resignation_id INT,
  IN p_status VARCHAR(20), IN p_remarks TEXT, OUT p_ok TINYINT
)
BEGIN
  DECLARE v_cnt INT DEFAULT 0;
  SELECT COUNT(*) INTO v_cnt FROM resignations r
    JOIN employees e ON e.employee_id = r.employee_id
   WHERE r.resignation_id = p_resignation_id AND e.reporting_to = p_manager_id AND r.status = 'pending';
  IF v_cnt = 0 THEN SET p_ok = 0;
  ELSE
    UPDATE resignations SET status = p_status, manager_remarks = p_remarks,
           manager_reviewed_by = p_manager_id, manager_reviewed_at = NOW()
     WHERE resignation_id = p_resignation_id;
    SET p_ok = 1;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_manager_timesheet_counts $$
CREATE PROCEDURE `sp_manager_timesheet_counts`(IN p_manager_id INT)
BEGIN
  SELECT SUM(wt.status='pending') AS pending,
         SUM(wt.status='approved')  AS approved,
         SUM(wt.status='rejected')  AS rejected
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
   WHERE e.reporting_to = p_manager_id;
END $$
DROP PROCEDURE IF EXISTS sp_mark_payslip_paid $$
CREATE PROCEDURE `sp_mark_payslip_paid`(IN p_id INT)
BEGIN
  UPDATE payslips SET status='Paid' WHERE payslip_id=p_id;
END $$
DROP PROCEDURE IF EXISTS sp_migrate_holidays_shift_location $$
CREATE PROCEDURE `sp_migrate_holidays_shift_location`()
BEGIN
  -- Add shift column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'holidays'
      AND COLUMN_NAME  = 'shift'
  ) THEN
    ALTER TABLE holidays
      ADD COLUMN shift ENUM('general','mid','night') NOT NULL DEFAULT 'general' AFTER holiday_calendar;
    ALTER TABLE holidays ADD INDEX idx_holidays_shift (shift);
  END IF;
  -- Add location column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'holidays'
      AND COLUMN_NAME  = 'location'
  ) THEN
    ALTER TABLE holidays
      ADD COLUMN location VARCHAR(100) DEFAULT NULL AFTER shift;
    ALTER TABLE holidays ADD INDEX idx_holidays_location (location);
  END IF;
  -- Back-fill existing rows
  UPDATE holidays SET shift = 'general' WHERE shift IS NULL OR shift = '';
END $$
DROP PROCEDURE IF EXISTS sp_org_dashboard_stats $$
CREATE PROCEDURE `sp_org_dashboard_stats`()
BEGIN
  SELECT COUNT(*) AS cnt FROM employees WHERE employee_status='Active';
  SELECT COUNT(*) AS cnt FROM employees e
    LEFT JOIN users u ON u.employee_id = e.employee_id
   WHERE e.employee_status='Active'
     AND (e.reporting_to IS NULL OR e.reporting_to=0)
     AND (u.role_id IS NULL OR u.role_id!=1);
  SELECT COUNT(DISTINCT reporting_to) AS cnt FROM employees
   WHERE reporting_to IS NOT NULL AND employee_status='Active';
  SELECT COUNT(*) AS cnt FROM workflow_delegates
   WHERE status='Active' AND to_date >= CURDATE();
END $$
DROP PROCEDURE IF EXISTS sp_payroll_report $$
CREATE PROCEDURE `sp_payroll_report`(IN p_month INT, IN p_year INT, IN p_department_id INT)
BEGIN
  SELECT p.month, p.year, COUNT(*) AS payslip_count,
         SUM(p.gross_earnings) AS total_gross, SUM(p.deductions) AS total_deductions, SUM(p.net_pay) AS total_net
    FROM payslips p
    JOIN employees e ON e.employee_id=p.employee_id
   WHERE (p_month         IS NULL OR p.month=p_month)
     AND (p_year          IS NULL OR p.year=p_year)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
   GROUP BY p.month, p.year ORDER BY p.year DESC, p.month DESC;
  SELECT p.payslip_id, p.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, p.month, p.year, p.gross_earnings, p.deductions, p.net_pay, p.status
    FROM payslips p
    JOIN employees e ON e.employee_id=p.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id
   WHERE (p_month         IS NULL OR p.month=p_month)
     AND (p_year          IS NULL OR p.year=p_year)
     AND (p_department_id IS NULL OR e.department_id=p_department_id)
   ORDER BY p.year DESC, p.month DESC LIMIT 500;
END $$
DROP PROCEDURE IF EXISTS sp_recent_activities $$
CREATE PROCEDURE `sp_recent_activities`(IN p_limit INT)
BEGIN
   IF p_limit IS NULL OR p_limit <= 0 THEN
        SET p_limit = 10;
    END IF;
  SELECT a.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS performed_by_name
    FROM audit_logs a
    LEFT JOIN employees e ON e.employee_id = a.user_id
   ORDER BY a.created_at DESC
       LIMIT p_limit;
END $$
DROP PROCEDURE IF EXISTS sp_rec_admin_dashboard $$
CREATE PROCEDURE `sp_rec_admin_dashboard`()
BEGIN
  -- result[0]: Stat cards
  SELECT
    (SELECT COUNT(*) FROM rec_job_requests WHERE deleted_at IS NULL)                                     AS total_jobs,
    (SELECT COUNT(*) FROM rec_job_requests WHERE assignment_status = 'Open' AND deleted_at IS NULL)      AS open_jobs,
    (SELECT COUNT(*) FROM rec_candidates  WHERE deleted_at IS NULL)                                      AS total_candidates,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Schedule Interview' AND deleted_at IS NULL)    AS in_interview,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Shortlisted'        AND deleted_at IS NULL)    AS shortlisted,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Released')                                     AS offers_pending,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Accepted')                                     AS offers_accepted,
    (SELECT COUNT(*) FROM rec_onboarding  WHERE current_status != 'Completed')                           AS active_onboarding;
  -- result[1]: Candidate pipeline by status
  SELECT status, COUNT(*) AS count
  FROM   rec_candidates WHERE deleted_at IS NULL
  GROUP BY status ORDER BY count DESC;
  -- result[2]: Recruiter performance (last 30 days)
  SELECT CONCAT(e.first_name,' ',e.last_name) AS recruiter,
         COUNT(DISTINCT c.candidate_id)        AS candidates_added,
         COALESCE(MAX(iv.cnt), 0)              AS interviews_scheduled,
         COALESCE(MAX(ol.cnt), 0)              AS offers_created
  FROM   employees e
  JOIN   users u ON u.employee_id = e.employee_id AND u.role_id = 5
  LEFT JOIN rec_candidates c
    ON  c.recruiter_id = e.employee_id
    AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    AND c.deleted_at IS NULL
  LEFT JOIN (
    SELECT ri.scheduled_by, COUNT(*) AS cnt
    FROM   rec_interviews ri
    WHERE  ri.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY ri.scheduled_by
  ) iv ON iv.scheduled_by = u.user_id
  LEFT JOIN (
    SELECT rc.recruiter_id, COUNT(*) AS cnt
    FROM   rec_offers ro
    JOIN   rec_candidates rc ON rc.candidate_id = ro.candidate_id
    WHERE  ro.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY rc.recruiter_id
  ) ol ON ol.recruiter_id = e.employee_id
  GROUP BY e.employee_id, e.first_name, e.last_name;
  -- result[3]: Recent job requests (last 5)
  SELECT job_req_id, job_req_code, title, client, assignment_status, created_at
  FROM   rec_job_requests WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;
  -- result[4]: Shortlisted candidates with recruiter name
  SELECT
    c.candidate_id,
    c.candidate_code,
    c.name           AS candidate_name,
    c.updated_at     AS shortlisted_at,
    CONCAT(e.first_name, ' ', e.last_name) AS hr_name
  FROM   rec_candidates c
  JOIN   employees e ON e.employee_id = c.recruiter_id
  WHERE  c.status = 'Shortlisted'
    AND  c.deleted_at IS NULL
  ORDER  BY c.updated_at DESC;
END $$
DROP PROCEDURE IF EXISTS sp_rec_assign_recruiters $$
CREATE PROCEDURE `sp_rec_assign_recruiters`(
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
DROP PROCEDURE IF EXISTS sp_rec_audit $$
CREATE PROCEDURE `sp_rec_audit`(
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
DROP PROCEDURE IF EXISTS sp_rec_cancel_interview $$
CREATE PROCEDURE `sp_rec_cancel_interview`(
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
DROP PROCEDURE IF EXISTS sp_rec_check_duplicate_candidate $$
CREATE PROCEDURE `sp_rec_check_duplicate_candidate`(
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
DROP PROCEDURE IF EXISTS sp_rec_check_duplicate_candidate_dynamic $$
CREATE PROCEDURE `sp_rec_check_duplicate_candidate_dynamic`(
IN p_email VARCHAR(200),
IN p_phone VARCHAR(50),
IN p_linkedin VARCHAR(300),
IN p_resume_hash VARCHAR(200),
IN p_github VARCHAR(300)
)
BEGIN
SELECT *
FROM rec_candidate
WHERE
email=p_email
OR phone=p_phone
OR linkedin_url=p_linkedin
OR github_url=p_github
OR resume_hash=p_resume_hash;
END $$
DROP PROCEDURE IF EXISTS sp_rec_create_candidate $$
CREATE PROCEDURE `sp_rec_create_candidate`(
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
DROP PROCEDURE IF EXISTS sp_rec_create_job_request $$
CREATE PROCEDURE `sp_rec_create_job_request`(
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
DROP PROCEDURE IF EXISTS sp_rec_create_offer $$
CREATE PROCEDURE `sp_rec_create_offer`(
  IN  p_candidate_id        INT,
  IN  p_job_req_id          INT,
  IN  p_designation         VARCHAR(200),
  IN  p_date_of_joining     DATE,
  IN  p_basic               DECIMAL(15,2),
  IN  p_hra                 DECIMAL(15,2),
  IN  p_telephone_allowance DECIMAL(15,2),
  IN  p_leave_travel        DECIMAL(15,2),
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
      basic, hra, telephone_allowance, leave_travel, special_allowance, gross_salary,
      pf_contribution, statutory_bonus, gratuity, esi, ctc, ctc_in_words,
      status, created_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_designation, p_date_of_joining,
      p_basic, p_hra, p_telephone_allowance, p_leave_travel, p_special_allowance, p_gross_salary,
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
DROP PROCEDURE IF EXISTS sp_rec_create_onboarding $$
CREATE PROCEDURE `sp_rec_create_onboarding`(
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
DROP PROCEDURE IF EXISTS sp_rec_delete_job_request $$
CREATE PROCEDURE `sp_rec_delete_job_request`(
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
DROP PROCEDURE IF EXISTS sp_rec_finalize_onboarding $$
CREATE PROCEDURE `sp_rec_finalize_onboarding`(
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
DROP PROCEDURE IF EXISTS sp_rec_get_candidate $$
CREATE PROCEDURE `sp_rec_get_candidate`(IN p_candidate_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_education $$
CREATE PROCEDURE `sp_rec_get_candidate_education`(
  IN p_candidate_id INT
)
BEGIN
  SELECT edu_id, degree, institution, year_of_pass, created_at
  FROM rec_candidate_education
  WHERE candidate_id = p_candidate_id
  ORDER BY year_of_pass DESC;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_experience $$
CREATE PROCEDURE `sp_rec_get_candidate_experience`(
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
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_match_inputs $$
CREATE PROCEDURE `sp_rec_get_candidate_match_inputs`(IN p_candidate_id INT)
BEGIN
  SELECT skill_set, relevant_experience
  FROM rec_candidates
  WHERE candidate_id = p_candidate_id;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_candidate_skills $$
CREATE PROCEDURE `sp_rec_get_candidate_skills`(
  IN p_candidate_id INT
)
BEGIN
  SELECT skill_id, skill_name, source, created_at
  FROM rec_candidate_skills
  WHERE candidate_id = p_candidate_id
  ORDER BY source DESC, skill_name ASC;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_interview $$
CREATE PROCEDURE `sp_rec_get_interview`(IN p_interview_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_get_job_match_inputs $$
CREATE PROCEDURE `sp_rec_get_job_match_inputs`(IN p_job_req_id INT)
BEGIN
  SELECT title, skill_set, experience_level
  FROM rec_job_requests
  WHERE job_req_id = p_job_req_id;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_job_request $$
CREATE PROCEDURE `sp_rec_get_job_request`(IN p_job_req_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_get_match $$
CREATE PROCEDURE `sp_rec_get_match`(
  IN p_candidate_id INT,
  IN p_job_req_id   INT
)
BEGIN
  SELECT m.*, c.name AS candidate_name, j.title AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.candidate_id = p_candidate_id AND m.job_req_id = p_job_req_id;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_offer $$
CREATE PROCEDURE `sp_rec_get_offer`(IN p_offer_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_get_onboarding $$
CREATE PROCEDURE `sp_rec_get_onboarding`(IN p_onboarding_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_get_parser_fields $$
CREATE PROCEDURE `sp_rec_get_parser_fields`()
BEGIN
SELECT *
FROM rec_parser_fields
WHERE is_enabled=1
ORDER BY display_order;
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_parser_logs $$
CREATE PROCEDURE `sp_rec_get_parser_logs`(
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
DROP PROCEDURE IF EXISTS sp_rec_get_recruiter_notification_targets $$
CREATE PROCEDURE `sp_rec_get_recruiter_notification_targets`(IN p_recruiter_ids JSON)
BEGIN
  SELECT
    e.email,
    CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS name
  FROM employees e
  JOIN JSON_TABLE(
    p_recruiter_ids,
    '$[*]' COLUMNS (employee_id INT PATH '$')
  ) ids ON ids.employee_id = e.employee_id
  WHERE e.employee_status = 'Active';
END $$
DROP PROCEDURE IF EXISTS sp_rec_get_recruiter_team_lead $$
CREATE PROCEDURE `sp_rec_get_recruiter_team_lead`(
    IN p_recruiter_id INT
)
BEGIN
    SELECT
        tl.email AS tl_email,
        CONCAT(
            tl.first_name,
            ' ',
            IFNULL(tl.last_name, '')
        ) AS tl_name,
        CONCAT(
            r.first_name,
            ' ',
            IFNULL(r.last_name, '')
        ) AS recruiter_name
    FROM employees r
    LEFT JOIN employees tl
        ON tl.employee_id = r.reporting_to
    WHERE r.employee_id = p_recruiter_id
    LIMIT 1;
END $$
DROP PROCEDURE IF EXISTS sp_rec_list_active_recruiters $$
CREATE PROCEDURE `sp_rec_list_active_recruiters`()
BEGIN
  SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS name,
    u.email
  FROM users u
  JOIN employees e ON e.employee_id = u.employee_id
  WHERE u.role_id = 5
    AND u.status = 'Active'
    AND e.employee_status = 'Active'
  ORDER BY e.first_name;
END $$
DROP PROCEDURE IF EXISTS sp_rec_list_candidates $$
CREATE PROCEDURE `sp_rec_list_candidates`(
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
         CONCAT(re.first_name,' ',re.last_name) AS recruiter_name,
         -- feedback_status of the latest completed interview round
         (
           SELECT iv.feedback_status
           FROM   rec_interviews iv
           WHERE  iv.candidate_id = c.candidate_id
             AND  iv.status = 'Completed'
           ORDER  BY iv.interview_date DESC, iv.interview_id DESC
           LIMIT  1
         ) AS last_interview_feedback
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
DROP PROCEDURE IF EXISTS sp_rec_list_interviews $$
CREATE PROCEDURE `sp_rec_list_interviews`(
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
         iv.duration_minutes, iv.interviewer, iv.candidate_type,
         iv.status,
         iv.feedback_status, iv.feedback_comments, iv.shortlisted,
         iv.recruiter_feedback_status, iv.recruiter_feedback_comments,
         iv.teams_subject, iv.teams_join_url, iv.scheduled_by, iv.created_at,
         iv.teams_participants AS to_addresses,
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
DROP PROCEDURE IF EXISTS sp_rec_list_job_requests $$
CREATE PROCEDURE `sp_rec_list_job_requests`(
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
DROP PROCEDURE IF EXISTS sp_rec_list_matches_by_job $$
CREATE PROCEDURE `sp_rec_list_matches_by_job`(IN p_job_req_id INT)
BEGIN
  SELECT
    m.*,
    c.name               AS candidate_name,
    c.email              AS candidate_email,
    c.candidate_code,
    c.total_experience,
    c.relevant_experience,
    c.skill_set          AS candidate_skills,
    c.status             AS candidate_status,
    j.title              AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.job_req_id = p_job_req_id
  ORDER  BY m.match_score DESC;
END $$
DROP PROCEDURE IF EXISTS sp_rec_list_offers $$
CREATE PROCEDURE `sp_rec_list_offers`(
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
DROP PROCEDURE IF EXISTS sp_rec_list_onboarding $$
CREATE PROCEDURE `sp_rec_list_onboarding`(
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
DROP PROCEDURE IF EXISTS sp_rec_log_parser $$
CREATE PROCEDURE `sp_rec_log_parser`(
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
DROP PROCEDURE IF EXISTS sp_rec_log_parser_dynamic $$
CREATE PROCEDURE `sp_rec_log_parser_dynamic`(
IN p_candidate_id BIGINT,
IN p_file_name VARCHAR(300),
IN p_mime_type VARCHAR(100),
IN p_file_size BIGINT,
IN p_parser_type VARCHAR(50),
IN p_status VARCHAR(50),
IN p_error TEXT,
IN p_text_length BIGINT,
IN p_summary JSON,
IN p_duration BIGINT,
IN p_json JSON
)
BEGIN
INSERT INTO rec_parser_logs
(
candidate_id,
file_name,
mime_type,
file_size,
parser_type,
parser_status,
error_message,
raw_text_length,
fields_summary,
duration_ms,
full_json
)
VALUES
(
p_candidate_id,
p_file_name,
p_mime_type,
p_file_size,
p_parser_type,
p_status,
p_error,
p_text_length,
p_summary,
p_duration,
p_json
);
END $$
DROP PROCEDURE IF EXISTS sp_rec_next_code $$
CREATE PROCEDURE `sp_rec_next_code`(
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
DROP PROCEDURE IF EXISTS sp_rec_pipeline_report $$
CREATE PROCEDURE `sp_rec_pipeline_report`(
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
DROP PROCEDURE IF EXISTS sp_rec_recruiter_dashboard $$
CREATE PROCEDURE `sp_rec_recruiter_dashboard`(IN p_recruiter_emp_id INT)
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
DROP PROCEDURE IF EXISTS sp_rec_release_offer $$
CREATE PROCEDURE `sp_rec_release_offer`(
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
DROP PROCEDURE IF EXISTS sp_rec_respond_offer $$
CREATE PROCEDURE `sp_rec_respond_offer`(
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
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_education $$
CREATE PROCEDURE `sp_rec_save_candidate_education`(
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
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_experience $$
CREATE PROCEDURE `sp_rec_save_candidate_experience`(
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
DROP PROCEDURE IF EXISTS sp_rec_save_candidate_skills $$
CREATE PROCEDURE `sp_rec_save_candidate_skills`(
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
DROP PROCEDURE IF EXISTS sp_rec_save_dynamic_field $$
CREATE PROCEDURE `sp_rec_save_dynamic_field`(
IN p_candidate_id BIGINT,
IN p_field_name VARCHAR(100),
IN p_field_value JSON
)
BEGIN
INSERT INTO rec_candidate_dynamic_fields
(
candidate_id,
field_name,
field_value
)
VALUES
(
p_candidate_id,
p_field_name,
p_field_value
);
END $$
DROP PROCEDURE IF EXISTS sp_rec_schedule_interview $$
CREATE PROCEDURE `sp_rec_schedule_interview`(
  IN  p_candidate_id      INT,
  IN  p_job_req_id        INT,
  IN  p_level             VARCHAR(30),
  IN  p_interview_type    VARCHAR(30),
  IN  p_interview_date    DATE,
  IN  p_interview_time    TIME,
  IN  p_duration_minutes  INT,
  IN  p_interviewer       VARCHAR(200),
  IN  p_candidate_type    VARCHAR(20),
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
      interview_date, interview_time, duration_minutes, interviewer, candidate_type,
      teams_subject, teams_participants, teams_start, teams_end,
      status, scheduled_by
    ) VALUES (
      v_code, p_candidate_id, p_job_req_id, p_level, p_interview_type,
      p_interview_date, p_interview_time, p_duration_minutes, p_interviewer,
      COALESCE(p_candidate_type, 'External'),
      p_teams_subject, p_teams_participants, p_teams_start, p_teams_end,
      'Scheduled', p_scheduled_by
    );
    SET p_interview_id   = LAST_INSERT_ID();
    SET p_interview_code = v_code;
    UPDATE rec_candidates
    SET status = 'Interview Scheduled', updated_by = p_scheduled_by
    WHERE candidate_id = p_candidate_id;
    CALL sp_rec_audit('interview', p_interview_id, 'scheduled',
      NULL, JSON_OBJECT('level', p_level, 'interview_type', p_interview_type,
                        'interview_date', p_interview_date, 'candidate_type', p_candidate_type),
      p_scheduled_by, p_ip, NULL);
  COMMIT;
  CALL sp_rec_get_interview(p_interview_id);
END $$
DROP PROCEDURE IF EXISTS sp_rec_set_interview_join_url $$
CREATE PROCEDURE `sp_rec_set_interview_join_url`(
  IN p_interview_id INT,
  IN p_join_url TEXT
)
BEGIN
  UPDATE rec_interviews
  SET teams_join_url = p_join_url
  WHERE interview_id = p_interview_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_rec_set_zoom_meeting_details $$
CREATE PROCEDURE `sp_rec_set_zoom_meeting_details`(
  IN p_interview_id INT,
  IN p_meeting_id VARCHAR(64),
  IN p_join_url TEXT
)
BEGIN
  UPDATE rec_interviews
  SET zoom_meeting_id = p_meeting_id,
      teams_join_url = p_join_url
  WHERE interview_id = p_interview_id;
END $$
DROP PROCEDURE IF EXISTS sp_rec_submit_feedback $$
CREATE PROCEDURE `sp_rec_submit_feedback`(
  IN p_interview_id       INT,
  IN p_feedback_status    VARCHAR(20),
  IN p_feedback_comments  TEXT,
  IN p_shortlisted        TINYINT(1),
  IN p_submitted_by       INT,
  IN p_ip                 VARCHAR(45)
)
BEGIN
  DECLARE v_cand_id  INT;
  DECLARE v_level    VARCHAR(30);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id AND status = 'Scheduled') THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found or already completed';
  END IF;
  SELECT candidate_id, level
  INTO   v_cand_id, v_level
  FROM   rec_interviews
  WHERE  interview_id = p_interview_id;
  START TRANSACTION;
    UPDATE rec_interviews SET
      feedback_status   = p_feedback_status,
      feedback_comments = p_feedback_comments,
      shortlisted       = COALESCE(p_shortlisted, 0),
      status            = 'Completed',
      feedback_by       = p_submitted_by
    WHERE interview_id = p_interview_id;
    -- Round progression logic
    IF p_feedback_status = 'Selected' THEN
      IF v_level = 'Final' THEN
        -- Final round passed → ready for offer
        UPDATE rec_candidates SET status = 'Shortlisted', updated_by = p_submitted_by
        WHERE candidate_id = v_cand_id;
      ELSE
        -- Intermediate round passed → recruiter schedules next round
        UPDATE rec_candidates SET status = 'Schedule Interview', updated_by = p_submitted_by
        WHERE candidate_id = v_cand_id;
      END IF;
    ELSEIF p_feedback_status = 'Not Selected' THEN
      UPDATE rec_candidates SET status = 'Rejected', updated_by = p_submitted_by
      WHERE candidate_id = v_cand_id;
    END IF;
    -- 'Hold' → no status change
    CALL sp_rec_audit('interview', p_interview_id, 'feedback_submitted',
      NULL, JSON_OBJECT('feedback_status', p_feedback_status, 'level', v_level, 'shortlisted', p_shortlisted),
      p_submitted_by, p_ip, NULL);
  COMMIT;
  CALL sp_rec_get_interview(p_interview_id);
END $$
DROP PROCEDURE IF EXISTS sp_rec_submit_recruiter_feedback $$
CREATE PROCEDURE `sp_rec_submit_recruiter_feedback`(
  IN p_interview_id         INT,
  IN p_feedback_status      VARCHAR(50),
  IN p_feedback_comments    TEXT,
  IN p_submitted_by         INT,
  IN p_ip                   VARCHAR(45)
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rec_interviews WHERE interview_id = p_interview_id) THEN
    SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Interview not found';
  END IF;
  UPDATE rec_interviews
     SET recruiter_feedback_status   = p_feedback_status,
         recruiter_feedback_comments = p_feedback_comments,
         updated_at                  = NOW()
   WHERE interview_id = p_interview_id;
  CALL sp_rec_get_interview(p_interview_id);
END $$
DROP PROCEDURE IF EXISTS sp_rec_update_candidate_parse_status $$
CREATE PROCEDURE `sp_rec_update_candidate_parse_status`(
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
DROP PROCEDURE IF EXISTS sp_rec_update_candidate_status $$
CREATE PROCEDURE `sp_rec_update_candidate_status`(
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
DROP PROCEDURE IF EXISTS sp_rec_update_job_request $$
CREATE PROCEDURE `sp_rec_update_job_request`(
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
DROP PROCEDURE IF EXISTS sp_rec_update_onboarding_task $$
CREATE PROCEDURE `sp_rec_update_onboarding_task`(
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
DROP PROCEDURE IF EXISTS sp_rec_upsert_match $$
CREATE PROCEDURE `sp_rec_upsert_match`(
  IN p_candidate_id   INT,
  IN p_job_req_id     INT,
  IN p_match_score    DECIMAL(5,2),
  IN p_skill_score    DECIMAL(5,2),
  IN p_exp_score      DECIMAL(5,2),
  IN p_matched_skills JSON,
  IN p_missing_skills JSON,
  IN p_recommendation VARCHAR(50)
)
BEGIN
  INSERT INTO rec_resume_matches
    (candidate_id, job_req_id, match_score, skill_score, exp_score,
     matched_skills, missing_skills, recommendation, computed_at)
  VALUES
    (p_candidate_id, p_job_req_id, p_match_score, p_skill_score, p_exp_score,
     p_matched_skills, p_missing_skills, p_recommendation, NOW())
  ON DUPLICATE KEY UPDATE
    match_score    = p_match_score,
    skill_score    = p_skill_score,
    exp_score      = p_exp_score,
    matched_skills = p_matched_skills,
    missing_skills = p_missing_skills,
    recommendation = p_recommendation,
    computed_at    = NOW();
  SELECT m.*, c.name AS candidate_name, j.title AS job_title
  FROM   rec_resume_matches m
  JOIN   rec_candidates   c ON c.candidate_id = m.candidate_id
  JOIN   rec_job_requests j ON j.job_req_id   = m.job_req_id
  WHERE  m.candidate_id = p_candidate_id AND m.job_req_id = p_job_req_id;
END $$
DROP PROCEDURE IF EXISTS sp_register_user $$
CREATE PROCEDURE `sp_register_user`(
  IN p_first_name VARCHAR(80), IN p_last_name VARCHAR(80), IN p_email VARCHAR(150),
  IN p_mobile VARCHAR(20), IN p_job_title VARCHAR(100), IN p_department_id INT,
  IN p_designation_id INT, IN p_password_hash VARCHAR(255), IN p_role_id INT,
  OUT p_employee_id INT, OUT p_emp_code VARCHAR(30)
)
BEGIN
  DECLARE v_emp_code VARCHAR(30);
  SET v_emp_code = CONCAT('EMP', LPAD(FLOOR(RAND() * 1000000), 6, '0'));
  START TRANSACTION;
  INSERT INTO employees (emp_code, first_name, last_name, email, mobile, emp_job_title,
    department_id, designation_id, employee_type, employee_status, emp_joining_date)
  VALUES (v_emp_code, p_first_name, p_last_name, p_email, p_mobile,
    IFNULL(p_job_title,'Employee'), p_department_id, p_designation_id,
    'Full-Time', 'Active', CURDATE());
  SET p_employee_id = LAST_INSERT_ID();
  SET p_emp_code    = v_emp_code;
  INSERT INTO users (email, password_hash, role_id, employee_id, status)
  VALUES (p_email, p_password_hash, IFNULL(p_role_id, 2), p_employee_id, 'Active');
  COMMIT;
END $$
DROP PROCEDURE IF EXISTS sp_remove_structure_line $$
CREATE PROCEDURE `sp_remove_structure_line`(IN p_structure_id INT, IN p_component_id INT)
BEGIN
  UPDATE salary_structure_lines SET is_active = 0
   WHERE structure_id = p_structure_id AND component_id = p_component_id;
END $$
DROP PROCEDURE IF EXISTS sp_remove_team_member $$
CREATE PROCEDURE `sp_remove_team_member`(IN p_team_id INT, IN p_employee_id INT)
BEGIN
  DECLARE v_cnt INT;
  SELECT COUNT(*) INTO v_cnt FROM team_members WHERE team_id=p_team_id AND employee_id=p_employee_id;
  IF v_cnt=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Team member not found'; END IF;
  DELETE FROM team_members WHERE team_id=p_team_id AND employee_id=p_employee_id;
  UPDATE teams SET lead_employee_id=NULL WHERE team_id=p_team_id AND lead_employee_id=p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_reopen_ticket $$
CREATE PROCEDURE `sp_reopen_ticket`(
  IN p_employee_id INT, IN p_ticket_id INT, IN p_comment TEXT,
  OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_emp INT; DECLARE v_status VARCHAR(30);
  SELECT employee_id, status INTO v_emp, v_status FROM helpdesk_tickets WHERE ticket_id=p_ticket_id LIMIT 1;
  IF v_emp IS NULL THEN SET p_ok=0; SET p_msg='Ticket not found';
  ELSEIF v_emp != p_employee_id THEN SET p_ok=0; SET p_msg='Not your ticket';
  ELSEIF v_status != 'Resolved' THEN SET p_ok=0; SET p_msg='Only Resolved tickets can be reopened';
  ELSE
    UPDATE helpdesk_tickets SET status='Reopened', resolved_at=NULL WHERE ticket_id=p_ticket_id;
    INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (p_ticket_id, p_employee_id, p_comment);
    SET p_ok=1; SET p_msg='OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_replace_it_declaration_items $$
CREATE PROCEDURE `sp_replace_it_declaration_items`(IN p_declaration_id INT)
BEGIN
  DELETE FROM it_declaration_items WHERE declaration_id = p_declaration_id;
END $$
DROP PROCEDURE IF EXISTS sp_report_emp_data $$
CREATE PROCEDURE `sp_report_emp_data`()
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reporting_manager_name,
         m.emp_code AS manager_emp_code,
         ci.current_address, ci.permanent_address,
         ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number AS bank_pan, bd.uan_number
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
   ORDER BY e.employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_report_leave_balance $$
CREATE PROCEDURE `sp_report_leave_balance`()
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         m.emp_code AS mgr_code,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS mgr_name,
         d.department_name,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Comp%' THEN lb.balance ELSE 0 END) AS comp_off,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Earned%' OR lt.leave_type_name = 'EL' THEN lb.balance ELSE 0 END) AS earned_leave,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Paternity%' THEN lb.balance ELSE 0 END) AS paternity,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Restricted%' OR lt.leave_type_name = 'RH' THEN lb.balance ELSE 0 END) AS restricted_holiday,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Sick%' OR lt.leave_type_name = 'SL' THEN lb.balance ELSE 0 END) AS sick_leave
    FROM leave_balances lb
    JOIN employees e ON e.employee_id = lb.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lb.leave_type_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE e.employee_status = 'Active'
     AND lb.year = YEAR(CURDATE())
   GROUP BY e.employee_id
   ORDER BY e.emp_code;
END $$
DROP PROCEDURE IF EXISTS sp_report_leave_summary_data $$
CREATE PROCEDURE `sp_report_leave_summary_data`(IN p_from DATE, IN p_to DATE)
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         e.employee_status, NULL AS date_of_confirmation, e.emp_joining_date, e.employee_id,
         d.department_name, ds.designation_name
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
   WHERE e.employee_status = 'Active'
   ORDER BY e.emp_code;
  SELECT leave_type_id, leave_type_name, NULL AS short_code FROM leave_types ORDER BY leave_type_id;
  SELECT lr.employee_id, lr.leave_type_id, IFNULL(SUM(lr.days), 0) AS days_availed
    FROM leave_requests lr
   WHERE lr.status = 'approved' AND lr.from_date >= p_from AND lr.to_date <= p_to
   GROUP BY lr.employee_id, lr.leave_type_id;
  SELECT lb.employee_id, lb.leave_type_id, lb.balance AS balance_days
    FROM leave_balances lb
   WHERE lb.year = YEAR(p_to);
END $$
DROP PROCEDURE IF EXISTS sp_report_payslips_for_month $$
CREATE PROCEDURE `sp_report_payslips_for_month`(IN p_month INT, IN p_year INT)
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         p.gross_earnings, p.basic
    FROM employees e
    LEFT JOIN payslips p ON p.employee_id = e.employee_id AND p.month = p_month AND p.year = p_year
   WHERE e.employee_status = 'Active'
   ORDER BY e.emp_code;
END $$
DROP PROCEDURE IF EXISTS sp_report_pf_statement $$
CREATE PROCEDURE `sp_report_pf_statement`(IN p_month INT, IN p_year INT)
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         e.emp_joining_date, e.emp_exit_date, e.pf_number, bd.uan_number,
         p.gross_earnings, p.basic, p.net_pay
    FROM employees e
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
    LEFT JOIN payslips p ON p.employee_id = e.employee_id AND p.month = p_month AND p.year = p_year
   WHERE e.employee_status = 'Active'
      OR (e.has_left_organization = 1 AND YEAR(e.emp_exit_date) = p_year AND MONTH(e.emp_exit_date) = p_month)
   ORDER BY e.emp_code;
END $$
DROP PROCEDURE IF EXISTS sp_reset_password $$
CREATE PROCEDURE `sp_reset_password`(IN p_token VARCHAR(64), IN p_new_hash VARCHAR(255), OUT p_ok TINYINT)
BEGIN
  DECLARE v_user_id INT; DECLARE v_expiry DATETIME;
  SELECT user_id, reset_token_expiry INTO v_user_id, v_expiry FROM users WHERE reset_token = p_token LIMIT 1;
  IF v_user_id IS NULL OR v_expiry < NOW() THEN SET p_ok = 0;
  ELSE
    UPDATE users SET password_hash = p_new_hash, reset_token = NULL, reset_token_expiry = NULL
     WHERE user_id = v_user_id;
    SET p_ok = 1;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_review_attendance_regularization $$
CREATE PROCEDURE `sp_review_attendance_regularization`(
  IN p_id INT,
  IN p_decision VARCHAR(20),
  IN p_reviewed_by INT,
  IN p_remarks TEXT
)
BEGIN
  DECLARE v_employee_id    INT;
  DECLARE v_date           DATE;
  DECLARE v_check_in       TIME;
  DECLARE v_check_out      TIME;
  DECLARE v_approved_count INT DEFAULT 0;
  DECLARE v_work_hours     DECIMAL(5,2) DEFAULT 4.00;  -- default 4-hour credit
  SELECT employee_id, attendance_date, requested_check_in, requested_check_out
    INTO v_employee_id, v_date, v_check_in, v_check_out
    FROM attendance_regularization
   WHERE regularization_id = p_id;
  -- ── 5-day monthly limit check ──────────────────────────────
  IF p_decision = 'Approved' THEN
    SELECT COUNT(*) INTO v_approved_count
    FROM attendance_regularization
    WHERE employee_id  = v_employee_id
      AND MONTH(attendance_date) = MONTH(v_date)
      AND YEAR(attendance_date)  = YEAR(v_date)
      AND status = 'Approved'
      AND regularization_id <> p_id;
    IF v_approved_count >= 5 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Regularization limit reached: maximum 5 approvals allowed per month';
    END IF;
  END IF;
  -- ── Update regularization record ───────────────────────────
  UPDATE attendance_regularization
     SET status      = p_decision,
         reviewed_by = p_reviewed_by,
         reviewed_on = NOW(),
         remarks     = p_remarks
   WHERE regularization_id = p_id;
  -- ── Apply to attendance on Approved ────────────────────────
  IF p_decision = 'Approved' THEN
    -- Calculate work hours: if both times given use them, else default to 4h credit
    IF v_check_in IS NOT NULL AND v_check_out IS NOT NULL THEN
      IF v_check_out > v_check_in THEN
        SET v_work_hours = ROUND(TIME_TO_SEC(TIMEDIFF(v_check_out, v_check_in)) / 3600, 2);
      ELSE
        -- overnight
        SET v_work_hours = ROUND((TIME_TO_SEC(v_check_out) + 86400 - TIME_TO_SEC(v_check_in)) / 3600, 2);
      END IF;
    ELSEIF v_check_in IS NULL AND v_check_out IS NULL THEN
      -- No times provided — grant flat 4-hour credit
      SET v_work_hours = 4.00;
    END IF;
    INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, work_hours, status, source)
    VALUES (v_employee_id, v_date, v_check_in, v_check_out, v_work_hours, 'present', 'regularization')
    ON DUPLICATE KEY UPDATE
      check_in   = IFNULL(v_check_in,  check_in),
      check_out  = IFNULL(v_check_out, check_out),
      work_hours = v_work_hours,
      status     = 'present',
      source     = 'regularization';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_review_extra_work $$
CREATE PROCEDURE `sp_review_extra_work`(
  IN p_extra_work_id INT, IN p_decision VARCHAR(20),
  IN p_reviewed_by INT, IN p_manager_notes TEXT,
  OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM extra_work_requests WHERE extra_work_id = p_extra_work_id LIMIT 1;
  IF v_status IS NULL THEN SET p_ok=0; SET p_msg='Extra work request not found';
  ELSEIF v_status != 'pending' THEN SET p_ok=0; SET p_msg='Already reviewed';
  ELSE
    UPDATE extra_work_requests
       SET status=IF(p_decision='approved','approved','rejected'),
           reviewed_by=p_reviewed_by, reviewed_at=NOW(), manager_notes=p_manager_notes
     WHERE extra_work_id=p_extra_work_id;
    SET p_ok=1; SET p_msg='OK';
  END IF;
  SELECT * FROM extra_work_requests WHERE extra_work_id=p_extra_work_id;
END $$
DROP PROCEDURE IF EXISTS sp_review_it_declaration $$
CREATE PROCEDURE `sp_review_it_declaration`(
  IN p_admin_id INT, IN p_declaration_id INT, IN p_status VARCHAR(30), IN p_remarks TEXT
)
BEGIN
  UPDATE it_declarations
     SET status=p_status, admin_remarks=p_remarks, reviewed_by=p_admin_id, reviewed_at=NOW()
   WHERE declaration_id=p_declaration_id;
  SELECT * FROM it_declarations WHERE declaration_id=p_declaration_id;
END $$
DROP PROCEDURE IF EXISTS sp_review_it_proof $$
CREATE PROCEDURE `sp_review_it_proof`(
  IN p_admin_id INT, IN p_proof_id INT, IN p_status VARCHAR(30), IN p_remarks TEXT
)
BEGIN
  UPDATE it_proof_documents
     SET status=p_status, admin_remarks=p_remarks, reviewed_by=p_admin_id, reviewed_at=NOW()
   WHERE proof_id=p_proof_id;
  SELECT * FROM it_proof_documents WHERE proof_id=p_proof_id;
END $$
DROP PROCEDURE IF EXISTS sp_review_leave_request $$
CREATE PROCEDURE `sp_review_leave_request`(
  IN p_id          INT,
  IN p_decision    VARCHAR(20),
  IN p_reviewed_by INT,
  IN p_remarks     TEXT
)
BEGIN
  DECLARE v_status VARCHAR(20); DECLARE v_emp_id INT;
  DECLARE v_leave_type INT; DECLARE v_days DECIMAL(5,2); DECLARE v_year INT; DECLARE v_from DATE;
  SELECT status, employee_id, leave_type_id, days, from_date
    INTO v_status, v_emp_id, v_leave_type, v_days, v_from
    FROM leave_requests WHERE leave_request_id = p_id LIMIT 1;
  IF v_status IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Leave request not found';
  ELSEIF v_status != 'Pending' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Pending leave requests can be reviewed';
  ELSEIF p_decision NOT IN ('Approved','Rejected') THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid decision';
  ELSE
    UPDATE leave_requests SET status=p_decision, reviewed_by=p_reviewed_by,
           remarks=p_remarks, reviewed_on=NOW() WHERE leave_request_id=p_id;
    SET v_year = YEAR(v_from);
    IF p_decision = 'Approved' THEN
      INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
      SELECT p_id, v_leave_type, v_year, 0, lt.annual_quota, 0, lt.annual_quota FROM leave_types lt WHERE lt.leave_type_id = v_leave_type
      ON DUPLICATE KEY UPDATE availed = availed + v_days, balance = GREATEST(0, balance - v_days);
    END IF;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_review_report $$
CREATE PROCEDURE `sp_review_report`(IN p_review_type_id INT, IN p_status VARCHAR(20))
BEGIN
  SELECT r.status, COUNT(*) AS total, AVG(r.overall_rating) AS avg_rating
    FROM reviews r
   WHERE (p_review_type_id IS NULL OR r.review_type_id=p_review_type_id)
     AND (p_status         IS NULL OR r.status=p_status)
   GROUP BY r.status;
  SELECT r.review_id, r.employee_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         rt.name AS review_type, r.status, r.overall_rating, r.due_date, r.submitted_on
    FROM reviews r
    JOIN employees e ON e.employee_id=r.employee_id
    JOIN review_types rt ON rt.review_type_id=r.review_type_id
   WHERE (p_review_type_id IS NULL OR r.review_type_id=p_review_type_id)
     AND (p_status         IS NULL OR r.status=p_status)
   ORDER BY r.due_date DESC LIMIT 500;
END $$
DROP PROCEDURE IF EXISTS sp_review_timesheet $$
CREATE PROCEDURE `sp_review_timesheet`(
    IN p_timesheet_id INT,
    IN p_decision VARCHAR(20),
    IN p_reviewed_by INT,
    IN p_comments TEXT,
    OUT p_ok TINYINT,
    OUT p_msg VARCHAR(200)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    SET p_ok = 0;
    SET p_msg = '';
    SELECT status
    INTO v_status
    FROM weekly_timesheets
    WHERE timesheet_id = p_timesheet_id
    LIMIT 1;
    IF v_status IS NULL THEN
        SET p_msg = 'Timesheet not found';
    ELSEIF LOWER(TRIM(p_decision)) NOT IN ('approved', 'rejected') THEN
        SET p_msg = 'Invalid decision. Use approved or rejected';
    ELSEIF LOWER(v_status) <> 'pending' THEN
        SET p_msg = 'Timesheet is not awaiting review';
    ELSE
        UPDATE weekly_timesheets
        SET
            status = LOWER(TRIM(p_decision)),
            reviewed_by = p_reviewed_by,
            reviewed_at = NOW(),
            comments = p_comments
        WHERE timesheet_id = p_timesheet_id;
        IF LOWER(TRIM(p_decision)) = 'approved' THEN
            UPDATE employee_tasks
            SET status = 'in_timesheet'
            WHERE task_id IN (
                SELECT DISTINCT task_id
                FROM timesheet_entries
                WHERE
                    timesheet_id = p_timesheet_id
                    AND task_id IS NOT NULL
            );
        END IF;
        SET p_ok = 1;
        SET p_msg = CONCAT(
            'Timesheet ',
            LOWER(TRIM(p_decision)),
            ' successfully'
        );
    END IF;
END $$
DROP PROCEDURE IF EXISTS sp_rollout_appraisal_cycle $$
CREATE PROCEDURE `sp_rollout_appraisal_cycle`(
  IN  p_admin_id    INT,
  IN  p_cycle_id    INT,
  IN  p_rollout_type VARCHAR(20),
  OUT p_ok          TINYINT,
  OUT p_msg         VARCHAR(200)
)
BEGIN
  DECLARE v_other_active INT DEFAULT 0;
  DECLARE v_status       VARCHAR(20);
  SELECT COUNT(*) INTO v_other_active FROM appraisal_cycles
   WHERE status = 'active' AND cycle_id != p_cycle_id;
  SELECT status INTO v_status FROM appraisal_cycles WHERE cycle_id = p_cycle_id LIMIT 1;
  IF v_other_active > 0 THEN SET p_ok=0; SET p_msg='Another cycle is already active. Disable it first.';
  ELSEIF v_status = 'active' THEN SET p_ok=0; SET p_msg='Cycle is already active';
  ELSE
    UPDATE appraisal_cycles
       SET status='active', rollout_type=p_rollout_type,
           rolled_out_at=NOW(), rolled_out_by=p_admin_id,
           disabled_at=NULL, disabled_by=NULL
     WHERE cycle_id=p_cycle_id;
    IF p_rollout_type = 'all' THEN
      INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by)
      SELECT p_cycle_id, employee_id, p_admin_id FROM employees WHERE employee_status = 'Active';
    END IF;
    SET p_ok=1; SET p_msg='OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_run_payroll $$
CREATE PROCEDURE `sp_run_payroll`(
  IN p_month       TINYINT,
  IN p_year        INT,
  IN p_processed_by INT,
  OUT p_payroll_run_id INT
)
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_employee_id INT;
  DECLARE v_payslip_id INT;
  DECLARE cur CURSOR FOR SELECT employee_id FROM employees WHERE employee_status = 'Active';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  INSERT INTO payroll_runs (month, year, status, processed_by, processed_on)
  VALUES (p_month, p_year, 'Processing', p_processed_by, NOW())
  ON DUPLICATE KEY UPDATE status = 'Processing', processed_by = p_processed_by, processed_on = NOW();
  SELECT payroll_run_id INTO p_payroll_run_id
  FROM payroll_runs WHERE month = p_month AND year = p_year;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_employee_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    CALL sp_generate_payslip(v_employee_id, p_month, p_year, p_payroll_run_id, v_payslip_id);
  END LOOP;
  CLOSE cur;
  UPDATE payroll_runs pr
  SET status = 'Completed',
      total_amount = (SELECT IFNULL(SUM(net_pay),0) FROM payslips WHERE payroll_run_id = p_payroll_run_id)
  WHERE pr.payroll_run_id = p_payroll_run_id;
END $$
DROP PROCEDURE IF EXISTS sp_save_appraisal_rating $$
CREATE PROCEDURE `sp_save_appraisal_rating`(
  IN p_appraisal_id   INT,
  IN p_parameter_key  VARCHAR(50),
  IN p_parameter_label VARCHAR(100),
  IN p_self_rating    TINYINT,
  IN p_self_comments  TEXT
)
BEGIN
  INSERT INTO appraisal_ratings (appraisal_id, parameter_key, parameter_label, self_rating, self_comments)
  VALUES (p_appraisal_id, p_parameter_key, p_parameter_label, p_self_rating, p_self_comments)
  ON DUPLICATE KEY UPDATE
    self_rating    = p_self_rating,
    self_comments  = p_self_comments,
    parameter_label = COALESCE(p_parameter_label, parameter_label);
END $$
DROP PROCEDURE IF EXISTS sp_save_manager_appraisal_rating $$
CREATE PROCEDURE `sp_save_manager_appraisal_rating`(
  IN p_appraisal_id  INT,
  IN p_parameter_key VARCHAR(50),
  IN p_mgr_rating    TINYINT,
  IN p_mgr_comments  TEXT
)
BEGIN
  UPDATE appraisal_ratings
     SET manager_rating = p_mgr_rating, manager_comments = p_mgr_comments
   WHERE appraisal_id = p_appraisal_id AND parameter_key = p_parameter_key;
END $$
DROP PROCEDURE IF EXISTS sp_save_structure_lines $$
CREATE PROCEDURE `sp_save_structure_lines`(
  IN p_structure_id  INT,
  IN p_component_id  INT,
  IN p_calc_override VARCHAR(20),
  IN p_pct_override  DECIMAL(8,4),
  IN p_pct_of_override VARCHAR(30),
  IN p_formula_override TEXT,
  IN p_fixed_amount  DECIMAL(12,2),
  IN p_sort_order    INT
)
BEGIN
  INSERT INTO salary_structure_lines
    (structure_id, component_id, calc_type_override, percentage_override,
     percentage_of_override, formula_override, fixed_amount, sort_order)
  VALUES
    (p_structure_id, p_component_id, p_calc_override, p_pct_override,
     p_pct_of_override, p_formula_override, p_fixed_amount, p_sort_order)
  ON DUPLICATE KEY UPDATE
    calc_type_override     = p_calc_override,
    percentage_override    = p_pct_override,
    percentage_of_override = p_pct_of_override,
    formula_override       = p_formula_override,
    fixed_amount           = p_fixed_amount,
    sort_order             = p_sort_order,
    is_active              = 1;
END $$
DROP PROCEDURE IF EXISTS sp_save_timesheet_entries $$
CREATE PROCEDURE `sp_save_timesheet_entries`(
  IN p_employee_id INT, IN p_week_start DATE, IN p_week_end DATE,
  IN p_entries JSON,
  OUT p_timesheet_id INT, OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
main_block: BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT timesheet_id, status INTO p_timesheet_id, v_status
    FROM weekly_timesheets
   WHERE employee_id=p_employee_id AND week_start=p_week_start LIMIT 1;
  IF p_timesheet_id IS NULL THEN
    INSERT INTO weekly_timesheets (employee_id, week_start, week_end, status)
    VALUES (p_employee_id, p_week_start, p_week_end, 'draft');
    SET p_timesheet_id = LAST_INSERT_ID();
    SET v_status = 'draft';
  END IF;
  IF v_status NOT IN ('draft','rejected') THEN
    SET p_ok=0;
    SET p_msg=CONCAT('Cannot edit a timesheet with status: ', v_status);
    LEAVE main_block;
  END IF;
  UPDATE employee_tasks et
     JOIN timesheet_entries te ON te.task_id=et.task_id
    SET et.status='open'
  WHERE te.timesheet_id=p_timesheet_id AND te.task_id IS NOT NULL AND et.status='in_timesheet';
  DELETE FROM timesheet_entries WHERE timesheet_id=p_timesheet_id;
  INSERT INTO timesheet_entries
    (timesheet_id, employee_id, task_id, project_name, task_name,
     activity_desc, work_date, start_time, end_time, duration_hours)
  SELECT p_timesheet_id, p_employee_id,
         j.task_id, IFNULL(j.project_name,''), IFNULL(j.task_name,''),
         IFNULL(j.activity_desc,''), j.work_date, j.start_time, j.end_time,
         IFNULL(j.duration_hours, 0)
    FROM JSON_TABLE(p_entries, '$[*]' COLUMNS(
      task_id       INT            PATH '$.task_id',
      project_name  VARCHAR(200)   PATH '$.project_name',
      task_name     VARCHAR(200)   PATH '$.task_name',
      activity_desc TEXT           PATH '$.activity_desc',
      work_date     DATE           PATH '$.work_date',
      start_time    TIME           PATH '$.start_time',
      end_time      TIME           PATH '$.end_time',
      duration_hours DECIMAL(5,2)  PATH '$.duration_hours'
    )) j;
  UPDATE employee_tasks et
     JOIN timesheet_entries te ON te.task_id=et.task_id
    SET et.status='in_timesheet'
  WHERE te.timesheet_id=p_timesheet_id AND te.task_id IS NOT NULL AND et.employee_id=p_employee_id;
  UPDATE weekly_timesheets
     SET total_hours=(SELECT COALESCE(SUM(duration_hours),0) FROM timesheet_entries WHERE timesheet_id=p_timesheet_id)
   WHERE timesheet_id=p_timesheet_id;
  SET p_ok=1; SET p_msg='OK';
END $$
DROP PROCEDURE IF EXISTS sp_search_employees_org $$
CREATE PROCEDURE `sp_search_employees_org`(
    IN p_q VARCHAR(200),
    IN p_department_id INT,
    IN p_designation_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    SET p_q = IFNULL(p_q, '%');
    SELECT
        e.employee_id,
        e.emp_code,
        e.first_name,
        e.last_name,
        e.email,
        e.employee_status,
        e.reporting_to,
        e.emp_joining_date,
        e.employee_type,
        d.designation_name,
        dp.department_name,
        dp.department_id,
        CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d
        ON d.designation_id = e.designation_id
    LEFT JOIN departments dp
        ON dp.department_id = e.department_id
    WHERE
    (
           e.first_name COLLATE utf8mb4_unicode_ci LIKE (p_q COLLATE utf8mb4_unicode_ci)
        OR e.last_name COLLATE utf8mb4_unicode_ci LIKE (p_q COLLATE utf8mb4_unicode_ci)
        OR e.emp_code COLLATE utf8mb4_unicode_ci LIKE (p_q COLLATE utf8mb4_unicode_ci)
        OR e.email COLLATE utf8mb4_unicode_ci LIKE (p_q COLLATE utf8mb4_unicode_ci)
        OR CONCAT(e.first_name,' ',IFNULL(e.last_name,''))
              COLLATE utf8mb4_unicode_ci
              LIKE (p_q COLLATE utf8mb4_unicode_ci)
    )
    AND (
        p_department_id IS NULL
        OR e.department_id = p_department_id
    )
    AND (
        p_designation_id IS NULL
        OR e.designation_id = p_designation_id
    )
    AND (
        p_status IS NULL
        OR e.employee_status COLLATE utf8mb4_unicode_ci =
           p_status COLLATE utf8mb4_unicode_ci
    )
    ORDER BY e.first_name
    LIMIT 30;
    SELECT
        employee_id,
        reporting_to,
        CONCAT(first_name,' ',IFNULL(last_name,'')) AS full_name
    FROM employees;
END $$
DROP PROCEDURE IF EXISTS sp_setup_mfa_secret $$
CREATE PROCEDURE `sp_setup_mfa_secret`(IN p_user_id INT, IN p_encrypted_secret VARCHAR(500))
BEGIN
  UPDATE users SET mfa_secret = p_encrypted_secret WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_set_reset_token $$
CREATE PROCEDURE `sp_set_reset_token`(IN p_email VARCHAR(150), IN p_token VARCHAR(64), IN p_expiry DATETIME)
BEGIN
  UPDATE users SET reset_token = p_token, reset_token_expiry = p_expiry WHERE email = p_email;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_submit_appraisal $$
CREATE PROCEDURE `sp_submit_appraisal`(IN p_appraisal_id INT, IN p_overall_comments TEXT)
BEGIN
  UPDATE self_appraisals
     SET overall_comments = p_overall_comments, status = 'submitted', submitted_at = NOW()
   WHERE appraisal_id = p_appraisal_id;
END $$
DROP PROCEDURE IF EXISTS sp_submit_resignation $$
CREATE PROCEDURE `sp_submit_resignation`(
  IN  p_employee_id    INT,
  IN  p_reason         TEXT,
  IN  p_start_date     DATE,
  IN  p_end_date       DATE,
  IN  p_tentative_lwd  DATE,
  IN  p_shortfall_days INT,
  IN  p_notice_period  INT,
  IN  p_alt_email      VARCHAR(150),
  IN  p_alt_mobile     VARCHAR(20),
  IN  p_remarks        TEXT,
  IN  p_attach_name    VARCHAR(255),
  IN  p_attach_path    VARCHAR(255),
  OUT p_resignation_id INT,
  OUT p_msg            VARCHAR(200)
)
BEGIN
  DECLARE v_existing INT DEFAULT NULL;
  SELECT resignation_id INTO v_existing
    FROM resignations
   WHERE employee_id = p_employee_id AND status IN ('pending','rm_approved','accepted') LIMIT 1;
  IF v_existing IS NOT NULL THEN
    SET p_resignation_id = NULL;
    SET p_msg = 'You already have an active resignation request';
  ELSE
    INSERT INTO resignations (employee_id, start_date, end_date, tentative_lwd, shortfall_days,
      notice_period, reason, alternate_email, alternate_mobile, remarks, attachment_name, attachment_path)
    VALUES (p_employee_id, p_start_date, p_end_date, p_tentative_lwd, p_shortfall_days,
      p_notice_period, p_reason, p_alt_email, p_alt_mobile, p_remarks, p_attach_name, p_attach_path);
    SET p_resignation_id = LAST_INSERT_ID();
    SET p_msg = 'OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_submit_review $$
CREATE PROCEDURE `sp_submit_review`(IN p_review_id INT, IN p_overall_rating TINYINT, IN p_comments TEXT)
BEGIN
  UPDATE reviews SET overall_rating = p_overall_rating, comments = p_comments,
         status = 'Submitted', submitted_on = NOW()
   WHERE review_id = p_review_id;
END $$
DROP PROCEDURE IF EXISTS sp_submit_timesheet $$
CREATE PROCEDURE `sp_submit_timesheet`(
  IN p_employee_id INT, IN p_timesheet_id INT, OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM weekly_timesheets
   WHERE timesheet_id=p_timesheet_id AND employee_id=p_employee_id LIMIT 1;
  IF v_status IS NULL THEN SET p_ok=0; SET p_msg='Timesheet not found';
  ELSEIF v_status NOT IN ('draft','rejected') THEN SET p_ok=0; SET p_msg=CONCAT('Cannot submit a timesheet with status: ',v_status);
  ELSE
    UPDATE weekly_timesheets SET status='pending', submitted_at=NOW() WHERE timesheet_id=p_timesheet_id;
    SET p_ok=1; SET p_msg='OK';
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_team_leave_calendar $$
CREATE PROCEDURE `sp_team_leave_calendar`(
  IN p_year  INT,
  IN p_month TINYINT
)
BEGIN
  SELECT
    d.day_date,
    COUNT(lr.leave_request_id) AS employees_on_leave
  FROM (
    SELECT DATE_ADD(STR_TO_DATE(CONCAT(p_year,'-',p_month,'-01'),'%Y-%m-%d'), INTERVAL (n - 1) DAY) AS day_date
    FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY a1.n) AS n
      FROM (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
            UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) a1
      CROSS JOIN (SELECT 1 n2 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) a2
    ) seq
    WHERE n <= DAY(LAST_DAY(STR_TO_DATE(CONCAT(p_year,'-',p_month,'-01'),'%Y-%m-%d')))
  ) d
  LEFT JOIN leave_requests lr
    ON lr.status = 'Approved'
    AND d.day_date BETWEEN lr.from_date AND lr.to_date
  GROUP BY d.day_date
  ORDER BY d.day_date;
END $$
DROP PROCEDURE IF EXISTS sp_toggle_it_cycle_status $$
CREATE PROCEDURE `sp_toggle_it_cycle_status`(IN p_cycle_id INT, IN p_admin_id INT)
BEGIN
  DECLARE v_current VARCHAR(20);
  DECLARE v_new VARCHAR(20);
  SELECT status INTO v_current FROM it_declaration_cycles WHERE cycle_id = p_cycle_id LIMIT 1;
  IF v_current IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cycle not found'; END IF;
  SET v_new = IF(v_current='active','inactive','active');
  UPDATE it_declaration_cycles SET status='inactive';
  UPDATE it_declaration_cycles SET status=v_new, created_by=p_admin_id WHERE cycle_id=p_cycle_id;
  SELECT * FROM it_declaration_cycles WHERE cycle_id=p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_toggle_salary_component $$
CREATE PROCEDURE `sp_toggle_salary_component`(IN p_id INT, IN p_active TINYINT(1))
BEGIN
  UPDATE salary_components SET is_active = p_active WHERE component_id = p_id AND is_system = 0;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_transfer_manager_team $$
CREATE PROCEDURE `sp_transfer_manager_team`(
  IN p_old_manager_id INT, IN p_new_manager_id INT, IN p_changed_by INT, IN p_reason TEXT
)
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_emp_id INT;
  DECLARE cur CURSOR FOR
    SELECT employee_id FROM employees
     WHERE reporting_to=p_old_manager_id AND employee_status != 'Terminated';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done=1;
  OPEN cur;
  loop1: LOOP
    FETCH cur INTO v_emp_id;
    IF done THEN LEAVE loop1; END IF;
    UPDATE employees SET reporting_to=p_new_manager_id WHERE employee_id=v_emp_id;
    INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
    VALUES (v_emp_id, p_old_manager_id, p_new_manager_id, p_changed_by, p_reason, 'transfer');
  END LOOP;
  CLOSE cur;
  SELECT ROW_COUNT() AS transferred;
END $$
DROP PROCEDURE IF EXISTS sp_unenroll_employee_appraisal $$
CREATE PROCEDURE `sp_unenroll_employee_appraisal`(IN p_cycle_id INT, IN p_employee_id INT)
BEGIN
  DELETE FROM appraisal_enrollments WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id;
  SELECT ROW_COUNT() AS affected;
END $$
DROP PROCEDURE IF EXISTS sp_update_appraisal_cycle $$
CREATE PROCEDURE `sp_update_appraisal_cycle`(
  IN p_cycle_id INT, IN p_fy_label VARCHAR(50), IN p_deadline DATE, IN p_cycle_type VARCHAR(30)
)
BEGIN
  UPDATE appraisal_cycles
     SET fy_label   = COALESCE(p_fy_label,    fy_label),
         deadline   = COALESCE(p_deadline,     deadline),
         cycle_type = COALESCE(p_cycle_type,   cycle_type)
   WHERE cycle_id = p_cycle_id;
  SELECT * FROM appraisal_cycles WHERE cycle_id = p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_appraisal_status $$
CREATE PROCEDURE `sp_update_appraisal_status`(IN p_appraisal_id INT, IN p_status VARCHAR(20))
BEGIN
  UPDATE self_appraisals SET status = p_status WHERE appraisal_id = p_appraisal_id;
  SELECT sa.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM self_appraisals sa
    JOIN employees e ON e.employee_id = sa.employee_id
   WHERE sa.appraisal_id = p_appraisal_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_designation $$
CREATE PROCEDURE `sp_update_designation`(
  IN p_id INT, IN p_name VARCHAR(200), IN p_department_id INT
)
BEGIN
  UPDATE designations
     SET designation_name = COALESCE(p_name, designation_name),
         department_id    = COALESCE(p_department_id, department_id)
   WHERE designation_id = p_id;
  SELECT * FROM designations WHERE designation_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_employee_reporting_to $$
CREATE PROCEDURE `sp_update_employee_reporting_to`(
  IN p_employee_id INT, IN p_reporting_to INT
)
BEGIN
  UPDATE employees SET reporting_to = p_reporting_to WHERE employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_holiday $$
CREATE PROCEDURE `sp_update_holiday`(
  IN p_holiday_id       INT,
  IN p_holiday_name     VARCHAR(100),
  IN p_holiday_date     DATE,
  IN p_holiday_calendar VARCHAR(100),
  IN p_shift            ENUM('general','mid','night'),
  IN p_location         VARCHAR(100),
  IN p_is_restricted    TINYINT(1)
)
BEGIN
  UPDATE holidays
     SET holiday_name     = IFNULL(p_holiday_name,     holiday_name),
         holiday_date     = IFNULL(p_holiday_date,     holiday_date),
         holiday_calendar = IFNULL(p_holiday_calendar, holiday_calendar),
         shift            = IFNULL(p_shift,            shift),
         location         = NULLIF(p_location, ''),
         is_restricted    = IFNULL(p_is_restricted,    is_restricted)
   WHERE holiday_id = p_holiday_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_it_cycle $$
CREATE PROCEDURE `sp_update_it_cycle`(
  IN p_cycle_id INT, IN p_fy_label VARCHAR(20), IN p_start_date DATE, IN p_end_date DATE
)
BEGIN
  UPDATE it_declaration_cycles
     SET fy_label   = COALESCE(p_fy_label,   fy_label),
         start_date = COALESCE(p_start_date, start_date),
         end_date   = COALESCE(p_end_date,   end_date)
   WHERE cycle_id = p_cycle_id;
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_it_declaration_status $$
CREATE PROCEDURE `sp_update_it_declaration_status`(
  IN p_declaration_id INT, IN p_status VARCHAR(30),
  IN p_total DECIMAL(12,2), IN p_submitted_at DATETIME
)
BEGIN
  UPDATE it_declarations
     SET status=p_status, total_declared=p_total,
         submitted_at=p_submitted_at, admin_remarks=NULL
   WHERE declaration_id=p_declaration_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_job_application_status $$
CREATE PROCEDURE `sp_update_job_application_status`(IN p_id INT, IN p_status VARCHAR(30))
BEGIN
  UPDATE job_applications SET status=p_status WHERE application_id=p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_mfa_backup_codes $$
CREATE PROCEDURE `sp_update_mfa_backup_codes`(IN p_user_id INT, IN p_backup_codes_json TEXT)
BEGIN
  UPDATE users SET mfa_backup_codes = p_backup_codes_json WHERE user_id = p_user_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_payslip_encrypted $$
CREATE PROCEDURE `sp_update_payslip_encrypted`(IN p_id INT, IN p_encrypted BLOB)
BEGIN
  UPDATE payslips SET
    salary_encrypted = p_encrypted,
    basic = NULL, hra = NULL, allowances = NULL,
    gross_earnings = NULL, ctc = NULL,
    deductions = NULL, net_pay = NULL
  WHERE payslip_id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_referral_status $$
CREATE PROCEDURE `sp_update_referral_status`(IN p_id INT, IN p_status VARCHAR(30))
BEGIN
  UPDATE referrals SET status=p_status WHERE referral_id=p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_request_hub_status $$
CREATE PROCEDURE `sp_update_request_hub_status`(IN p_id INT, IN p_status VARCHAR(20), IN p_reviewed_by INT)
BEGIN
  UPDATE request_hub
     SET status=p_status, reviewed_by=p_reviewed_by,
         resolved_at=IF(p_status='Pending', NULL, NOW())
   WHERE request_id=p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_salary_encrypted $$
CREATE PROCEDURE `sp_update_salary_encrypted`(IN p_id INT, IN p_encrypted_blob TEXT)
BEGIN
  UPDATE salary_structures SET
    salary_encrypted  = p_encrypted_blob,
    basic             = NULL, hra              = NULL, conveyance      = NULL,
    medical_allowance = NULL, special_allowance = NULL,
    pf_employee       = NULL, pf_employer      = NULL,
    professional_tax  = NULL, income_tax       = NULL, ctc             = NULL
  WHERE id = p_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_salary_template $$
CREATE PROCEDURE `sp_update_salary_template`(
  IN p_id              INT,
  IN p_name            VARCHAR(100),
  IN p_description     VARCHAR(255),
  IN p_basic_pct       DECIMAL(5,2),
  IN p_hra_pct         DECIMAL(5,2),
  IN p_variable_pct    DECIMAL(5,2),
  IN p_telephone       DECIMAL(10,2),
  IN p_lta_annual      DECIMAL(10,2),
  IN p_pf_applicable   TINYINT(1),
  IN p_pf_cap          TINYINT(1),
  IN p_gratuity        TINYINT(1),
  IN p_bonus           TINYINT(1),
  IN p_insurance       DECIMAL(10,2),
  IN p_other           DECIMAL(10,2),
  IN p_pt              DECIMAL(10,2),
  IN p_is_default      TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_templates SET is_default = 0 WHERE template_id != p_id;
  END IF;
  UPDATE salary_templates SET
    template_name       = p_name,
    description         = p_description,
    basic_pct           = p_basic_pct,
    hra_pct             = p_hra_pct,
    variable_pct        = p_variable_pct,
    telephone_monthly   = p_telephone,
    lta_annual          = p_lta_annual,
    pf_applicable       = p_pf_applicable,
    pf_cap              = p_pf_cap,
    gratuity_applicable = p_gratuity,
    bonus_applicable    = p_bonus,
    insurance_cost      = p_insurance,
    other_allowances    = p_other,
    professional_tax    = p_pt,
    is_default          = p_is_default
  WHERE template_id = p_id;
  SELECT ROW_COUNT() AS updated;
END $$
DROP PROCEDURE IF EXISTS sp_update_task $$
CREATE PROCEDURE `sp_update_task`(
  IN p_task_id INT, IN p_employee_id INT,
  IN p_task_name VARCHAR(200), IN p_project_name VARCHAR(200),
  IN p_description TEXT, IN p_status VARCHAR(30),
  IN p_start_date DATE, IN p_end_date DATE,
  IN p_start_time TIME, IN p_end_time TIME,
  IN p_duration_hours DECIMAL(5,2)
)
BEGIN
  UPDATE employee_tasks SET
    task_name        = COALESCE(p_task_name,       task_name),
    project_name     = COALESCE(p_project_name,    project_name),
    description      = COALESCE(p_description,     description),
    status           = COALESCE(p_status,          status),
    start_date       = COALESCE(p_start_date,      start_date),
    end_date         = COALESCE(p_end_date,        end_date),
    start_time       = COALESCE(p_start_time,      start_time),
    end_time         = COALESCE(p_end_time,        end_time),
    duration_hours   = COALESCE(p_duration_hours,  duration_hours)
  WHERE task_id = p_task_id AND employee_id = p_employee_id;
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END $$
DROP PROCEDURE IF EXISTS sp_update_team_member $$
CREATE PROCEDURE `sp_update_team_member`(
  IN p_team_id INT, IN p_employee_id INT, IN p_title VARCHAR(100), IN p_is_lead TINYINT
)
BEGIN
  DECLARE v_cnt INT;
  SELECT COUNT(*) INTO v_cnt FROM team_members WHERE team_id=p_team_id AND employee_id=p_employee_id;
  IF v_cnt = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Team member not found'; END IF;
  IF p_title IS NOT NULL THEN
    UPDATE team_members SET title=p_title WHERE team_id=p_team_id AND employee_id=p_employee_id;
  END IF;
  IF p_is_lead IS NOT NULL THEN
    UPDATE team_members SET is_lead=p_is_lead WHERE team_id=p_team_id AND employee_id=p_employee_id;
  END IF;
  IF p_is_lead = 1 THEN
    UPDATE teams SET lead_employee_id=p_employee_id WHERE team_id=p_team_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_update_ticket_status $$
CREATE PROCEDURE `sp_update_ticket_status`(IN p_ticket_id INT, IN p_status VARCHAR(30))
BEGIN
  IF p_status IN ('Resolved','Closed','Rejected') THEN
    UPDATE helpdesk_tickets SET status = p_status, resolved_at = NOW() WHERE ticket_id = p_ticket_id;
  ELSE
    UPDATE helpdesk_tickets SET status = p_status, resolved_at = NULL WHERE ticket_id = p_ticket_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_upload_it_proof $$
CREATE PROCEDURE `sp_upload_it_proof`(
  IN p_declaration_id INT, IN p_employee_id INT,
  IN p_investment_type VARCHAR(100), IN p_section_key VARCHAR(100),
  IN p_declared_amount DECIMAL(12,2), IN p_actual_amount DECIMAL(12,2),
  IN p_file_name VARCHAR(255), IN p_file_path VARCHAR(255),
  OUT p_proof_id INT
)
BEGIN
  INSERT INTO it_proof_documents
    (declaration_id, employee_id, investment_type, section_key, declared_amount, actual_amount, file_name, file_path)
  VALUES (p_declaration_id, p_employee_id, p_investment_type, p_section_key,
          p_declared_amount, p_actual_amount, p_file_name, p_file_path);
  SET p_proof_id = LAST_INSERT_ID();
  SELECT * FROM it_proof_documents WHERE proof_id = p_proof_id;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_bank_details $$
CREATE PROCEDURE `sp_upsert_bank_details`(
  IN p_employee_id INT, IN p_bank_name VARCHAR(100), IN p_account_number VARCHAR(50),
  IN p_ifsc_code VARCHAR(20), IN p_pan_number VARCHAR(20), IN p_uan_number VARCHAR(30),
  IN p_account_type VARCHAR(30), IN p_bank_branch VARCHAR(100),
  IN p_dd_payable_at VARCHAR(100), IN p_account_holder VARCHAR(100), IN p_payment_type VARCHAR(30)
)
BEGIN
  INSERT INTO employee_bank_details (
    employee_id, bank_name, account_number, ifsc_code, pan_number, uan_number,
    account_type, bank_branch, dd_payable_at, account_holder_name, payment_type
  ) VALUES (
    p_employee_id, p_bank_name, p_account_number, p_ifsc_code, p_pan_number, p_uan_number,
    p_account_type, p_bank_branch, p_dd_payable_at, p_account_holder, p_payment_type
  )
  ON DUPLICATE KEY UPDATE
    bank_name           = COALESCE(p_bank_name,        bank_name),
    account_number      = COALESCE(p_account_number,   account_number),
    ifsc_code           = COALESCE(p_ifsc_code,        ifsc_code),
    pan_number          = COALESCE(p_pan_number,       pan_number),
    uan_number          = COALESCE(p_uan_number,       uan_number),
    account_type        = COALESCE(p_account_type,     account_type),
    bank_branch         = COALESCE(p_bank_branch,      bank_branch),
    dd_payable_at       = COALESCE(p_dd_payable_at,    dd_payable_at),
    account_holder_name = COALESCE(p_account_holder,   account_holder_name),
    payment_type        = COALESCE(p_payment_type,     payment_type);
  SELECT * FROM employee_bank_details WHERE employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_contact_info $$
CREATE PROCEDURE `sp_upsert_contact_info`(
  IN p_employee_id INT, IN p_current_address TEXT, IN p_permanent_address TEXT,
  IN p_personal_email VARCHAR(150), IN p_alternate_mobile VARCHAR(20),
  IN p_emergency_contact_name VARCHAR(100), IN p_emergency_contact_relation VARCHAR(50),
  IN p_emergency_contact_phone VARCHAR(20), IN p_contact_name VARCHAR(100),
  IN p_contact_city VARCHAR(100), IN p_contact_country VARCHAR(100),
  IN p_permanent_address_line1 VARCHAR(255), IN p_permanent_address_line2 VARCHAR(255),
  IN p_permanent_address_line3 VARCHAR(255)
)
BEGIN
  INSERT INTO employee_contact_info (
    employee_id, current_address, permanent_address, personal_email, alternate_mobile,
    emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
    contact_name, contact_city, contact_country,
    permanent_address_line1, permanent_address_line2, permanent_address_line3
  ) VALUES (
    p_employee_id, p_current_address, p_permanent_address, p_personal_email, p_alternate_mobile,
    p_emergency_contact_name, p_emergency_contact_relation, p_emergency_contact_phone,
    p_contact_name, p_contact_city, p_contact_country,
    p_permanent_address_line1, p_permanent_address_line2, p_permanent_address_line3
  )
  ON DUPLICATE KEY UPDATE
    current_address            = COALESCE(p_current_address,            current_address),
    permanent_address          = COALESCE(p_permanent_address,          permanent_address),
    personal_email             = COALESCE(p_personal_email,             personal_email),
    alternate_mobile           = COALESCE(p_alternate_mobile,           alternate_mobile),
    emergency_contact_name     = COALESCE(p_emergency_contact_name,     emergency_contact_name),
    emergency_contact_relation = COALESCE(p_emergency_contact_relation, emergency_contact_relation),
    emergency_contact_phone    = COALESCE(p_emergency_contact_phone,    emergency_contact_phone),
    contact_name               = COALESCE(p_contact_name,               contact_name),
    contact_city               = COALESCE(p_contact_city,               contact_city),
    contact_country            = COALESCE(p_contact_country,            contact_country),
    permanent_address_line1    = COALESCE(p_permanent_address_line1,    permanent_address_line1),
    permanent_address_line2    = COALESCE(p_permanent_address_line2,    permanent_address_line2),
    permanent_address_line3    = COALESCE(p_permanent_address_line3,    permanent_address_line3);
  SELECT * FROM employee_contact_info WHERE employee_id = p_employee_id;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_leave_balance $$
CREATE PROCEDURE `sp_upsert_leave_balance`(
  IN p_employee_id INT, IN p_leave_type_id INT, IN p_year INT,
  IN p_opening DECIMAL(6,2), IN p_granted DECIMAL(6,2), IN p_availed DECIMAL(6,2)
)
BEGIN
  DECLARE v_bal DECIMAL(6,2);
  SET v_bal = GREATEST(0, p_opening + p_granted - p_availed);
  INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
  VALUES (p_employee_id, p_leave_type_id, p_year, p_opening, p_granted, p_availed, v_bal)
  ON DUPLICATE KEY UPDATE
    opening_balance = p_opening, granted = p_granted, availed = p_availed,
    balance = v_bal;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_role_permission $$
CREATE PROCEDURE `sp_upsert_role_permission`(
  IN p_role_id INT, IN p_module VARCHAR(50), IN p_action VARCHAR(50), IN p_allowed TINYINT
)
BEGIN
  INSERT INTO role_permissions (role_id, permission_id, allowed)
  SELECT p_role_id, permission_id, p_allowed FROM permissions WHERE module = p_module AND action = p_action
  ON DUPLICATE KEY UPDATE allowed = p_allowed;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_salary_component $$
CREATE PROCEDURE `sp_upsert_salary_component`(
  IN p_id               INT,
  IN p_name             VARCHAR(100),
  IN p_code             VARCHAR(30),
  IN p_category         VARCHAR(30),
  IN p_calc_type        VARCHAR(20),
  IN p_pct_value        DECIMAL(8,4),
  IN p_pct_of           VARCHAR(30),
  IN p_formula          TEXT,
  IN p_frequency        VARCHAR(20),
  IN p_taxable          TINYINT(1),
  IN p_pf               TINYINT(1),
  IN p_esi              TINYINT(1),
  IN p_gratuity         TINYINT(1),
  IN p_show_offer       TINYINT(1),
  IN p_show_ctc         TINYINT(1),
  IN p_show_payslip     TINYINT(1),
  IN p_sort_order       INT,
  IN p_description      VARCHAR(255)
)
BEGIN
  IF p_id IS NULL OR p_id = 0 THEN
    INSERT INTO salary_components (
      component_name, component_code, category, calc_type,
      percentage_value, percentage_of, formula_expr, frequency,
      is_taxable, pf_applicable, esi_applicable, gratuity_applicable,
      show_offer_letter, show_ctc_breakup, show_payslip,
      sort_order, description
    ) VALUES (
      p_name, p_code, p_category, p_calc_type,
      p_pct_value, p_pct_of, p_formula, p_frequency,
      p_taxable, p_pf, p_esi, p_gratuity,
      p_show_offer, p_show_ctc, p_show_payslip,
      p_sort_order, p_description
    );
    SELECT LAST_INSERT_ID() AS component_id;
  ELSE
    UPDATE salary_components SET
      component_name    = p_name,
      component_code    = p_code,
      category          = p_category,
      calc_type         = p_calc_type,
      percentage_value  = p_pct_value,
      percentage_of     = p_pct_of,
      formula_expr      = p_formula,
      frequency         = p_frequency,
      is_taxable        = p_taxable,
      pf_applicable     = p_pf,
      esi_applicable    = p_esi,
      gratuity_applicable = p_gratuity,
      show_offer_letter = p_show_offer,
      show_ctc_breakup  = p_show_ctc,
      show_payslip      = p_show_payslip,
      sort_order        = p_sort_order,
      description       = p_description
    WHERE component_id = p_id;
    SELECT p_id AS component_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_salary_structure $$
CREATE PROCEDURE `sp_upsert_salary_structure`(
  IN p_id          INT,
  IN p_name        VARCHAR(100),
  IN p_description VARCHAR(255),
  IN p_is_default  TINYINT(1)
)
BEGIN
  IF p_is_default = 1 THEN
    UPDATE salary_structures SET is_default = 0;
  END IF;
  IF p_id IS NULL OR p_id = 0 THEN
    INSERT INTO salary_structures (structure_name, description, is_default)
    VALUES (p_name, p_description, p_is_default);
    SELECT LAST_INSERT_ID() AS structure_id;
  ELSE
    UPDATE salary_structures SET
      structure_name = p_name,
      description    = p_description,
      is_default     = p_is_default
    WHERE structure_id = p_id;
    SELECT p_id AS structure_id;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_upsert_work_schedule $$
CREATE PROCEDURE `sp_upsert_work_schedule`(
  IN p_employee_id     INT,
  IN p_admin_id        INT,
  IN p_schedule_type   VARCHAR(30),
  IN p_work_days       JSON,
  IN p_start_time      TIME,
  IN p_end_time        TIME,
  IN p_rotation_pattern VARCHAR(100)
)
BEGIN
  INSERT INTO employee_work_schedules
    (employee_id, schedule_type, work_days, start_time, end_time, rotation_pattern, updated_by)
  VALUES (p_employee_id, IFNULL(p_schedule_type,'fixed'), p_work_days,
          p_start_time, p_end_time, p_rotation_pattern, p_admin_id)
  ON DUPLICATE KEY UPDATE
    schedule_type    = IFNULL(p_schedule_type,'fixed'),
    work_days        = p_work_days,
    start_time       = p_start_time,
    end_time         = p_end_time,
    rotation_pattern = p_rotation_pattern,
    updated_by       = p_admin_id,
    updated_at       = NOW();
END $$
DROP PROCEDURE IF EXISTS sp_verify_mfa_token $$
CREATE PROCEDURE `sp_verify_mfa_token`(IN p_token VARCHAR(64), OUT p_user_id INT)
BEGIN
  DECLARE v_id INT; DECLARE v_used TINYINT; DECLARE v_exp DATETIME;
  SELECT id, user_id, used, expires_at INTO v_id, p_user_id, v_used, v_exp
    FROM mfa_temp_tokens WHERE token = p_token LIMIT 1;
  IF p_user_id IS NULL OR v_used = 1 OR v_exp < NOW() THEN SET p_user_id = NULL;
  ELSE UPDATE mfa_temp_tokens SET used = 1 WHERE id = v_id;
  END IF;
  SELECT p_user_id AS user_id;
END $$
DROP PROCEDURE IF EXISTS sp_verify_reset_token $$
CREATE PROCEDURE `sp_verify_reset_token`(IN p_token VARCHAR(64), IN p_new_hash VARCHAR(255), OUT p_ok TINYINT)
BEGIN
  DECLARE v_user_id INT DEFAULT NULL;
  SELECT user_id INTO v_user_id FROM users
   WHERE reset_token = p_token AND reset_token_expiry > NOW() LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE users SET password_hash = p_new_hash, reset_token = NULL, reset_token_expiry = NULL
     WHERE user_id = v_user_id;
    SET p_ok = 1;
  ELSE
    SET p_ok = 0;
  END IF;
END $$
DROP PROCEDURE IF EXISTS sp_withdraw_resignation $$
CREATE PROCEDURE `sp_withdraw_resignation`(
  IN p_employee_id INT, IN p_resignation_id INT, OUT p_ok TINYINT
)
BEGIN
  DECLARE v_cnt INT DEFAULT 0;
  SELECT COUNT(*) INTO v_cnt FROM resignations
   WHERE resignation_id = p_resignation_id AND employee_id = p_employee_id AND status = 'pending';
  IF v_cnt = 0 THEN SET p_ok = 0;
  ELSE
    UPDATE resignations SET status = 'withdrawn' WHERE resignation_id = p_resignation_id;
    SET p_ok = 1;
  END IF;
END $$
DELIMITER ;
