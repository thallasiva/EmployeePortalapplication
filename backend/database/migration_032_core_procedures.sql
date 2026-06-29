-- =============================================================================
-- Migration 032 — Core Stored Procedures
-- Replace hardcoded SQL in service layer with reusable stored procedures.
-- Run in MySQL Workbench: source migration_032_core_procedures.sql
-- =============================================================================

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────────
-- EMPLOYEE PROCEDURES
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_employees $$
CREATE PROCEDURE sp_list_employees (
  IN p_department   INT,
  IN p_status       VARCHAR(30),
  IN p_search       VARCHAR(200),
  IN p_reporting_to INT,
  IN p_limit        INT,
  IN p_offset       INT
)
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS reporting_to_name,
         m.emp_code AS reporting_to_code,
         ci.current_address, ci.permanent_address, ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         ci.contact_name, ci.contact_city, ci.contact_country,
         ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3,
         bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number AS bd_pan_number,
         bd.uan_number, bd.account_type, bd.bank_branch, bd.dd_payable_at,
         bd.account_holder_name, bd.payment_type,
         EXISTS(
           SELECT 1 FROM resignations r
           WHERE r.employee_id = e.employee_id
             AND r.status IN ('pending','rm_approved','accepted')
         ) AS serving_notice
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
   WHERE (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
     AND (p_department   IS NULL OR e.department_id = p_department)
     AND (p_status       IS NULL OR e.employee_status = p_status)
     AND (p_search       IS NULL OR
          e.first_name LIKE CONCAT('%', p_search, '%') OR
          e.last_name  LIKE CONCAT('%', p_search, '%') OR
          e.email      LIKE CONCAT('%', p_search, '%') OR
          e.emp_code   LIKE CONCAT('%', p_search, '%'))
   ORDER BY e.employee_id DESC
   LIMIT  IFNULL(p_limit, 18446744073709551615)
   OFFSET IFNULL(p_offset, 0);

  -- Second result set: total count (used for pagination)
  SELECT COUNT(*) AS total
    FROM employees e
   WHERE (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
     AND (p_department   IS NULL OR e.department_id = p_department)
     AND (p_status       IS NULL OR e.employee_status = p_status)
     AND (p_search       IS NULL OR
          e.first_name LIKE CONCAT('%', p_search, '%') OR
          e.last_name  LIKE CONCAT('%', p_search, '%') OR
          e.email      LIKE CONCAT('%', p_search, '%') OR
          e.emp_code   LIKE CONCAT('%', p_search, '%'));
END $$

DROP PROCEDURE IF EXISTS sp_get_employee_profile $$
CREATE PROCEDURE sp_get_employee_profile (IN p_employee_id INT)
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS reporting_to_name,
         m.emp_code AS reporting_to_code,
         ci.current_address, ci.permanent_address, ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         ci.contact_name, ci.contact_city, ci.contact_country,
         ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3,
         bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number AS bd_pan_number,
         bd.uan_number, bd.account_type, bd.bank_branch, bd.dd_payable_at,
         bd.account_holder_name, bd.payment_type,
         EXISTS(
           SELECT 1 FROM resignations r
           WHERE r.employee_id = e.employee_id
             AND r.status IN ('pending','rm_approved','accepted')
         ) AS serving_notice
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
   WHERE e.employee_id = p_employee_id;

  -- Contact info
  SELECT * FROM employee_contact_info WHERE employee_id = p_employee_id;

  -- Bank details
  SELECT * FROM employee_bank_details WHERE employee_id = p_employee_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_org_chart $$
CREATE PROCEDURE sp_get_org_chart ()
BEGIN
  SELECT e.employee_id, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.reporting_to, e.profile_photo,
         d.department_name, d.department_id,
         des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status = 'Active' AND e.has_left_organization = 0
   ORDER BY e.employee_id ASC;
END $$

DROP PROCEDURE IF EXISTS sp_get_employee_directory $$
CREATE PROCEDURE sp_get_employee_directory (
  IN p_location         VARCHAR(100),
  IN p_department       INT,
  IN p_holiday_calendar VARCHAR(100)
)
BEGIN
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS reporting_to_name,
         m.emp_code AS reporting_to_code,
         ci.current_address, ci.permanent_address, ci.personal_email, ci.alternate_mobile,
         ci.emergency_contact_name, ci.emergency_contact_relation, ci.emergency_contact_phone,
         ci.contact_name, ci.contact_city, ci.contact_country,
         ci.permanent_address_line1, ci.permanent_address_line2, ci.permanent_address_line3,
         bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number AS bd_pan_number,
         bd.uan_number, bd.account_type, bd.bank_branch, bd.dd_payable_at,
         bd.account_holder_name, bd.payment_type,
         EXISTS(
           SELECT 1 FROM resignations r
           WHERE r.employee_id = e.employee_id
             AND r.status IN ('pending','rm_approved','accepted')
         ) AS serving_notice
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
    LEFT JOIN employee_contact_info ci ON ci.employee_id = e.employee_id
    LEFT JOIN employee_bank_details bd ON bd.employee_id = e.employee_id
   WHERE e.employee_status = 'Active'
     AND (p_department       IS NULL OR e.department_id    = p_department)
     AND (p_location         IS NULL OR e.location         = p_location)
     AND (p_holiday_calendar IS NULL OR e.holiday_calendar = p_holiday_calendar)
   ORDER BY e.first_name;
END $$

DROP PROCEDURE IF EXISTS sp_get_employee_team $$
CREATE PROCEDURE sp_get_employee_team (IN p_employee_id INT)
BEGIN
  -- The employee's own record (to find their manager)
  SELECT e.*,
         d.department_name, ds.designation_name,
         CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS reporting_to_name,
         m.emp_code AS reporting_to_code
    FROM employees e
    LEFT JOIN departments d   ON d.department_id  = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
    LEFT JOIN employees m     ON m.employee_id     = e.reporting_to
   WHERE e.employee_id = p_employee_id;
END $$

DROP PROCEDURE IF EXISTS sp_upsert_contact_info $$
CREATE PROCEDURE sp_upsert_contact_info (
  IN p_employee_id                 INT,
  IN p_current_address             TEXT,
  IN p_permanent_address           TEXT,
  IN p_personal_email              VARCHAR(150),
  IN p_alternate_mobile            VARCHAR(20),
  IN p_emergency_contact_name      VARCHAR(100),
  IN p_emergency_contact_relation  VARCHAR(50),
  IN p_emergency_contact_phone     VARCHAR(20),
  IN p_contact_name                VARCHAR(100),
  IN p_contact_city                VARCHAR(100),
  IN p_contact_country             VARCHAR(100),
  IN p_permanent_address_line1     VARCHAR(255),
  IN p_permanent_address_line2     VARCHAR(255),
  IN p_permanent_address_line3     VARCHAR(255)
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

DROP PROCEDURE IF EXISTS sp_upsert_bank_details $$
CREATE PROCEDURE sp_upsert_bank_details (
  IN p_employee_id      INT,
  IN p_bank_name        VARCHAR(100),
  IN p_account_number   VARCHAR(50),
  IN p_ifsc_code        VARCHAR(20),
  IN p_pan_number       VARCHAR(20),
  IN p_uan_number       VARCHAR(30),
  IN p_account_type     VARCHAR(30),
  IN p_bank_branch      VARCHAR(100),
  IN p_dd_payable_at    VARCHAR(100),
  IN p_account_holder   VARCHAR(100),
  IN p_payment_type     VARCHAR(30)
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

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTH PROCEDURES
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_get_user_for_login $$
CREATE PROCEDURE sp_get_user_for_login (IN p_email VARCHAR(150))
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name,
         e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.email = p_email
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_get_user_by_id $$
CREATE PROCEDURE sp_get_user_by_id (IN p_user_id INT)
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name,
         e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.user_id = p_user_id
   LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_login_success $$
CREATE PROCEDURE sp_login_success (IN p_user_id INT)
BEGIN
  UPDATE users
     SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL
   WHERE user_id = p_user_id;
END $$

DROP PROCEDURE IF EXISTS sp_login_fail $$
CREATE PROCEDURE sp_login_fail (
  IN  p_user_id        INT,
  IN  p_max_attempts   INT,
  IN  p_lockout_mins   INT,
  OUT p_locked         TINYINT,
  OUT p_attempts       INT
)
BEGIN
  DECLARE v_attempts INT DEFAULT 0;
  SELECT IFNULL(failed_login_attempts, 0) + 1 INTO v_attempts
    FROM users WHERE user_id = p_user_id;

  SET p_attempts = v_attempts;

  IF v_attempts >= p_max_attempts THEN
    UPDATE users
       SET failed_login_attempts = v_attempts,
           locked_until          = DATE_ADD(NOW(), INTERVAL p_lockout_mins MINUTE)
     WHERE user_id = p_user_id;
    SET p_locked = 1;
  ELSE
    UPDATE users SET failed_login_attempts = v_attempts WHERE user_id = p_user_id;
    SET p_locked = 0;
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_register_user $$
CREATE PROCEDURE sp_register_user (
  IN  p_first_name     VARCHAR(80),
  IN  p_last_name      VARCHAR(80),
  IN  p_email          VARCHAR(150),
  IN  p_mobile         VARCHAR(20),
  IN  p_job_title      VARCHAR(100),
  IN  p_department_id  INT,
  IN  p_designation_id INT,
  IN  p_password_hash  VARCHAR(255),
  IN  p_role_id        INT,
  OUT p_employee_id    INT,
  OUT p_emp_code       VARCHAR(30)
)
BEGIN
  DECLARE v_emp_code VARCHAR(30);
  SET v_emp_code = CONCAT('EMP', LPAD(FLOOR(RAND() * 1000000), 6, '0'));

  START TRANSACTION;

  INSERT INTO employees (
    emp_code, first_name, last_name, email, mobile, emp_job_title,
    department_id, designation_id, employee_type, employee_status, emp_joining_date
  ) VALUES (
    v_emp_code, p_first_name, p_last_name, p_email, p_mobile,
    IFNULL(p_job_title, 'Employee'),
    p_department_id, p_designation_id, 'Full-Time', 'Active', CURDATE()
  );

  SET p_employee_id = LAST_INSERT_ID();
  SET p_emp_code    = v_emp_code;

  INSERT INTO users (email, password_hash, role_id, employee_id, status)
  VALUES (p_email, p_password_hash, IFNULL(p_role_id, 2), p_employee_id, 'Active');

  COMMIT;
END $$

DROP PROCEDURE IF EXISTS sp_change_password $$
CREATE PROCEDURE sp_change_password (IN p_user_id INT, IN p_new_hash VARCHAR(255))
BEGIN
  UPDATE users SET password_hash = p_new_hash WHERE user_id = p_user_id;
END $$

DROP PROCEDURE IF EXISTS sp_set_reset_token $$
CREATE PROCEDURE sp_set_reset_token (
  IN p_email  VARCHAR(150),
  IN p_token  VARCHAR(64),
  IN p_expiry DATETIME
)
BEGIN
  UPDATE users SET reset_token = p_token, reset_token_expiry = p_expiry
   WHERE email = p_email;
  SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS sp_reset_password $$
CREATE PROCEDURE sp_reset_password (
  IN  p_token    VARCHAR(64),
  IN  p_new_hash VARCHAR(255),
  OUT p_ok       TINYINT
)
BEGIN
  DECLARE v_user_id INT DEFAULT NULL;
  DECLARE v_expiry  DATETIME DEFAULT NULL;

  SELECT user_id, reset_token_expiry INTO v_user_id, v_expiry
    FROM users WHERE reset_token = p_token LIMIT 1;

  IF v_user_id IS NULL OR v_expiry < NOW() THEN
    SET p_ok = 0;
  ELSE
    UPDATE users
       SET password_hash = p_new_hash, reset_token = NULL, reset_token_expiry = NULL
     WHERE user_id = v_user_id;
    SET p_ok = 1;
  END IF;
END $$

-- ─────────────────────────────────────────────────────────────────────────────
-- LEAVE REQUEST PROCEDURES
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_leave_requests $$
CREATE PROCEDURE sp_list_leave_requests (
  IN p_employee_id   INT,
  IN p_status        VARCHAR(30),
  IN p_leave_type_id INT,
  IN p_department_id INT,
  IN p_reporting_to  INT,
  IN p_limit         INT,
  IN p_offset        INT
)
BEGIN
  SELECT lr.*,
         e.emp_code,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name,
         lt.leave_type_name,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e   ON e.employee_id  = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d  ON d.department_id = e.department_id
    LEFT JOIN employees rv   ON rv.employee_id  = lr.reviewed_by
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to)
   ORDER BY lr.applied_on DESC
   LIMIT  IFNULL(p_limit, 18446744073709551615)
   OFFSET IFNULL(p_offset, 0);

  -- Count result set for pagination
  SELECT COUNT(*) AS total
    FROM leave_requests lr
    JOIN employees e ON e.employee_id = lr.employee_id
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to);
END $$

DROP PROCEDURE IF EXISTS sp_get_leave_request $$
CREATE PROCEDURE sp_get_leave_request (IN p_id INT)
BEGIN
  SELECT lr.*,
         e.emp_code,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name,
         lt.leave_type_name,
         CONCAT(rv.first_name, ' ', IFNULL(rv.last_name, '')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e    ON e.employee_id   = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv  ON rv.employee_id  = lr.reviewed_by
   WHERE lr.leave_request_id = p_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_leave_balances $$
CREATE PROCEDURE sp_get_leave_balances (IN p_employee_id INT, IN p_year INT)
BEGIN
  SELECT lt.leave_type_id, lt.leave_type_name, lt.annual_quota, lt.carry_forward_limit,
         IFNULL(lb.opening_balance, 0)         AS opening_balance,
         IFNULL(lb.granted, lt.annual_quota)   AS granted,
         IFNULL(lb.availed, 0)                 AS availed,
         IFNULL(lb.balance, lt.annual_quota)   AS balance
    FROM leave_types lt
    LEFT JOIN leave_balances lb
      ON lb.leave_type_id = lt.leave_type_id
     AND lb.employee_id   = p_employee_id
     AND lb.year          = p_year
   ORDER BY lt.leave_type_name;
END $$

DROP PROCEDURE IF EXISTS sp_cancel_leave_request $$
CREATE PROCEDURE sp_cancel_leave_request (
  IN  p_id          INT,
  IN  p_employee_id INT,
  OUT p_ok          TINYINT,
  OUT p_msg         VARCHAR(200)
)
BEGIN
  DECLARE v_emp_id INT;
  DECLARE v_status VARCHAR(30);

  SELECT employee_id, status INTO v_emp_id, v_status
    FROM leave_requests WHERE leave_request_id = p_id LIMIT 1;

  IF v_emp_id IS NULL THEN
    SET p_ok = 0; SET p_msg = 'Leave request not found';
  ELSEIF v_emp_id != p_employee_id THEN
    SET p_ok = 0; SET p_msg = 'You can only cancel your own leave requests';
  ELSEIF v_status != 'Pending' THEN
    SET p_ok = 0; SET p_msg = 'Only pending leave requests can be cancelled';
  ELSE
    UPDATE leave_requests SET status = 'Cancelled' WHERE leave_request_id = p_id;
    SET p_ok = 1; SET p_msg = 'Cancelled';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_get_leave_summary $$
CREATE PROCEDURE sp_get_leave_summary (
  IN p_year          INT,
  IN p_department_id INT,
  IN p_status        VARCHAR(30)
)
BEGIN
  -- Result 1: employees
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         e.employee_status, e.emp_joining_date, e.confirmation_date,
         d.department_name, des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status != 'Deleted'
     AND (p_department_id IS NULL OR e.department_id = p_department_id)
     AND (p_status        IS NULL OR e.employee_status = p_status)
   ORDER BY e.emp_code;

  -- Result 2: all leave types
  SELECT leave_type_id, leave_type_name FROM leave_types ORDER BY leave_type_name;

  -- Result 3: leave balances for the year
  SELECT lb.employee_id, lb.leave_type_id,
         lb.opening_balance, lb.granted, lb.availed,
         GREATEST(0, lb.opening_balance + lb.granted - lb.availed) AS closing_balance
    FROM leave_balances lb WHERE lb.year = p_year;

  -- Result 4: monthly leave usage
  SELECT lr.employee_id, lr.leave_type_id,
         MONTH(lr.from_date) AS month,
         SUM(lr.days)        AS days_taken
    FROM leave_requests lr
   WHERE lr.status = 'Approved' AND YEAR(lr.from_date) = p_year
   GROUP BY lr.employee_id, lr.leave_type_id, MONTH(lr.from_date);
END $$

-- ─────────────────────────────────────────────────────────────────────────────
-- TIMESHEET / TASK PROCEDURES
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_create_task $$
CREATE PROCEDURE sp_create_task (
  IN  p_employee_id    INT,
  IN  p_task_name      VARCHAR(200),
  IN  p_project_name   VARCHAR(200),
  IN  p_description    TEXT,
  IN  p_start_date     DATE,
  IN  p_end_date       DATE,
  IN  p_start_time     TIME,
  IN  p_end_time       TIME,
  IN  p_duration_hours DECIMAL(5,2),
  OUT p_task_id        INT
)
BEGIN
  INSERT INTO employee_tasks (
    employee_id, task_name, project_name, description,
    start_date, end_date, start_time, end_time, duration_hours
  ) VALUES (
    p_employee_id, p_task_name, IFNULL(p_project_name, ''),
    IFNULL(p_description, ''),
    p_start_date, p_end_date, p_start_time, p_end_time, p_duration_hours
  );
  SET p_task_id = LAST_INSERT_ID();
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END $$

DROP PROCEDURE IF EXISTS sp_get_task $$
CREATE PROCEDURE sp_get_task (IN p_task_id INT)
BEGIN
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END $$

DROP PROCEDURE IF EXISTS sp_list_my_tasks $$
CREATE PROCEDURE sp_list_my_tasks (IN p_employee_id INT)
BEGIN
  SELECT * FROM employee_tasks
   WHERE employee_id = p_employee_id
   ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS sp_delete_task $$
CREATE PROCEDURE sp_delete_task (
  IN  p_task_id     INT,
  IN  p_employee_id INT,
  OUT p_affected    INT
)
BEGIN
  DELETE FROM employee_tasks
   WHERE task_id = p_task_id AND employee_id = p_employee_id;
  SET p_affected = ROW_COUNT();
END $$

DROP PROCEDURE IF EXISTS sp_get_weekly_timesheet $$
CREATE PROCEDURE sp_get_weekly_timesheet (
  IN  p_employee_id INT,
  IN  p_week_start  DATE,
  IN  p_week_end    DATE,
  OUT p_ts_id       INT
)
BEGIN
  SELECT timesheet_id INTO p_ts_id
    FROM weekly_timesheets
   WHERE employee_id = p_employee_id
     AND week_start = p_week_start
   LIMIT 1;

  IF p_ts_id IS NULL THEN
    INSERT INTO weekly_timesheets (employee_id, week_start, week_end, status)
    VALUES (p_employee_id, p_week_start, p_week_end, 'draft');
    SET p_ts_id = LAST_INSERT_ID();
  END IF;

  SELECT * FROM weekly_timesheets WHERE timesheet_id = p_ts_id;
END $$

DROP PROCEDURE IF EXISTS sp_submit_timesheet $$
CREATE PROCEDURE sp_submit_timesheet (
  IN  p_employee_id   INT,
  IN  p_timesheet_id  INT,
  OUT p_ok            TINYINT,
  OUT p_msg           VARCHAR(200)
)
BEGIN
  DECLARE v_status    VARCHAR(30);
  DECLARE v_emp_id    INT;

  SELECT status, employee_id INTO v_status, v_emp_id
    FROM weekly_timesheets WHERE timesheet_id = p_timesheet_id LIMIT 1;

  IF v_emp_id IS NULL THEN
    SET p_ok = 0; SET p_msg = 'Timesheet not found';
  ELSEIF v_emp_id != p_employee_id THEN
    SET p_ok = 0; SET p_msg = 'Not your timesheet';
  ELSEIF v_status NOT IN ('draft','rejected') THEN
    SET p_ok = 0; SET p_msg = CONCAT('Timesheet is already ', v_status);
  ELSE
    UPDATE weekly_timesheets
       SET status = 'submitted', submitted_at = NOW()
     WHERE timesheet_id = p_timesheet_id;
    -- Lock associated entries
    UPDATE timesheet_entries SET locked = 1 WHERE timesheet_id = p_timesheet_id;
    SET p_ok = 1; SET p_msg = 'submitted';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_review_timesheet $$
CREATE PROCEDURE sp_review_timesheet (
  IN  p_timesheet_id  INT,
  IN  p_decision      VARCHAR(20),
  IN  p_reviewed_by   INT,
  IN  p_comments      TEXT,
  OUT p_ok            TINYINT,
  OUT p_msg           VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(30);

  SELECT status INTO v_status
    FROM weekly_timesheets WHERE timesheet_id = p_timesheet_id LIMIT 1;

  IF v_status IS NULL THEN
    SET p_ok = 0; SET p_msg = 'Timesheet not found';
  ELSEIF v_status != 'submitted' THEN
    SET p_ok = 0; SET p_msg = 'Timesheet is not in submitted state';
  ELSE
    UPDATE weekly_timesheets
       SET status      = p_decision,
           reviewed_by = p_reviewed_by,
           reviewed_at = NOW(),
           comments    = p_comments
     WHERE timesheet_id = p_timesheet_id;
    SET p_ok = 1; SET p_msg = p_decision;
  END IF;

  SELECT p_ok AS ok, p_msg AS msg;
END $$

DROP PROCEDURE IF EXISTS sp_employee_dashboard $$
CREATE PROCEDURE sp_employee_dashboard (IN p_employee_id INT)
BEGIN
  -- Timesheet counts
  SELECT
    SUM(CASE WHEN status = 'approved'  THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'rejected'  THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END) AS draft
  FROM weekly_timesheets
  WHERE employee_id = p_employee_id;

  -- Open task count
  SELECT COUNT(*) AS open_tasks
  FROM employee_tasks
  WHERE employee_id = p_employee_id
    AND status NOT IN ('completed', 'in_timesheet');

  -- Pending leave requests
  SELECT COUNT(*) AS pending_leaves
  FROM leave_requests
  WHERE employee_id = p_employee_id AND status = 'Pending';

  -- Leave balances
  SELECT lt.leave_type_name,
         IFNULL(lb.balance, lt.annual_quota) AS balance
  FROM leave_types lt
  LEFT JOIN leave_balances lb
         ON lb.leave_type_id = lt.leave_type_id
        AND lb.employee_id   = p_employee_id
        AND lb.year          = YEAR(CURDATE())
  ORDER BY lt.leave_type_name;
END $$

DROP PROCEDURE IF EXISTS sp_admin_dashboard $$
CREATE PROCEDURE sp_admin_dashboard ()
BEGIN
  -- Timesheet overview
  SELECT
    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending_timesheets,
    SUM(CASE WHEN status = 'approved'  THEN 1 ELSE 0 END) AS approved_timesheets,
    COUNT(*) AS total_timesheets
  FROM weekly_timesheets;

  -- Employee counts by role
  SELECT
    (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active') AS active_employees,
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'Pending')    AS pending_leaves,
    (SELECT COUNT(*) FROM helpdesk_tickets WHERE status = 'Open')     AS open_tickets;
END $$

DELIMITER ;
