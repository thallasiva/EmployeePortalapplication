-- =====================================================================
-- HRMS Backend - Stored Procedures
-- Run AFTER schema.sql
-- =====================================================================

USE hrms_db;

DELIMITER $$

-- ---------------------------------------------------------------------
-- sp_create_employee
-- Creates an employee record + linked login (users) row in one transaction
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_create_employee $$
CREATE PROCEDURE sp_create_employee (
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


-- ---------------------------------------------------------------------
-- sp_apply_leave
-- Validates available balance and inserts a pending leave request
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_apply_leave $$
CREATE PROCEDURE sp_apply_leave (
  IN p_employee_id   INT,
  IN p_leave_type_id INT,
  IN p_from_date     DATE,
  IN p_from_session  VARCHAR(20),
  IN p_to_date       DATE,
  IN p_to_session    VARCHAR(20),
  IN p_days          DECIMAL(5,1),
  IN p_reason        VARCHAR(255),
  OUT p_request_id   INT,
  OUT p_status_msg   VARCHAR(100)
)
BEGIN
  DECLARE v_year INT;
  DECLARE v_balance DECIMAL(5,1);
  DECLARE v_quota DECIMAL(5,1);

  SET v_year = YEAR(p_from_date);

  SELECT balance INTO v_balance
  FROM leave_balances
  WHERE employee_id = p_employee_id AND leave_type_id = p_leave_type_id AND year = v_year
  FOR UPDATE;

  IF v_balance IS NULL THEN
    -- No balance row yet for this employee/leave type/year: initialize it
    -- using the leave type's annual quota so new employees aren't stuck at 0.
    SELECT IFNULL(annual_quota, 0) INTO v_quota
    FROM leave_types
    WHERE leave_type_id = p_leave_type_id;

    INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
    VALUES (p_employee_id, p_leave_type_id, v_year, 0, v_quota, 0, v_quota);
    SET v_balance = v_quota;
  END IF;

  IF v_balance < p_days THEN
    SET p_request_id = NULL;
    SET p_status_msg = 'Insufficient leave balance';
  ELSE
    INSERT INTO leave_requests (
      employee_id, leave_type_id, from_date, from_session, to_date, to_session,
      days, reason, status, applied_on
    ) VALUES (
      p_employee_id, p_leave_type_id, p_from_date, p_from_session, p_to_date, p_to_session,
      p_days, p_reason, 'Pending', NOW()
    );
    SET p_request_id = LAST_INSERT_ID();
    SET p_status_msg = 'Leave request submitted';
  END IF;
END $$


-- ---------------------------------------------------------------------
-- sp_review_leave_request
-- Approves or rejects a leave request and adjusts leave balance
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_review_leave_request $$
CREATE PROCEDURE sp_review_leave_request (
  IN p_leave_request_id INT,
  IN p_decision         VARCHAR(20),  -- 'Approved' or 'Rejected'
  IN p_reviewed_by      INT,
  IN p_remarks          VARCHAR(255)
)
BEGIN
  DECLARE v_employee_id INT;
  DECLARE v_leave_type_id INT;
  DECLARE v_days DECIMAL(5,1);
  DECLARE v_year INT;
  DECLARE v_current_status VARCHAR(20);

  SELECT employee_id, leave_type_id, days, YEAR(from_date), status
    INTO v_employee_id, v_leave_type_id, v_days, v_year, v_current_status
  FROM leave_requests
  WHERE leave_request_id = p_leave_request_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Leave request not found';
  END IF;

  IF v_current_status <> 'Pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Leave request already reviewed';
  END IF;

  UPDATE leave_requests
  SET status = p_decision, reviewed_by = p_reviewed_by, reviewed_on = NOW(), remarks = p_remarks
  WHERE leave_request_id = p_leave_request_id;

  IF p_decision = 'Approved' THEN
    UPDATE leave_balances
    SET availed = availed + v_days, balance = balance - v_days
    WHERE employee_id = v_employee_id AND leave_type_id = v_leave_type_id AND year = v_year;

    -- Mark attendance as 'leave' for each day in range
    UPDATE attendance a
    JOIN leave_requests lr ON lr.leave_request_id = p_leave_request_id
    SET a.status = 'leave'
    WHERE a.employee_id = v_employee_id
      AND a.attendance_date BETWEEN lr.from_date AND lr.to_date;
  END IF;
END $$


-- ---------------------------------------------------------------------
-- sp_employee_checkin
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_employee_checkin $$
CREATE PROCEDURE sp_employee_checkin (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME,
  IN p_shift_start TIME
)
BEGIN
  DECLARE v_late_minutes INT DEFAULT 0;

  IF p_shift_start IS NOT NULL AND p_time > p_shift_start THEN
    SET v_late_minutes = TIME_TO_SEC(TIMEDIFF(p_time, p_shift_start)) / 60;
  END IF;

  INSERT INTO attendance (employee_id, attendance_date, check_in, status, late_by_minutes)
  VALUES (p_employee_id, p_date, p_time, IF(v_late_minutes > 0, 'late', 'present'), v_late_minutes)
  ON DUPLICATE KEY UPDATE
    check_in = p_time,
    status = IF(v_late_minutes > 0, 'late', 'present'),
    late_by_minutes = v_late_minutes;
END $$


-- ---------------------------------------------------------------------
-- sp_employee_checkout
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_employee_checkout $$
CREATE PROCEDURE sp_employee_checkout (
  IN p_employee_id INT,
  IN p_date        DATE,
  IN p_time        TIME
)
BEGIN
  UPDATE attendance
  SET check_out = p_time,
      work_hours = ROUND(TIME_TO_SEC(TIMEDIFF(p_time, check_in)) / 3600, 2)
  WHERE employee_id = p_employee_id AND attendance_date = p_date;
END $$


-- ---------------------------------------------------------------------
-- sp_attendance_dashboard
-- Summary stats for admin attendance dashboard for a given date
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_attendance_dashboard $$
CREATE PROCEDURE sp_attendance_dashboard (
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


-- ---------------------------------------------------------------------
-- sp_generate_payslip
-- Computes and stores (or refreshes) a payslip for an employee/month/year
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_generate_payslip $$
CREATE PROCEDURE sp_generate_payslip (
  IN p_employee_id   INT,
  IN p_month         TINYINT,
  IN p_year          INT,
  IN p_payroll_run_id INT,
  OUT p_payslip_id   INT
)
BEGIN
  DECLARE v_basic DECIMAL(12,2);
  DECLARE v_hra DECIMAL(12,2);
  DECLARE v_allowances DECIMAL(12,2);
  DECLARE v_deductions DECIMAL(12,2);
  DECLARE v_gross DECIMAL(12,2);
  DECLARE v_net DECIMAL(12,2);
  DECLARE v_ctc DECIMAL(12,2);
  DECLARE v_ctc_struct DECIMAL(12,2);
  DECLARE v_employer_pf DECIMAL(12,2);
  DECLARE v_working_days DECIMAL(4,1);
  DECLARE v_lop_days DECIMAL(4,1);
  DECLARE v_paid_days DECIMAL(4,1);
  DECLARE v_per_day DECIMAL(12,2);

  SELECT basic, hra,
         (conveyance + medical_allowance + special_allowance),
         (pf_employee + professional_tax + income_tax),
         ctc
    INTO v_basic, v_hra, v_allowances, v_deductions, v_ctc_struct
  FROM salary_structures
  WHERE employee_id = p_employee_id
  ORDER BY effective_from DESC
  LIMIT 1;

  IF v_basic IS NULL THEN
    SELECT base_salary * 0.5, base_salary * 0.2, base_salary * 0.3, 0, ctc
      INTO v_basic, v_hra, v_allowances, v_deductions, v_ctc_struct
    FROM employees WHERE employee_id = p_employee_id;
  END IF;

  -- working days in the month (excluding Sundays as a simple approximation)
  SET v_working_days = DAY(LAST_DAY(STR_TO_DATE(CONCAT(p_year,'-',p_month,'-01'), '%Y-%m-%d')));

  SELECT COUNT(*) INTO v_lop_days
  FROM attendance
  WHERE employee_id = p_employee_id
    AND MONTH(attendance_date) = p_month
    AND YEAR(attendance_date) = p_year
    AND status = 'absent';

  SET v_paid_days = v_working_days - v_lop_days;
  SET v_gross = v_basic + v_hra + v_allowances;
  SET v_per_day = v_gross / v_working_days;
  SET v_gross = ROUND(v_per_day * v_paid_days, 2);
  SET v_net = ROUND(v_gross - v_deductions, 2);

  -- CTC = salary_structures.ctc if set; otherwise gross + employer PF (12% of basic, capped at ₹15,000 wage ceiling)
  SET v_employer_pf = ROUND(LEAST(v_basic, 15000) * 0.12, 2);
  SET v_ctc = IF(v_ctc_struct IS NOT NULL AND v_ctc_struct > 0, v_ctc_struct, v_gross + v_employer_pf);

  INSERT INTO payslips (
    payroll_run_id, employee_id, month, year, basic, hra, allowances,
    gross_earnings, ctc, deductions, net_pay, working_days, paid_days, lop_days, status
  ) VALUES (
    p_payroll_run_id, p_employee_id, p_month, p_year, v_basic, v_hra, v_allowances,
    v_gross, v_ctc, v_deductions, v_net, v_working_days, v_paid_days, v_lop_days, 'Generated'
  )
  ON DUPLICATE KEY UPDATE
    payroll_run_id = p_payroll_run_id,
    basic = v_basic, hra = v_hra, allowances = v_allowances,
    gross_earnings = v_gross, ctc = v_ctc, deductions = v_deductions, net_pay = v_net,
    working_days = v_working_days, paid_days = v_paid_days, lop_days = v_lop_days,
    status = 'Generated', generated_on = NOW();

  SELECT payslip_id INTO p_payslip_id
  FROM payslips WHERE employee_id = p_employee_id AND month = p_month AND year = p_year;
END $$


-- ---------------------------------------------------------------------
-- sp_run_payroll
-- Generates payslips for all active employees for the given month/year
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_run_payroll $$
CREATE PROCEDURE sp_run_payroll (
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


-- ---------------------------------------------------------------------
-- sp_dashboard_stats
-- Overall HRMS dashboard counters
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_dashboard_stats $$
CREATE PROCEDURE sp_dashboard_stats ()
BEGIN
  SELECT
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active') AS employees_count,
    (SELECT COUNT(*) FROM companies) AS companies_count,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending') AS pending_leaves_count,
    (SELECT COUNT(*) FROM payslips WHERE month = MONTH(CURDATE()) AND year = YEAR(CURDATE())) AS salaries_count,
    (SELECT COUNT(*) FROM helpdesk_tickets WHERE status IN ('Open','In Progress')) AS open_tickets_count,
    (SELECT COUNT(*) FROM jobs WHERE status = 'Open') AS open_jobs_count;
END $$


-- ---------------------------------------------------------------------
-- sp_team_leave_calendar
-- Team staffing availability for a given month (count of employees on leave per day)
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_team_leave_calendar $$
CREATE PROCEDURE sp_team_leave_calendar (
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

DELIMITER ;
