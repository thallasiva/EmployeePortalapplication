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

  -- Count scheduled workdays only: Sundays and the employee's holiday-calendar
  -- holidays are never treated as payable workdays or loss-of-pay days.
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

  -- An explicit absence is LOP, a half-day is 0.5 LOP. Approved leave is paid
  -- and regularized attendance has already updated the attendance record.
  SELECT COALESCE(SUM(CASE WHEN a.status = 'half_day' THEN 0.5 ELSE 1 END), 0) INTO v_lop_days
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

-- =====================================================================
-- HOLIDAY STORED PROCEDURES
-- =====================================================================

-- ---------------------------------------------------------------------
-- sp_migrate_holidays_shift_location
-- Idempotent: adds shift + location columns if they don't already exist
-- Run once after deploying on an existing database
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_migrate_holidays_shift_location $$
CREATE PROCEDURE sp_migrate_holidays_shift_location ()
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


-- ---------------------------------------------------------------------
-- sp_list_holidays
-- Returns two result sets: [0] data rows, [1] count row
-- Filters by year / shift / location / calendar (all optional)
-- Uses static conditional WHERE — no dynamic SQL
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_list_holidays $$
CREATE PROCEDURE sp_list_holidays (
  IN p_year             INT,
  IN p_shift            VARCHAR(10),
  IN p_location         VARCHAR(100),
  IN p_holiday_calendar VARCHAR(100),
  IN p_limit            INT,
  IN p_offset           INT
)
BEGIN
  -- Result set 1: rows (with optional pagination)
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

  -- Result set 2: total count (always unfiltered by LIMIT)
  SELECT COUNT(*) AS total
    FROM holidays
   WHERE (p_year             IS NULL OR p_year             = 0  OR YEAR(holiday_date) = p_year)
     AND (p_shift            IS NULL OR p_shift            = '' OR shift            = p_shift)
     AND (p_location         IS NULL OR p_location         = '' OR location         = p_location)
     AND (p_holiday_calendar IS NULL OR p_holiday_calendar = '' OR holiday_calendar = p_holiday_calendar);
END $$


-- ---------------------------------------------------------------------
-- sp_list_holiday_locations
-- Returns distinct non-null location values for the filter dropdown
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_list_holiday_locations $$
CREATE PROCEDURE sp_list_holiday_locations ()
BEGIN
  SELECT DISTINCT location
    FROM holidays
   WHERE location IS NOT NULL AND location <> ''
   ORDER BY location ASC;
END $$


-- ---------------------------------------------------------------------
-- sp_create_holiday
-- Inserts a single holiday row and returns the new ID
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_create_holiday $$
CREATE PROCEDURE sp_create_holiday (
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


-- ---------------------------------------------------------------------
-- sp_update_holiday
-- Updates an existing holiday row by ID
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_update_holiday $$
CREATE PROCEDURE sp_update_holiday (
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


-- ---------------------------------------------------------------------
-- sp_delete_holiday
-- Deletes a holiday by ID
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_delete_holiday $$
CREATE PROCEDURE sp_delete_holiday (
  IN p_holiday_id INT
)
BEGIN
  DELETE FROM holidays WHERE holiday_id = p_holiday_id;
END $$


-- ---------------------------------------------------------------------
-- sp_bulk_import_holidays
-- Accepts a JSON array of holiday objects and inserts each one.
-- JSON element shape: { name, date, calendar, shift, location, restricted }
-- Returns rows inserted count.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_bulk_import_holidays $$
CREATE PROCEDURE sp_bulk_import_holidays (
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

DELIMITER ;
