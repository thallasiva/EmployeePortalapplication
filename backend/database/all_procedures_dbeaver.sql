-- =============================================================================
-- HRMS — ALL STORED PROCEDURES
-- Run this file in MySQL Workbench 8.3 against your hrms_db database.
-- Menu: File → Open SQL Script → Run (lightning bolt)
-- =============================================================================

USE hrms_db;


-- =============================================================================
-- ░░  EMPLOYEE  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_employees ;
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
   WHERE (p_reporting_to IS NULL OR e.reporting_to   = p_reporting_to)
     AND (p_department   IS NULL OR e.department_id  = p_department)
     AND (p_status       IS NULL OR e.employee_status = p_status)
     AND (p_search       IS NULL OR e.first_name LIKE CONCAT('%',p_search,'%')
          OR e.last_name LIKE CONCAT('%',p_search,'%')
          OR e.email     LIKE CONCAT('%',p_search,'%')
          OR e.emp_code  LIKE CONCAT('%',p_search,'%'))
   ORDER BY e.employee_id DESC
   LIMIT  IFNULL(p_limit, 18446744073709551615)
   OFFSET IFNULL(p_offset, 0);

  SELECT COUNT(*) AS total
    FROM employees e
   WHERE (p_reporting_to IS NULL OR e.reporting_to   = p_reporting_to)
     AND (p_department   IS NULL OR e.department_id  = p_department)
     AND (p_status       IS NULL OR e.employee_status = p_status)
     AND (p_search       IS NULL OR e.first_name LIKE CONCAT('%',p_search,'%')
          OR e.last_name LIKE CONCAT('%',p_search,'%')
          OR e.email     LIKE CONCAT('%',p_search,'%')
          OR e.emp_code  LIKE CONCAT('%',p_search,'%'));
END ;
DROP PROCEDURE IF EXISTS sp_get_employee_profile ;
CREATE PROCEDURE sp_get_employee_profile (IN p_employee_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_get_org_chart ;
CREATE PROCEDURE sp_get_org_chart ()
BEGIN
  SELECT e.employee_id, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.reporting_to, e.profile_photo,
         d.department_name, d.department_id, des.designation_name
    FROM employees e
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE e.employee_status = 'Active' AND e.has_left_organization = 0
   ORDER BY e.employee_id ASC;
END ;
DROP PROCEDURE IF EXISTS sp_get_employee_directory ;
CREATE PROCEDURE sp_get_employee_directory (
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
END ;
DROP PROCEDURE IF EXISTS sp_upsert_contact_info ;
CREATE PROCEDURE sp_upsert_contact_info (
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
END ;
DROP PROCEDURE IF EXISTS sp_upsert_bank_details ;
CREATE PROCEDURE sp_upsert_bank_details (
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
END ;
-- =============================================================================
-- ░░  AUTH / USERS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_user_for_login ;
CREATE PROCEDURE sp_get_user_for_login (IN p_email VARCHAR(150))
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.email = p_email LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_user_by_id ;
CREATE PROCEDURE sp_get_user_by_id (IN p_user_id INT)
BEGIN
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         u.mfa_enabled, u.failed_login_attempts, u.locked_until,
         r.role_name, e.first_name, e.last_name, e.emp_code, e.emp_job_title,
         e.department_id, e.profile_photo
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
   WHERE u.user_id = p_user_id LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_login_success ;
CREATE PROCEDURE sp_login_success (IN p_user_id INT)
BEGIN
  UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL
   WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_login_fail ;
CREATE PROCEDURE sp_login_fail (
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
END ;
DROP PROCEDURE IF EXISTS sp_register_user ;
CREATE PROCEDURE sp_register_user (
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
END ;
DROP PROCEDURE IF EXISTS sp_change_password ;
CREATE PROCEDURE sp_change_password (IN p_user_id INT, IN p_new_hash VARCHAR(255))
BEGIN
  UPDATE users SET password_hash = p_new_hash WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_set_reset_token ;
CREATE PROCEDURE sp_set_reset_token (IN p_email VARCHAR(150), IN p_token VARCHAR(64), IN p_expiry DATETIME)
BEGIN
  UPDATE users SET reset_token = p_token, reset_token_expiry = p_expiry WHERE email = p_email;
  SELECT ROW_COUNT() AS affected;
END ;
DROP PROCEDURE IF EXISTS sp_reset_password ;
CREATE PROCEDURE sp_reset_password (IN p_token VARCHAR(64), IN p_new_hash VARCHAR(255), OUT p_ok TINYINT)
BEGIN
  DECLARE v_user_id INT; DECLARE v_expiry DATETIME;
  SELECT user_id, reset_token_expiry INTO v_user_id, v_expiry FROM users WHERE reset_token = p_token LIMIT 1;
  IF v_user_id IS NULL OR v_expiry < NOW() THEN SET p_ok = 0;
  ELSE
    UPDATE users SET password_hash = p_new_hash, reset_token = NULL, reset_token_expiry = NULL
     WHERE user_id = v_user_id;
    SET p_ok = 1;
  END IF;
END ;
-- =============================================================================
-- ░░  MFA  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_issue_mfa_token ;
CREATE PROCEDURE sp_issue_mfa_token (IN p_user_id INT, IN p_token VARCHAR(64), IN p_expires_at DATETIME)
BEGIN
  DELETE FROM mfa_temp_tokens WHERE user_id = p_user_id OR expires_at < NOW();
  INSERT INTO mfa_temp_tokens (user_id, token, expires_at) VALUES (p_user_id, p_token, p_expires_at);
END ;
DROP PROCEDURE IF EXISTS sp_verify_mfa_token ;
CREATE PROCEDURE sp_verify_mfa_token (IN p_token VARCHAR(64), OUT p_user_id INT)
BEGIN
  DECLARE v_id INT; DECLARE v_used TINYINT; DECLARE v_exp DATETIME;
  SELECT id, user_id, used, expires_at INTO v_id, p_user_id, v_used, v_exp
    FROM mfa_temp_tokens WHERE token = p_token LIMIT 1;
  IF p_user_id IS NULL OR v_used = 1 OR v_exp < NOW() THEN SET p_user_id = NULL;
  ELSE UPDATE mfa_temp_tokens SET used = 1 WHERE id = v_id;
  END IF;
  SELECT p_user_id AS user_id;
END ;
DROP PROCEDURE IF EXISTS sp_enable_mfa ;
CREATE PROCEDURE sp_enable_mfa (IN p_user_id INT, IN p_encrypted_secret VARCHAR(500))
BEGIN
  UPDATE users SET mfa_secret = p_encrypted_secret, mfa_enabled = 1 WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_disable_mfa ;
CREATE PROCEDURE sp_disable_mfa (IN p_user_id INT)
BEGIN
  UPDATE users SET mfa_secret = NULL, mfa_enabled = 0 WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_mfa_status ;
CREATE PROCEDURE sp_get_mfa_status (IN p_user_id INT)
BEGIN
  SELECT email, mfa_enabled FROM users WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_mfa_secret ;
CREATE PROCEDURE sp_get_mfa_secret (IN p_user_id INT)
BEGIN
  SELECT mfa_secret, mfa_enabled FROM users WHERE user_id = p_user_id;
END ;
-- =============================================================================
-- ░░  LEAVE REQUESTS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_leave_requests ;
CREATE PROCEDURE sp_list_leave_requests (
  IN p_employee_id INT, IN p_status VARCHAR(30), IN p_leave_type_id INT,
  IN p_department_id INT, IN p_reporting_to INT, IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT lr.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, lt.leave_type_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e   ON e.employee_id   = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv  ON rv.employee_id  = lr.reviewed_by
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to)
   ORDER BY lr.applied_on DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM leave_requests lr
    JOIN employees e ON e.employee_id = lr.employee_id
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to);
END ;
DROP PROCEDURE IF EXISTS sp_get_leave_request ;
CREATE PROCEDURE sp_get_leave_request (IN p_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_get_leave_balances ;
CREATE PROCEDURE sp_get_leave_balances (IN p_employee_id INT, IN p_year INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_cancel_leave_request ;
CREATE PROCEDURE sp_cancel_leave_request (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_leave_summary ;
CREATE PROCEDURE sp_get_leave_summary (IN p_year INT, IN p_department_id INT, IN p_status VARCHAR(30))
BEGIN
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.employee_status, e.emp_joining_date, e.confirmation_date,
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
END ;
DROP PROCEDURE IF EXISTS sp_apply_leave ;
CREATE PROCEDURE sp_apply_leave (
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
END ;
DROP PROCEDURE IF EXISTS sp_review_leave_request ;
CREATE PROCEDURE sp_review_leave_request (
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
END ;
DROP PROCEDURE IF EXISTS sp_upsert_leave_balance ;
CREATE PROCEDURE sp_upsert_leave_balance (
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
END ;
-- =============================================================================
-- ░░  ATTENDANCE  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_attendance ;
CREATE PROCEDURE sp_list_attendance (
  IN p_employee_id  INT, IN p_department_id INT, IN p_from_date DATE,
  IN p_to_date      DATE, IN p_status VARCHAR(20), IN p_reporting_to INT,
  IN p_limit INT, IN p_offset INT
)
BEGIN
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
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
   WHERE (p_reporting_to  IS NULL OR e.reporting_to   = p_reporting_to)
     AND (p_employee_id   IS NULL OR a.employee_id    = p_employee_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_from_date     IS NULL OR a.attendance_date >= p_from_date)
     AND (p_to_date       IS NULL OR a.attendance_date <= p_to_date)
     AND (p_status        IS NULL OR a.status         = p_status);
END ;
DROP PROCEDURE IF EXISTS sp_get_today_attendance ;
CREATE PROCEDURE sp_get_today_attendance (IN p_employee_id INT)
BEGIN
  SELECT a.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE a.employee_id = p_employee_id AND a.attendance_date = CURDATE();
END ;
DROP PROCEDURE IF EXISTS sp_get_monthly_attendance ;
CREATE PROCEDURE sp_get_monthly_attendance (IN p_employee_id INT, IN p_month INT, IN p_year INT)
BEGIN
  SELECT a.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE a.employee_id = p_employee_id
     AND MONTH(a.attendance_date) = p_month
     AND YEAR(a.attendance_date)  = p_year
   ORDER BY a.attendance_date ASC;
END ;
-- =============================================================================
-- ░░  HELPDESK TICKETS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_helpdesk_tickets ;
CREATE PROCEDURE sp_list_helpdesk_tickets (
  IN p_employee_id INT, IN p_status VARCHAR(30), IN p_priority VARCHAR(20),
  IN p_category VARCHAR(50), IN p_assigned_to INT, IN p_forwarded_to_team VARCHAR(50),
  IN p_search VARCHAR(200), IN p_limit INT, IN p_offset INT
)
BEGIN
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
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

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
END ;
DROP PROCEDURE IF EXISTS sp_list_team_helpdesk ;
CREATE PROCEDURE sp_list_team_helpdesk (
  IN p_manager_id INT, IN p_status VARCHAR(30), IN p_priority VARCHAR(20),
  IN p_category VARCHAR(50), IN p_search VARCHAR(200), IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT t.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS assigned_to_name
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
    LEFT JOIN employees a ON a.employee_id = t.assigned_to
   WHERE e.reporting_to = p_manager_id
     AND (p_status   IS NULL OR t.status   = p_status)
     AND (p_priority IS NULL OR t.priority = p_priority)
     AND (p_category IS NULL OR t.category = p_category)
     AND (p_search   IS NULL OR t.subject LIKE CONCAT('%',p_search,'%'))
   ORDER BY t.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
   WHERE e.reporting_to = p_manager_id
     AND (p_status   IS NULL OR t.status   = p_status)
     AND (p_priority IS NULL OR t.priority = p_priority)
     AND (p_category IS NULL OR t.category = p_category)
     AND (p_search   IS NULL OR t.subject LIKE CONCAT('%',p_search,'%'));
END ;
DROP PROCEDURE IF EXISTS sp_get_ticket_with_comments ;
CREATE PROCEDURE sp_get_ticket_with_comments (IN p_ticket_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_update_ticket_status ;
CREATE PROCEDURE sp_update_ticket_status (IN p_ticket_id INT, IN p_status VARCHAR(30))
BEGIN
  IF p_status IN ('Resolved','Closed','Rejected') THEN
    UPDATE helpdesk_tickets SET status = p_status, resolved_at = NOW() WHERE ticket_id = p_ticket_id;
  ELSE
    UPDATE helpdesk_tickets SET status = p_status, resolved_at = NULL WHERE ticket_id = p_ticket_id;
  END IF;
END ;
DROP PROCEDURE IF EXISTS sp_assign_ticket ;
CREATE PROCEDURE sp_assign_ticket (IN p_ticket_id INT, IN p_assigned_to INT)
BEGIN
  UPDATE helpdesk_tickets SET assigned_to = p_assigned_to WHERE ticket_id = p_ticket_id;
END ;
DROP PROCEDURE IF EXISTS sp_add_helpdesk_comment ;
CREATE PROCEDURE sp_add_helpdesk_comment (
  IN p_ticket_id INT, IN p_commented_by INT, IN p_comment TEXT
)
BEGIN
  INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (p_ticket_id, p_commented_by, p_comment);
  SELECT LAST_INSERT_ID() AS comment_id;
END ;
-- =============================================================================
-- ░░  RESIGNATION  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_my_resignations ;
CREATE PROCEDURE sp_get_my_resignations (IN p_employee_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_submit_resignation ;
CREATE PROCEDURE sp_submit_resignation (
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
END ;
DROP PROCEDURE IF EXISTS sp_withdraw_resignation ;
CREATE PROCEDURE sp_withdraw_resignation (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_team_resignations ;
CREATE PROCEDURE sp_get_team_resignations (IN p_manager_id INT, IN p_status VARCHAR(30))
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
END ;
DROP PROCEDURE IF EXISTS sp_manager_review_resignation ;
CREATE PROCEDURE sp_manager_review_resignation (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_all_resignations ;
CREATE PROCEDURE sp_get_all_resignations (
  IN p_status VARCHAR(30)  COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(200) COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.emp_code, e.emp_job_title AS job_title, d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e       ON e.employee_id  = r.employee_id
    LEFT JOIN departments d   ON d.department_id = e.department_id
    LEFT JOIN employees rev   ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr   ON mgr.employee_id = r.manager_reviewed_by
   WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
     AND (p_search IS NULL
          OR CONCAT(e.first_name,' ',e.last_name) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%')
          OR e.emp_code        COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%')
          OR d.department_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%'))
   ORDER BY r.created_at DESC;
END ;
DROP PROCEDURE IF EXISTS sp_admin_review_resignation ;
CREATE PROCEDURE sp_admin_review_resignation (
  IN p_admin_id INT, IN p_resignation_id INT, IN p_status VARCHAR(20), IN p_remarks TEXT
)
BEGIN
  UPDATE resignations SET status = p_status, admin_remarks = p_remarks,
         reviewed_by = p_admin_id, reviewed_at = NOW()
   WHERE resignation_id = p_resignation_id;
  SELECT ROW_COUNT() AS affected;
END ;
DROP PROCEDURE IF EXISTS sp_get_resignation_by_id ;
CREATE PROCEDURE sp_get_resignation_by_id (IN p_resignation_id INT)
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
END ;
-- =============================================================================
-- ░░  WORK SCHEDULE  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_work_schedules ;
CREATE PROCEDURE sp_list_work_schedules ()
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
END ;
DROP PROCEDURE IF EXISTS sp_get_work_schedule ;
CREATE PROCEDURE sp_get_work_schedule (IN p_employee_id INT)
BEGIN
  SELECT ws.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, e.employee_status, d.department_name
    FROM employee_work_schedules ws
    JOIN employees e ON e.employee_id = ws.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE ws.employee_id = p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_upsert_work_schedule ;
CREATE PROCEDURE sp_upsert_work_schedule (
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
END ;
DROP PROCEDURE IF EXISTS sp_delete_work_schedule ;
CREATE PROCEDURE sp_delete_work_schedule (IN p_employee_id INT)
BEGIN
  DELETE FROM employee_work_schedules WHERE employee_id = p_employee_id;
  SELECT ROW_COUNT() AS affected;
END ;
-- =============================================================================
-- ░░  IT DECLARATION  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_latest_it_cycle ;
CREATE PROCEDURE sp_get_latest_it_cycle ()
BEGIN
  SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
    FROM it_declaration_cycles c
    LEFT JOIN employees e ON e.employee_id = c.created_by
   ORDER BY c.cycle_id DESC LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_all_it_cycles ;
CREATE PROCEDURE sp_get_all_it_cycles ()
BEGIN
  SELECT * FROM it_declaration_cycles ORDER BY cycle_id DESC;
END ;
DROP PROCEDURE IF EXISTS sp_create_it_cycle ;
CREATE PROCEDURE sp_create_it_cycle (
  IN  p_admin_id       INT,
  IN  p_fy_label       VARCHAR(50),
  IN  p_fy_start_year  INT,
  IN  p_start_date     DATE,
  IN  p_end_date       DATE,
  OUT p_cycle_id       INT
)
BEGIN
  INSERT INTO it_declaration_cycles (fy_label, fy_start_year, start_date, end_date, created_by)
  VALUES (p_fy_label, p_fy_start_year, p_start_date, p_end_date, p_admin_id);
  SET p_cycle_id = LAST_INSERT_ID();
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_update_it_cycle ;
CREATE PROCEDURE sp_update_it_cycle (
  IN p_cycle_id   INT,
  IN p_fy_label   VARCHAR(50),
  IN p_start_date DATE,
  IN p_end_date   DATE
)
BEGIN
  UPDATE it_declaration_cycles
     SET fy_label   = COALESCE(p_fy_label,   fy_label),
         start_date = COALESCE(p_start_date, start_date),
         end_date   = COALESCE(p_end_date,   end_date)
   WHERE cycle_id   = p_cycle_id;
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_toggle_it_cycle_status ;
CREATE PROCEDURE sp_toggle_it_cycle_status (IN p_cycle_id INT, IN p_admin_id INT)
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
  UPDATE it_declaration_cycles SET status = 'inactive';
  IF v_status = 'active' THEN
    UPDATE it_declaration_cycles SET status = 'inactive', created_by = p_admin_id WHERE cycle_id = p_cycle_id;
  ELSE
    UPDATE it_declaration_cycles SET status = 'active', created_by = p_admin_id WHERE cycle_id = p_cycle_id;
  END IF;
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_or_create_it_declaration ;
CREATE PROCEDURE sp_get_or_create_it_declaration (
  IN p_employee_id INT, IN p_cycle_id INT, OUT p_declaration_id INT
)
BEGIN
  SELECT declaration_id INTO p_declaration_id
    FROM it_declarations WHERE employee_id = p_employee_id AND cycle_id = p_cycle_id LIMIT 1;
  IF p_declaration_id IS NULL THEN
    INSERT INTO it_declarations (cycle_id, employee_id) VALUES (p_cycle_id, p_employee_id);
    SET p_declaration_id = LAST_INSERT_ID();
  END IF;
  SELECT * FROM it_declarations WHERE declaration_id = p_declaration_id;
END ;
-- =============================================================================
-- ░░  APPRAISAL  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_active_appraisal_cycle ;
CREATE PROCEDURE sp_get_active_appraisal_cycle ()
BEGIN
  SELECT * FROM appraisal_cycles WHERE status = 'active' ORDER BY cycle_id DESC LIMIT 1;
  -- also return latest cycle for fallback (result set 2)
  SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_all_appraisal_cycles ;
CREATE PROCEDURE sp_get_all_appraisal_cycles ()
BEGIN
  SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC;
END ;
DROP PROCEDURE IF EXISTS sp_create_appraisal_cycle ;
CREATE PROCEDURE sp_create_appraisal_cycle (
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
END ;
DROP PROCEDURE IF EXISTS sp_update_appraisal_cycle ;
CREATE PROCEDURE sp_update_appraisal_cycle (
  IN p_cycle_id INT, IN p_fy_label VARCHAR(50), IN p_deadline DATE, IN p_cycle_type VARCHAR(30)
)
BEGIN
  UPDATE appraisal_cycles
     SET fy_label   = COALESCE(p_fy_label,    fy_label),
         deadline   = COALESCE(p_deadline,     deadline),
         cycle_type = COALESCE(p_cycle_type,   cycle_type)
   WHERE cycle_id = p_cycle_id;
  SELECT * FROM appraisal_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_rollout_appraisal_cycle ;
CREATE PROCEDURE sp_rollout_appraisal_cycle (
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
END ;
DROP PROCEDURE IF EXISTS sp_disable_appraisal_cycle ;
CREATE PROCEDURE sp_disable_appraisal_cycle (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_appraisal_enrollments ;
CREATE PROCEDURE sp_get_appraisal_enrollments (IN p_cycle_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_enroll_employee_appraisal ;
CREATE PROCEDURE sp_enroll_employee_appraisal (IN p_cycle_id INT, IN p_employee_id INT, IN p_admin_id INT)
BEGIN
  INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by)
  VALUES (p_cycle_id, p_employee_id, p_admin_id);
END ;
DROP PROCEDURE IF EXISTS sp_unenroll_employee_appraisal ;
CREATE PROCEDURE sp_unenroll_employee_appraisal (IN p_cycle_id INT, IN p_employee_id INT)
BEGIN
  DELETE FROM appraisal_enrollments WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id;
  SELECT ROW_COUNT() AS affected;
END ;
DROP PROCEDURE IF EXISTS sp_get_my_appraisal ;
CREATE PROCEDURE sp_get_my_appraisal (IN p_employee_id INT, IN p_cycle_id INT)
BEGIN
  -- appraisal record
  SELECT * FROM self_appraisals WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id;
  -- ratings
  SELECT ar.* FROM appraisal_ratings ar
    JOIN self_appraisals sa ON sa.appraisal_id = ar.appraisal_id
   WHERE sa.cycle_id = p_cycle_id AND sa.employee_id = p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_save_appraisal_rating ;
CREATE PROCEDURE sp_save_appraisal_rating (
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
END ;
DROP PROCEDURE IF EXISTS sp_submit_appraisal ;
CREATE PROCEDURE sp_submit_appraisal (IN p_appraisal_id INT, IN p_overall_comments TEXT)
BEGIN
  UPDATE self_appraisals
     SET overall_comments = p_overall_comments, status = 'submitted', submitted_at = NOW()
   WHERE appraisal_id = p_appraisal_id;
END ;
DROP PROCEDURE IF EXISTS sp_save_manager_appraisal_rating ;
CREATE PROCEDURE sp_save_manager_appraisal_rating (
  IN p_appraisal_id  INT,
  IN p_parameter_key VARCHAR(50),
  IN p_mgr_rating    TINYINT,
  IN p_mgr_comments  TEXT
)
BEGIN
  UPDATE appraisal_ratings
     SET manager_rating = p_mgr_rating, manager_comments = p_mgr_comments
   WHERE appraisal_id = p_appraisal_id AND parameter_key = p_parameter_key;
END ;
DROP PROCEDURE IF EXISTS sp_get_team_appraisals ;
CREATE PROCEDURE sp_get_team_appraisals (IN p_manager_id INT, IN p_cycle_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_get_all_appraisals ;
CREATE PROCEDURE sp_get_all_appraisals (IN p_cycle_id INT, IN p_status VARCHAR(20), IN p_department_id INT)
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

  -- Enrolled employees who haven't started
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
END ;
DROP PROCEDURE IF EXISTS sp_update_appraisal_status ;
CREATE PROCEDURE sp_update_appraisal_status (IN p_appraisal_id INT, IN p_status VARCHAR(20))
BEGIN
  UPDATE self_appraisals SET status = p_status WHERE appraisal_id = p_appraisal_id;
  SELECT sa.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM self_appraisals sa
    JOIN employees e ON e.employee_id = sa.employee_id
   WHERE sa.appraisal_id = p_appraisal_id;
END ;
-- =============================================================================
-- ░░  TIMESHEET / TASKS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_create_task ;
CREATE PROCEDURE sp_create_task (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_task ;
CREATE PROCEDURE sp_get_task (IN p_task_id INT)
BEGIN
  SELECT * FROM employee_tasks WHERE task_id = p_task_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_my_tasks ;
CREATE PROCEDURE sp_list_my_tasks (IN p_employee_id INT)
BEGIN
  SELECT * FROM employee_tasks WHERE employee_id = p_employee_id ORDER BY created_at DESC;
END ;
DROP PROCEDURE IF EXISTS sp_delete_task ;
CREATE PROCEDURE sp_delete_task (IN p_task_id INT, IN p_employee_id INT, OUT p_affected INT)
BEGIN
  DELETE FROM employee_tasks WHERE task_id = p_task_id AND employee_id = p_employee_id;
  SET p_affected = ROW_COUNT();
END ;
DROP PROCEDURE IF EXISTS sp_get_weekly_timesheet ;
CREATE PROCEDURE sp_get_weekly_timesheet (
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
END ;
DROP PROCEDURE IF EXISTS sp_submit_timesheet ;
CREATE PROCEDURE sp_submit_timesheet (
  IN p_employee_id INT, IN p_timesheet_id INT, OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(20); DECLARE v_emp INT;
  SELECT status, employee_id INTO v_status, v_emp
    FROM weekly_timesheets WHERE timesheet_id = p_timesheet_id LIMIT 1;
  IF v_emp IS NULL THEN SET p_ok=0; SET p_msg='Timesheet not found';
  ELSEIF v_emp != p_employee_id THEN SET p_ok=0; SET p_msg='Not your timesheet';
  ELSEIF v_status NOT IN ('draft','rejected') THEN SET p_ok=0; SET p_msg=CONCAT('Already ',v_status);
  ELSE
    UPDATE weekly_timesheets SET status='submitted', submitted_at=NOW() WHERE timesheet_id=p_timesheet_id;
    UPDATE timesheet_entries SET locked=1 WHERE timesheet_id=p_timesheet_id;
    SET p_ok=1; SET p_msg='submitted';
  END IF;
END ;
DROP PROCEDURE IF EXISTS sp_review_timesheet ;
CREATE PROCEDURE sp_review_timesheet (
  IN p_timesheet_id INT, IN p_decision VARCHAR(20), IN p_reviewed_by INT, IN p_comments TEXT,
  OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT status INTO v_status FROM weekly_timesheets WHERE timesheet_id = p_timesheet_id LIMIT 1;
  IF v_status IS NULL THEN SET p_ok=0; SET p_msg='Timesheet not found';
  ELSEIF v_status != 'submitted' THEN SET p_ok=0; SET p_msg='Not in submitted state';
  ELSE
    UPDATE weekly_timesheets SET status=p_decision, reviewed_by=p_reviewed_by,
           reviewed_at=NOW(), comments=p_comments WHERE timesheet_id=p_timesheet_id;
    IF p_decision = 'approved' THEN
      UPDATE employee_tasks SET status='in_timesheet'
       WHERE task_id IN (SELECT DISTINCT task_id FROM timesheet_entries WHERE timesheet_id=p_timesheet_id AND task_id IS NOT NULL);
    END IF;
    SET p_ok=1; SET p_msg=p_decision;
  END IF;
END ;
-- =============================================================================
-- ░░  PAYSLIP  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_payslips ;
CREATE PROCEDURE sp_list_payslips (
  IN p_employee_id   INT, IN p_month INT, IN p_year INT, IN p_status VARCHAR(20),
  IN p_department_id INT, IN p_payroll_run_id INT, IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT p.*,
         ROUND(p.gross_earnings + LEAST(p.basic, 15000) * 0.12, 2) AS ctc_computed,
         e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, des.designation_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE (p_employee_id   IS NULL OR p.employee_id    = p_employee_id)
     AND (p_month         IS NULL OR p.month          = p_month)
     AND (p_year          IS NULL OR p.year           = p_year)
     AND (p_status        IS NULL OR p.status         = p_status)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_payroll_run_id IS NULL OR p.payroll_run_id = p_payroll_run_id)
   ORDER BY p.year DESC, p.month DESC, e.first_name ASC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
   WHERE (p_employee_id   IS NULL OR p.employee_id    = p_employee_id)
     AND (p_month         IS NULL OR p.month          = p_month)
     AND (p_year          IS NULL OR p.year           = p_year)
     AND (p_status        IS NULL OR p.status         = p_status)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (p_payroll_run_id IS NULL OR p.payroll_run_id = p_payroll_run_id);
END ;
DROP PROCEDURE IF EXISTS sp_get_payslip ;
CREATE PROCEDURE sp_get_payslip (IN p_payslip_id INT)
BEGIN
  SELECT p.*,
         ROUND(p.gross_earnings + LEAST(p.basic, 15000) * 0.12, 2) AS ctc_computed,
         e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, des.designation_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments  d   ON d.department_id   = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
   WHERE p.payslip_id = p_payslip_id;
END ;
DROP PROCEDURE IF EXISTS sp_mark_payslip_paid ;
CREATE PROCEDURE sp_mark_payslip_paid (IN p_payslip_id INT)
BEGIN
  UPDATE payslips SET status = 'Paid' WHERE payslip_id = p_payslip_id;
  SELECT ROW_COUNT() AS affected;
END ;
-- =============================================================================
-- ░░  SALARY STRUCTURE  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_salary_structures ;
CREATE PROCEDURE sp_list_salary_structures (IN p_employee_id INT, IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT s.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM salary_structures s
    JOIN employees e ON e.employee_id = s.employee_id
   WHERE (p_employee_id IS NULL OR s.employee_id = p_employee_id)
   ORDER BY s.effective_from DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM salary_structures s
   WHERE (p_employee_id IS NULL OR s.employee_id = p_employee_id);
END ;
DROP PROCEDURE IF EXISTS sp_get_latest_salary_structure ;
CREATE PROCEDURE sp_get_latest_salary_structure (IN p_employee_id INT)
BEGIN
  SELECT s.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM salary_structures s
    JOIN employees e ON e.employee_id = s.employee_id
   WHERE s.employee_id = p_employee_id
   ORDER BY s.effective_from DESC LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_salary_structure ;
CREATE PROCEDURE sp_get_salary_structure (IN p_id INT)
BEGIN
  SELECT s.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM salary_structures s
    JOIN employees e ON e.employee_id = s.employee_id
   WHERE s.id = p_id;
END ;
-- =============================================================================
-- ░░  REVIEW  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_reviews ;
CREATE PROCEDURE sp_list_reviews (
  IN p_employee_id INT, IN p_reviewer_id INT, IN p_status VARCHAR(30),
  IN p_review_type_id INT, IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT r.*, rt.name AS review_type_name, rt.frequency,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM reviews r
    JOIN review_types rt ON rt.review_type_id = r.review_type_id
    JOIN employees e     ON e.employee_id      = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id   = r.reviewer_id
   WHERE (p_employee_id    IS NULL OR r.employee_id    = p_employee_id)
     AND (p_reviewer_id    IS NULL OR r.reviewer_id    = p_reviewer_id)
     AND (p_status         IS NULL OR r.status         = p_status)
     AND (p_review_type_id IS NULL OR r.review_type_id = p_review_type_id)
   ORDER BY r.due_date DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM reviews r
   WHERE (p_employee_id    IS NULL OR r.employee_id    = p_employee_id)
     AND (p_reviewer_id    IS NULL OR r.reviewer_id    = p_reviewer_id)
     AND (p_status         IS NULL OR r.status         = p_status)
     AND (p_review_type_id IS NULL OR r.review_type_id = p_review_type_id);
END ;
DROP PROCEDURE IF EXISTS sp_get_review ;
CREATE PROCEDURE sp_get_review (IN p_review_id INT)
BEGIN
  SELECT r.*, rt.name AS review_type_name, rt.frequency,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM reviews r
    JOIN review_types rt ON rt.review_type_id = r.review_type_id
    JOIN employees e     ON e.employee_id      = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id   = r.reviewer_id
   WHERE r.review_id = p_review_id;
END ;
DROP PROCEDURE IF EXISTS sp_submit_review ;
CREATE PROCEDURE sp_submit_review (IN p_review_id INT, IN p_overall_rating TINYINT, IN p_comments TEXT)
BEGIN
  UPDATE reviews SET overall_rating = p_overall_rating, comments = p_comments,
         status = 'Submitted', submitted_on = NOW()
   WHERE review_id = p_review_id;
END ;
DROP PROCEDURE IF EXISTS sp_complete_review ;
CREATE PROCEDURE sp_complete_review (IN p_review_id INT)
BEGIN
  UPDATE reviews SET status = 'Completed' WHERE review_id = p_review_id;
END ;
-- =============================================================================
-- ░░  WORKFLOW DELEGATION  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_delegations ;
CREATE PROCEDURE sp_list_delegations (
  IN p_delegator_id INT, IN p_status VARCHAR(20), IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT wd.*,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegator_name,
         CONCAT(dt.first_name,' ',IFNULL(dt.last_name,'')) AS delegate_name
    FROM workflow_delegations wd
    LEFT JOIN employees d  ON d.employee_id  = wd.delegator_id
    LEFT JOIN employees dt ON dt.employee_id = wd.delegate_id
   WHERE (p_delegator_id IS NULL OR wd.delegator_id = p_delegator_id)
     AND (p_status       IS NULL OR wd.status       = p_status)
   ORDER BY wd.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM workflow_delegations wd
   WHERE (p_delegator_id IS NULL OR wd.delegator_id = p_delegator_id)
     AND (p_status       IS NULL OR wd.status       = p_status);
END ;
DROP PROCEDURE IF EXISTS sp_get_delegation ;
CREATE PROCEDURE sp_get_delegation (IN p_id INT)
BEGIN
  SELECT wd.*,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegator_name,
         CONCAT(dt.first_name,' ',IFNULL(dt.last_name,'')) AS delegate_name
    FROM workflow_delegations wd
    LEFT JOIN employees d  ON d.employee_id  = wd.delegator_id
    LEFT JOIN employees dt ON dt.employee_id = wd.delegate_id
   WHERE wd.id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_cancel_delegation ;
CREATE PROCEDURE sp_cancel_delegation (IN p_id INT)
BEGIN
  UPDATE workflow_delegations SET status = 'Cancelled' WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END ;
-- =============================================================================
-- ░░  DEPARTMENT / DESIGNATION (SIMPLE LOOKUPS)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_departments ;
CREATE PROCEDURE sp_get_departments ()
BEGIN
  SELECT * FROM departments ORDER BY department_name;
END ;
DROP PROCEDURE IF EXISTS sp_get_designations ;
CREATE PROCEDURE sp_get_designations (IN p_department_id INT)
BEGIN
  SELECT * FROM designations
   WHERE (p_department_id IS NULL OR department_id = p_department_id)
   ORDER BY designation_name;
END ;
-- =============================================================================
-- ░░  DASHBOARD COUNTS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_employee_dashboard ;
CREATE PROCEDURE sp_employee_dashboard (IN p_employee_id INT)
BEGIN
  SELECT SUM(status='approved') AS approved, SUM(status='submitted') AS pending,
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
END ;
DROP PROCEDURE IF EXISTS sp_admin_dashboard ;
CREATE PROCEDURE sp_admin_dashboard ()
BEGIN
  SELECT SUM(status='submitted') AS pending_timesheets,
         SUM(status='approved')  AS approved_timesheets,
         COUNT(*)                AS total_timesheets
    FROM weekly_timesheets;

  SELECT (SELECT COUNT(*) FROM employees WHERE employee_status='Active') AS active_employees,
         (SELECT COUNT(*) FROM leave_requests WHERE status='Pending')    AS pending_leaves,
         (SELECT COUNT(*) FROM helpdesk_tickets WHERE status='Open')     AS open_tickets;
END ;
-- =============================================================================
-- ░░  MFA (HASH-BASED TOKEN FLOW)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_issue_mfa_temp_token_hash ;
CREATE PROCEDURE sp_issue_mfa_temp_token_hash (
  IN p_user_id    INT,
  IN p_token_hash VARCHAR(64),
  IN p_expires_at DATETIME
)
BEGIN
  DELETE FROM mfa_temp_tokens WHERE user_id = p_user_id OR expires_at < NOW();
  INSERT INTO mfa_temp_tokens (user_id, token_hash, expires_at) VALUES (p_user_id, p_token_hash, p_expires_at);
END ;
DROP PROCEDURE IF EXISTS sp_consume_mfa_temp_token ;
CREATE PROCEDURE sp_consume_mfa_temp_token (IN p_token_hash VARCHAR(64), OUT p_user_id INT)
BEGIN
  DECLARE v_id INT;
  SELECT id, user_id INTO v_id, p_user_id
    FROM mfa_temp_tokens WHERE token_hash = p_token_hash AND used = 0 AND expires_at > NOW() LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE mfa_temp_tokens SET used = 1 WHERE id = v_id;
  ELSE
    SET p_user_id = NULL;
  END IF;
END ;
DROP PROCEDURE IF EXISTS sp_get_user_mfa ;
CREATE PROCEDURE sp_get_user_mfa (IN p_user_id INT)
BEGIN
  SELECT email, mfa_enabled, mfa_secret, mfa_backup_codes FROM users WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_setup_mfa_secret ;
CREATE PROCEDURE sp_setup_mfa_secret (IN p_user_id INT, IN p_encrypted_secret VARCHAR(500))
BEGIN
  UPDATE users SET mfa_secret = p_encrypted_secret WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_enable_mfa_with_backup ;
CREATE PROCEDURE sp_enable_mfa_with_backup (IN p_user_id INT, IN p_backup_codes_json TEXT)
BEGIN
  UPDATE users SET mfa_enabled = 1, mfa_backup_codes = p_backup_codes_json WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_update_mfa_backup_codes ;
CREATE PROCEDURE sp_update_mfa_backup_codes (IN p_user_id INT, IN p_backup_codes_json TEXT)
BEGIN
  UPDATE users SET mfa_backup_codes = p_backup_codes_json WHERE user_id = p_user_id;
END ;
DROP PROCEDURE IF EXISTS sp_disable_mfa_full ;
CREATE PROCEDURE sp_disable_mfa_full (IN p_user_id INT)
BEGIN
  UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL WHERE user_id = p_user_id;
END ;
-- =============================================================================
-- ░░  APPRAISAL — ADDITIONAL  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_is_enrolled ;
CREATE PROCEDURE sp_is_enrolled (IN p_cycle_id INT, IN p_employee_id INT)
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM appraisal_enrollments WHERE cycle_id = p_cycle_id AND employee_id = p_employee_id
  ) AS enrolled;
END ;
DROP PROCEDURE IF EXISTS sp_get_or_create_appraisal ;
CREATE PROCEDURE sp_get_or_create_appraisal (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_appraisal ;
CREATE PROCEDURE sp_get_appraisal (IN p_appraisal_id INT)
BEGIN
  SELECT sa.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.reporting_to
    FROM self_appraisals sa
    JOIN employees e ON e.employee_id = sa.employee_id
   WHERE sa.appraisal_id = p_appraisal_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_appraisal_ratings ;
CREATE PROCEDURE sp_get_appraisal_ratings (IN p_appraisal_id INT)
BEGIN
  SELECT * FROM appraisal_ratings WHERE appraisal_id = p_appraisal_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_appraisal_ratings_summary ;
CREATE PROCEDURE sp_get_appraisal_ratings_summary (IN p_appraisal_id INT)
BEGIN
  SELECT self_rating, manager_rating FROM appraisal_ratings WHERE appraisal_id = p_appraisal_id;
END ;
-- =============================================================================
-- ░░  HELPDESK — ADDITIONAL ACTIONS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_action_ticket ;
CREATE PROCEDURE sp_manager_action_ticket (
  IN  p_manager_id     INT,
  IN  p_ticket_id      INT,
  IN  p_action         VARCHAR(20),
  IN  p_forward_team   VARCHAR(50),
  IN  p_comment        TEXT,
  OUT p_ok             TINYINT,
  OUT p_msg            VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(30); DECLARE v_cnt INT DEFAULT 0;
  SELECT COUNT(*) INTO v_cnt FROM helpdesk_tickets t
    JOIN employees e ON e.employee_id = t.employee_id
   WHERE t.ticket_id = p_ticket_id AND e.reporting_to = p_manager_id;
  IF v_cnt = 0 THEN SET p_ok=0; SET p_msg='Ticket does not belong to your team'; RETURN; END IF;
  SELECT status INTO v_status FROM helpdesk_tickets WHERE ticket_id = p_ticket_id LIMIT 1;
  IF v_status != 'Open' THEN SET p_ok=0; SET p_msg='Only Open tickets can be actioned by manager'; RETURN; END IF;
  IF p_action = 'approve' THEN
    UPDATE helpdesk_tickets SET status='Forwarded', forwarded_to_team=p_forward_team WHERE ticket_id=p_ticket_id;
    INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (p_ticket_id, p_manager_id, p_comment);
  ELSE
    UPDATE helpdesk_tickets SET status='Rejected', resolved_at=NOW() WHERE ticket_id=p_ticket_id;
    INSERT INTO helpdesk_comments (ticket_id, commented_by, comment) VALUES (p_ticket_id, p_manager_id, p_comment);
  END IF;
  SET p_ok=1; SET p_msg='OK';
END ;
DROP PROCEDURE IF EXISTS sp_close_ticket ;
CREATE PROCEDURE sp_close_ticket (
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
END ;
DROP PROCEDURE IF EXISTS sp_reopen_ticket ;
CREATE PROCEDURE sp_reopen_ticket (
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
END ;
-- =============================================================================
-- ░░  LEAVE — ADDITIONAL (all balances, accrue, adjust, init year)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_all_leave_balances ;
CREATE PROCEDURE sp_all_leave_balances (IN p_year INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_adjust_leave_balance ;
CREATE PROCEDURE sp_adjust_leave_balance (
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
END ;
DROP PROCEDURE IF EXISTS sp_init_leave_balances_year ;
CREATE PROCEDURE sp_init_leave_balances_year (IN p_year INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_accrue_earned_leave ;
CREATE PROCEDURE sp_accrue_earned_leave (IN p_month INT, IN p_year INT)
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
END ;
-- =============================================================================
-- ░░  SALARY STRUCTURE — ENCRYPTION HELPERS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_update_salary_encrypted ;
CREATE PROCEDURE sp_update_salary_encrypted (IN p_id INT, IN p_encrypted_blob TEXT)
BEGIN
  UPDATE salary_structures SET
    salary_encrypted  = p_encrypted_blob,
    basic             = NULL, hra              = NULL, conveyance      = NULL,
    medical_allowance = NULL, special_allowance = NULL,
    pf_employee       = NULL, pf_employer      = NULL,
    professional_tax  = NULL, income_tax       = NULL, ctc             = NULL
  WHERE id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_salary_structure_raw ;
CREATE PROCEDURE sp_get_salary_structure_raw (IN p_id INT)
BEGIN
  SELECT * FROM salary_structures WHERE id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_find_employee_by_empcode ;
CREATE PROCEDURE sp_find_employee_by_empcode (IN p_emp_code VARCHAR(30))
BEGIN
  SELECT employee_id FROM employees WHERE emp_code = p_emp_code LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_find_salary_structure ;
CREATE PROCEDURE sp_find_salary_structure (IN p_employee_id INT, IN p_effective_from DATE)
BEGIN
  SELECT id FROM salary_structures
   WHERE employee_id = p_employee_id AND effective_from = p_effective_from LIMIT 1;
END ;
-- =============================================================================
-- ░░  WORKFLOW DELEGATE  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_workflow_delegates ;
CREATE PROCEDURE sp_list_workflow_delegates (
  IN p_employee_id INT, IN p_status VARCHAR(20), IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT wd.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegate_name
    FROM workflow_delegates wd
    JOIN employees e ON e.employee_id = wd.employee_id
    JOIN employees d ON d.employee_id = wd.delegate_employee_id
   WHERE (p_employee_id IS NULL
          OR wd.employee_id = p_employee_id
          OR wd.delegate_employee_id = p_employee_id)
     AND (p_status IS NULL OR wd.status = p_status)
   ORDER BY wd.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM workflow_delegates wd
   WHERE (p_employee_id IS NULL
          OR wd.employee_id = p_employee_id
          OR wd.delegate_employee_id = p_employee_id)
     AND (p_status IS NULL OR wd.status = p_status);
END ;
DROP PROCEDURE IF EXISTS sp_get_workflow_delegate ;
CREATE PROCEDURE sp_get_workflow_delegate (IN p_id INT)
BEGIN
  SELECT wd.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegate_name
    FROM workflow_delegates wd
    JOIN employees e ON e.employee_id = wd.employee_id
    JOIN employees d ON d.employee_id = wd.delegate_employee_id
   WHERE wd.id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_cancel_workflow_delegate ;
CREATE PROCEDURE sp_cancel_workflow_delegate (IN p_id INT)
BEGIN
  UPDATE workflow_delegates SET status = 'Cancelled' WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END ;
-- =============================================================================
-- ░░  PAYROLL RUNS  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_payroll_runs ;
CREATE PROCEDURE sp_list_payroll_runs (
  IN p_year INT, IN p_status VARCHAR(20), IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT pr.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS processed_by_name
    FROM payroll_runs pr
    LEFT JOIN employees e ON e.employee_id = pr.processed_by
   WHERE (p_year   IS NULL OR pr.year   = p_year)
     AND (p_status IS NULL OR pr.status = p_status)
   ORDER BY pr.year DESC, pr.month DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM payroll_runs pr
   WHERE (p_year   IS NULL OR pr.year   = p_year)
     AND (p_status IS NULL OR pr.status = p_status);
END ;
DROP PROCEDURE IF EXISTS sp_get_payroll_run ;
CREATE PROCEDURE sp_get_payroll_run (IN p_id INT)
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
END ;
-- =============================================================================
-- ░░  TEAM  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_teams ;
CREATE PROCEDURE sp_list_teams (
  IN p_department_id INT, IN p_search VARCHAR(100), IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT t.*, d.department_name,
         CONCAT(le.first_name,' ',IFNULL(le.last_name,'')) AS lead_name,
         (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id=t.team_id) AS member_count
    FROM teams t
    LEFT JOIN departments d ON d.department_id=t.department_id
    LEFT JOIN employees le ON le.employee_id=t.lead_employee_id
   WHERE (p_department_id IS NULL OR t.department_id=p_department_id)
     AND (p_search        IS NULL OR t.team_name LIKE p_search)
   ORDER BY t.team_name ASC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);
END ;
DROP PROCEDURE IF EXISTS sp_count_teams ;
CREATE PROCEDURE sp_count_teams (IN p_department_id INT, IN p_search VARCHAR(100))
BEGIN
  SELECT COUNT(*) AS total FROM teams t
   WHERE (p_department_id IS NULL OR t.department_id=p_department_id)
     AND (p_search        IS NULL OR t.team_name LIKE p_search);
END ;
DROP PROCEDURE IF EXISTS sp_get_team_details ;
CREATE PROCEDURE sp_get_team_details (IN p_team_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_add_team_member ;
CREATE PROCEDURE sp_add_team_member (
  IN p_team_id INT, IN p_employee_id INT, IN p_title VARCHAR(100), IN p_is_lead TINYINT
)
BEGIN
  INSERT INTO team_members (team_id, employee_id, title, is_lead)
  VALUES (p_team_id, p_employee_id, p_title, p_is_lead)
  ON DUPLICATE KEY UPDATE title = p_title, is_lead = p_is_lead;
  IF p_is_lead = 1 THEN
    UPDATE teams SET lead_employee_id = p_employee_id WHERE team_id = p_team_id;
  END IF;
END ;
DROP PROCEDURE IF EXISTS sp_update_team_member ;
CREATE PROCEDURE sp_update_team_member (
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
END ;
DROP PROCEDURE IF EXISTS sp_remove_team_member ;
CREATE PROCEDURE sp_remove_team_member (IN p_team_id INT, IN p_employee_id INT)
BEGIN
  DECLARE v_cnt INT;
  SELECT COUNT(*) INTO v_cnt FROM team_members WHERE team_id=p_team_id AND employee_id=p_employee_id;
  IF v_cnt=0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Team member not found'; END IF;
  DELETE FROM team_members WHERE team_id=p_team_id AND employee_id=p_employee_id;
  UPDATE teams SET lead_employee_id=NULL WHERE team_id=p_team_id AND lead_employee_id=p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_check_employee_exists ;
CREATE PROCEDURE sp_check_employee_exists (IN p_employee_id INT)
BEGIN
  SELECT employee_id FROM employees WHERE employee_id = p_employee_id LIMIT 1;
END ;
-- =============================================================================
-- ░░  TIMESHEET (weekly timesheets, entries)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_my_timesheets ;
CREATE PROCEDURE sp_get_my_timesheets (IN p_employee_id INT)
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
    LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
   WHERE wt.employee_id = p_employee_id
   ORDER BY wt.week_start DESC;
END ;
DROP PROCEDURE IF EXISTS sp_get_timesheet ;
CREATE PROCEDURE sp_get_timesheet (IN p_timesheet_id INT)
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
    LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
   WHERE wt.timesheet_id = p_timesheet_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_timesheet_entries ;
CREATE PROCEDURE sp_get_timesheet_entries (IN p_timesheet_id INT)
BEGIN
  SELECT te.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name
    FROM timesheet_entries te
    JOIN employees e ON e.employee_id = te.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE te.timesheet_id = p_timesheet_id
   ORDER BY te.work_date, te.start_time;
END ;
DROP PROCEDURE IF EXISTS sp_save_timesheet_entries ;
CREATE PROCEDURE sp_save_timesheet_entries (
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

  -- Revert previously linked tasks to open
  UPDATE employee_tasks et
     JOIN timesheet_entries te ON te.task_id=et.task_id
    SET et.status='open'
  WHERE te.timesheet_id=p_timesheet_id AND te.task_id IS NOT NULL AND et.status='in_timesheet';

  -- Delete old entries
  DELETE FROM timesheet_entries WHERE timesheet_id=p_timesheet_id;

  -- Insert new entries from JSON
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

  -- Mark newly linked tasks as in_timesheet
  UPDATE employee_tasks et
     JOIN timesheet_entries te ON te.task_id=et.task_id
    SET et.status='in_timesheet'
  WHERE te.timesheet_id=p_timesheet_id AND te.task_id IS NOT NULL AND et.employee_id=p_employee_id;

  -- Update total hours
  UPDATE weekly_timesheets
     SET total_hours=(SELECT COALESCE(SUM(duration_hours),0) FROM timesheet_entries WHERE timesheet_id=p_timesheet_id)
   WHERE timesheet_id=p_timesheet_id;

  SET p_ok=1; SET p_msg='OK';
END ;
DROP PROCEDURE IF EXISTS sp_submit_timesheet ;
CREATE PROCEDURE sp_submit_timesheet (
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
END ;
DROP PROCEDURE IF EXISTS sp_list_manager_timesheets ;
CREATE PROCEDURE sp_list_manager_timesheets (IN p_manager_id INT, IN p_status VARCHAR(20))
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
END ;
DROP PROCEDURE IF EXISTS sp_list_all_timesheets ;
CREATE PROCEDURE sp_list_all_timesheets (IN p_status VARCHAR(20), IN p_employee_id INT)
BEGIN
  SELECT wt.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         d.department_name,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id=wt.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id
    LEFT JOIN employees m ON m.employee_id=wt.reviewed_by
   WHERE (p_status      IS NULL OR wt.status=p_status)
     AND (p_employee_id IS NULL OR wt.employee_id=p_employee_id)
   ORDER BY wt.submitted_at DESC, wt.week_start DESC;
END ;
DROP PROCEDURE IF EXISTS sp_review_timesheet ;
CREATE PROCEDURE sp_review_timesheet (
  IN p_timesheet_id INT, IN p_decision VARCHAR(20),
  IN p_reviewed_by INT, IN p_comments TEXT,
  OUT p_ok TINYINT, OUT p_msg VARCHAR(200)
)
BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_new_status VARCHAR(20);
  SELECT status INTO v_status FROM weekly_timesheets WHERE timesheet_id=p_timesheet_id LIMIT 1;
  IF v_status IS NULL THEN SET p_ok=0; SET p_msg='Timesheet not found'; LEAVE sp_review_timesheet;
  ELSEIF v_status != 'pending' THEN SET p_ok=0; SET p_msg=CONCAT('Cannot review a timesheet with status: ',v_status); LEAVE sp_review_timesheet;
  END IF;
  SET v_new_status = IF(p_decision='approved','approved','rejected');
  UPDATE weekly_timesheets SET status=v_new_status, reviewed_by=p_reviewed_by, reviewed_at=NOW(), comments=p_comments
   WHERE timesheet_id=p_timesheet_id;
  -- Sync task statuses via join (no dynamic IN needed)
  UPDATE employee_tasks et
     JOIN timesheet_entries te ON te.task_id=et.task_id
    SET et.status=IF(v_new_status='approved','completed','open')
  WHERE te.timesheet_id=p_timesheet_id AND te.task_id IS NOT NULL;
  SET p_ok=1; SET p_msg='OK';
END ;
DROP PROCEDURE IF EXISTS sp_manager_full_dashboard ;
CREATE PROCEDURE sp_manager_full_dashboard (IN p_manager_id INT)
BEGIN
  -- Result 1: team members
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS name,
         e.emp_job_title, d.department_name,
         EXISTS(SELECT 1 FROM resignations r WHERE r.employee_id=e.employee_id
                  AND r.status IN ('pending','rm_approved','accepted')) AS serving_notice
    FROM employees e
    LEFT JOIN departments d ON d.department_id=e.department_id
   WHERE e.reporting_to=p_manager_id AND e.employee_status='Active'
   ORDER BY e.first_name;

  -- Result 2: today's attendance for team
  SELECT a.employee_id, a.status, a.check_in, a.check_out, a.work_hours, a.late_by_minutes
    FROM attendance a
    JOIN employees e ON e.employee_id=a.employee_id
   WHERE e.reporting_to=p_manager_id AND a.attendance_date=CURDATE();

  -- Result 3: timesheet counts for team
  SELECT SUM(wt.status='pending') AS pending,
         SUM(wt.status='approved') AS approved,
         SUM(wt.status='rejected') AS rejected
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id=wt.employee_id
   WHERE e.reporting_to=p_manager_id;

  -- Result 4: recent activities
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
END ;
-- =============================================================================
-- ░░  EXTRA WORK REQUESTS (TIMESHEET)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_create_extra_work_request ;
CREATE PROCEDURE sp_create_extra_work_request (
  IN p_employee_id  INT, IN p_timesheet_id INT, IN p_work_date DATE,
  IN p_task_name    VARCHAR(200), IN p_extra_hours DECIMAL(5,2), IN p_reason TEXT,
  OUT p_id INT
)
BEGIN
  INSERT INTO extra_work_requests (employee_id, timesheet_id, work_date, task_name, extra_hours, reason)
  VALUES (p_employee_id, p_timesheet_id, p_work_date, p_task_name, p_extra_hours, p_reason);
  SET p_id = LAST_INSERT_ID();
  SELECT * FROM extra_work_requests WHERE extra_work_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_extra_work_requests ;
CREATE PROCEDURE sp_list_extra_work_requests (IN p_employee_id INT)
BEGIN
  SELECT ew.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
    FROM extra_work_requests ew
    JOIN employees e ON e.employee_id = ew.employee_id
   WHERE ew.employee_id = p_employee_id
   ORDER BY ew.created_at DESC;
END ;
DROP PROCEDURE IF EXISTS sp_list_manager_extra_work ;
CREATE PROCEDURE sp_list_manager_extra_work (IN p_manager_id INT)
BEGIN
  SELECT ew.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code
    FROM extra_work_requests ew
    JOIN employees e ON e.employee_id = ew.employee_id
   WHERE e.reporting_to = p_manager_id
   ORDER BY ew.created_at DESC;
END ;
DROP PROCEDURE IF EXISTS sp_review_extra_work ;
CREATE PROCEDURE sp_review_extra_work (
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
END ;
DROP PROCEDURE IF EXISTS sp_update_task ;
CREATE PROCEDURE sp_update_task (
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
END ;
-- Dashboard counts for timesheet module
DROP PROCEDURE IF EXISTS sp_employee_timesheet_counts ;
CREATE PROCEDURE sp_employee_timesheet_counts (IN p_employee_id INT)
BEGIN
  SELECT SUM(status='draft') AS draft, SUM(status='submitted') AS pending,
         SUM(status='approved') AS approved, SUM(status='rejected') AS rejected
    FROM weekly_timesheets WHERE employee_id = p_employee_id;

  SELECT COUNT(*) AS cnt FROM timesheet_entries WHERE employee_id = p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_manager_timesheet_counts ;
CREATE PROCEDURE sp_manager_timesheet_counts (IN p_manager_id INT)
BEGIN
  SELECT SUM(wt.status='submitted') AS pending,
         SUM(wt.status='approved')  AS approved,
         SUM(wt.status='rejected')  AS rejected
    FROM weekly_timesheets wt
    JOIN employees e ON e.employee_id = wt.employee_id
   WHERE e.reporting_to = p_manager_id;
END ;
DROP PROCEDURE IF EXISTS sp_admin_timesheet_counts ;
CREATE PROCEDURE sp_admin_timesheet_counts ()
BEGIN
  SELECT SUM(status='submitted') AS pending,
         SUM(status='approved')  AS approved,
         SUM(status='rejected')  AS rejected
    FROM weekly_timesheets;

  SELECT COUNT(*) AS cnt FROM employees
   WHERE role_id = (SELECT role_id FROM roles WHERE role_name='Employee' LIMIT 1);

  SELECT COUNT(*) AS cnt FROM employees
   WHERE role_id = (SELECT role_id FROM roles WHERE role_name='Reporting Manager' LIMIT 1);
END ;
-- =============================================================================
-- ░░  SIMPLE getDetails PROCEDURES  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_attendance_regularization ;
CREATE PROCEDURE sp_get_attendance_regularization (IN p_id INT)
BEGIN
  SELECT r.*, a.attendance_date, a.check_in, a.check_out,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         d.department_name
    FROM attendance_regularizations r
    JOIN attendance a ON a.attendance_id = r.attendance_id
    JOIN employees e  ON e.employee_id   = r.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE r.regularization_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_documents ;
CREATE PROCEDURE sp_list_documents (
  IN p_employee_id INT, IN p_category_id INT, IN p_visibility VARCHAR(20),
  IN p_search VARCHAR(200), IN p_limit INT, IN p_offset INT
)
BEGIN
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
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM documents d
   WHERE (p_employee_id IS NULL OR (d.employee_id=p_employee_id OR d.visibility='all'))
     AND (p_category_id IS NULL OR d.category_id=p_category_id)
     AND (p_visibility  IS NULL OR d.visibility=p_visibility)
     AND (p_search      IS NULL OR d.title LIKE p_search);
END ;
DROP PROCEDURE IF EXISTS sp_get_document ;
CREATE PROCEDURE sp_get_document (IN p_id INT)
BEGIN
  SELECT d.*, dc.category_name,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(u.first_name,' ',IFNULL(u.last_name,'')) AS uploaded_by_name
    FROM documents d
    LEFT JOIN document_categories dc ON dc.category_id=d.category_id
    LEFT JOIN employees e ON e.employee_id=d.employee_id
    LEFT JOIN employees u ON u.employee_id=d.uploaded_by
   WHERE d.document_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_jobs ;
CREATE PROCEDURE sp_list_jobs (
  IN p_status VARCHAR(20), IN p_department_id INT, IN p_search VARCHAR(200),
  IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT j.*, d.department_name,
         CONCAT(c.first_name,' ',IFNULL(c.last_name,'')) AS created_by_name,
         (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id=j.job_id) AS application_count
    FROM jobs j
    LEFT JOIN departments d ON d.department_id=j.department_id
    LEFT JOIN employees c ON c.employee_id=j.created_by
   WHERE (p_status        IS NULL OR j.status=p_status)
     AND (p_department_id IS NULL OR j.department_id=p_department_id)
     AND (p_search        IS NULL OR j.title LIKE p_search)
   ORDER BY j.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM jobs j
   WHERE (p_status        IS NULL OR j.status=p_status)
     AND (p_department_id IS NULL OR j.department_id=p_department_id)
     AND (p_search        IS NULL OR j.title LIKE p_search);
END ;
DROP PROCEDURE IF EXISTS sp_get_job ;
CREATE PROCEDURE sp_get_job (IN p_id INT)
BEGIN
  SELECT j.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name,
         d.department_name, des.designation_name
    FROM jobs j
    LEFT JOIN employees e    ON e.employee_id    = j.created_by
    LEFT JOIN departments d  ON d.department_id  = j.department_id
    LEFT JOIN designations des ON des.designation_id = j.designation_id
   WHERE j.job_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_job_applications ;
CREATE PROCEDURE sp_list_job_applications (
  IN p_job_id INT, IN p_status VARCHAR(30), IN p_search VARCHAR(200),
  IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT ja.*, j.title AS job_title, j.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS applicant_employee_name
    FROM job_applications ja
    JOIN jobs j ON j.job_id=ja.job_id
    LEFT JOIN employees e ON e.employee_id=ja.applicant_employee_id
   WHERE (p_job_id IS NULL OR ja.job_id=p_job_id)
     AND (p_status IS NULL OR ja.status=p_status)
     AND (p_search IS NULL OR ja.applicant_name LIKE p_search OR ja.email LIKE p_search)
   ORDER BY ja.applied_on DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM job_applications ja
   WHERE (p_job_id IS NULL OR ja.job_id=p_job_id)
     AND (p_status IS NULL OR ja.status=p_status)
     AND (p_search IS NULL OR ja.applicant_name LIKE p_search OR ja.email LIKE p_search);
END ;
DROP PROCEDURE IF EXISTS sp_update_job_application_status ;
CREATE PROCEDURE sp_update_job_application_status (IN p_id INT, IN p_status VARCHAR(30))
BEGIN
  UPDATE job_applications SET status=p_status WHERE application_id=p_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_job_application ;
CREATE PROCEDURE sp_get_job_application (IN p_id INT)
BEGIN
  SELECT ja.*, j.title AS job_title, j.department_id,
         CONCAT(ref.first_name,' ',IFNULL(ref.last_name,'')) AS referred_by_name,
         d.department_name
    FROM job_applications ja
    JOIN jobs j ON j.job_id = ja.job_id
    LEFT JOIN employees ref ON ref.employee_id = ja.referred_by
    LEFT JOIN departments d ON d.department_id = j.department_id
   WHERE ja.application_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_referrals ;
CREATE PROCEDURE sp_list_referrals (
  IN p_referred_by INT, IN p_job_id INT, IN p_status VARCHAR(30),
  IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT r.*, j.title AS job_title,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS referred_by_name
    FROM referrals r
    JOIN jobs j      ON j.job_id      = r.job_id
    JOIN employees e ON e.employee_id = r.referred_by
   WHERE (p_referred_by IS NULL OR r.referred_by=p_referred_by)
     AND (p_job_id      IS NULL OR r.job_id=p_job_id)
     AND (p_status      IS NULL OR r.status=p_status)
   ORDER BY r.referred_on DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM referrals r
   WHERE (p_referred_by IS NULL OR r.referred_by=p_referred_by)
     AND (p_job_id      IS NULL OR r.job_id=p_job_id)
     AND (p_status      IS NULL OR r.status=p_status);
END ;
DROP PROCEDURE IF EXISTS sp_update_referral_status ;
CREATE PROCEDURE sp_update_referral_status (IN p_id INT, IN p_status VARCHAR(30))
BEGIN
  UPDATE referrals SET status=p_status WHERE referral_id=p_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_referral ;
CREATE PROCEDURE sp_get_referral (IN p_id INT)
BEGIN
  SELECT r.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS referred_by_name,
         e.emp_code, j.title AS job_title
    FROM referrals r
    JOIN employees e ON e.employee_id = r.referred_by
    JOIN jobs j      ON j.job_id      = r.job_id
   WHERE r.referral_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_list_request_hub ;
CREATE PROCEDURE sp_list_request_hub (
  IN p_employee_id INT, IN p_status VARCHAR(20), IN p_request_type VARCHAR(50),
  IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT rh.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM request_hub rh
    JOIN employees e ON e.employee_id=rh.employee_id
    LEFT JOIN employees rv ON rv.employee_id=rh.reviewed_by
   WHERE (p_employee_id   IS NULL OR rh.employee_id=p_employee_id)
     AND (p_status        IS NULL OR rh.status=p_status)
     AND (p_request_type  IS NULL OR rh.request_type=p_request_type)
   ORDER BY rh.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM request_hub rh
   WHERE (p_employee_id   IS NULL OR rh.employee_id=p_employee_id)
     AND (p_status        IS NULL OR rh.status=p_status)
     AND (p_request_type  IS NULL OR rh.request_type=p_request_type);
END ;
DROP PROCEDURE IF EXISTS sp_update_request_hub_status ;
CREATE PROCEDURE sp_update_request_hub_status (IN p_id INT, IN p_status VARCHAR(20), IN p_reviewed_by INT)
BEGIN
  UPDATE request_hub
     SET status=p_status, reviewed_by=p_reviewed_by,
         resolved_at=IF(p_status='Pending', NULL, NOW())
   WHERE request_id=p_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_request_hub ;
CREATE PROCEDURE sp_get_request_hub (IN p_id INT)
BEGIN
  SELECT rh.*, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name, e.emp_code,
         CONCAT(a.first_name,' ',IFNULL(a.last_name,'')) AS approved_by_name,
         d.department_name
    FROM request_hub rh
    JOIN employees e ON e.employee_id = rh.employee_id
    LEFT JOIN employees a ON a.employee_id = rh.approved_by
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE rh.request_id = p_id;
END ;
-- =============================================================================
-- ░░  ATTENDANCE REGULARIZATION  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_attendance_regularization ;
CREATE PROCEDURE sp_list_attendance_regularization (
  IN p_employee_id INT, IN p_status VARCHAR(20), IN p_reporting_to INT,
  IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT r.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM attendance_regularization r
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id = r.reviewed_by
   WHERE (p_employee_id IS NULL OR r.employee_id = p_employee_id)
     AND (p_status     IS NULL OR r.status       = p_status)
     AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
   ORDER BY r.created_at DESC
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM attendance_regularization r
    JOIN employees e ON e.employee_id = r.employee_id
   WHERE (p_employee_id IS NULL OR r.employee_id = p_employee_id)
     AND (p_status     IS NULL OR r.status       = p_status)
     AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to);
END ;
DROP PROCEDURE IF EXISTS sp_get_attendance_regularization ;
CREATE PROCEDURE sp_get_attendance_regularization (IN p_id INT)
BEGIN
  SELECT r.*, e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM attendance_regularization r
    JOIN employees e ON e.employee_id = r.employee_id
    LEFT JOIN employees rv ON rv.employee_id = r.reviewed_by
   WHERE r.regularization_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_review_attendance_regularization ;
CREATE PROCEDURE sp_review_attendance_regularization (
  IN p_id INT, IN p_decision VARCHAR(20), IN p_reviewed_by INT, IN p_remarks TEXT
)
BEGIN
  DECLARE v_employee_id INT;
  DECLARE v_date DATE;
  DECLARE v_check_in TIME;
  DECLARE v_check_out TIME;
  SELECT employee_id, attendance_date, requested_check_in, requested_check_out
    INTO v_employee_id, v_date, v_check_in, v_check_out
    FROM attendance_regularization WHERE regularization_id = p_id;

  UPDATE attendance_regularization
     SET status=p_decision, reviewed_by=p_reviewed_by, reviewed_on=NOW(), remarks=p_remarks
   WHERE regularization_id=p_id;

  IF p_decision = 'Approved' THEN
    INSERT INTO attendance (employee_id, attendance_date, check_in, check_out, status, source)
    VALUES (v_employee_id, v_date, v_check_in, v_check_out, 'present', 'regularization')
    ON DUPLICATE KEY UPDATE
      check_in  = IFNULL(v_check_in,  check_in),
      check_out = IFNULL(v_check_out, check_out),
      status    = 'present';
  END IF;
END ;
-- =============================================================================
-- ░░  IT DECLARATION  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_get_latest_it_cycle ;
CREATE PROCEDURE sp_get_latest_it_cycle ()
BEGIN
  SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
    FROM it_declaration_cycles c
    LEFT JOIN employees e ON e.employee_id = c.created_by
   ORDER BY c.cycle_id DESC LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_all_it_cycles ;
CREATE PROCEDURE sp_get_all_it_cycles ()
BEGIN
  SELECT * FROM it_declaration_cycles ORDER BY cycle_id DESC;
END ;
DROP PROCEDURE IF EXISTS sp_create_it_cycle ;
CREATE PROCEDURE sp_create_it_cycle (
  IN p_fy_label VARCHAR(20), IN p_fy_start_year INT,
  IN p_start_date DATE, IN p_end_date DATE, IN p_created_by INT,
  OUT p_cycle_id INT
)
BEGIN
  INSERT INTO it_declaration_cycles (fy_label, fy_start_year, start_date, end_date, created_by)
  VALUES (p_fy_label, p_fy_start_year, p_start_date, p_end_date, p_created_by);
  SET p_cycle_id = LAST_INSERT_ID();
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_update_it_cycle ;
CREATE PROCEDURE sp_update_it_cycle (
  IN p_cycle_id INT, IN p_fy_label VARCHAR(20), IN p_start_date DATE, IN p_end_date DATE
)
BEGIN
  UPDATE it_declaration_cycles
     SET fy_label   = COALESCE(p_fy_label,   fy_label),
         start_date = COALESCE(p_start_date, start_date),
         end_date   = COALESCE(p_end_date,   end_date)
   WHERE cycle_id = p_cycle_id;
  SELECT * FROM it_declaration_cycles WHERE cycle_id = p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_toggle_it_cycle_status ;
CREATE PROCEDURE sp_toggle_it_cycle_status (IN p_cycle_id INT, IN p_admin_id INT)
BEGIN
  DECLARE v_current VARCHAR(20);
  DECLARE v_new VARCHAR(20);
  SELECT status INTO v_current FROM it_declaration_cycles WHERE cycle_id = p_cycle_id LIMIT 1;
  IF v_current IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Cycle not found'; END IF;
  SET v_new = IF(v_current='active','inactive','active');
  UPDATE it_declaration_cycles SET status='inactive';
  UPDATE it_declaration_cycles SET status=v_new, created_by=p_admin_id WHERE cycle_id=p_cycle_id;
  SELECT * FROM it_declaration_cycles WHERE cycle_id=p_cycle_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_or_create_it_declaration ;
CREATE PROCEDURE sp_get_or_create_it_declaration (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_my_it_declaration ;
CREATE PROCEDURE sp_get_my_it_declaration (IN p_employee_id INT)
BEGIN
  -- Result 1: cycle
  SELECT c.*, CONCAT(e.first_name,' ',e.last_name) AS created_by_name
    FROM it_declaration_cycles c
    LEFT JOIN employees e ON e.employee_id = c.created_by
   ORDER BY c.cycle_id DESC LIMIT 1;

  -- Result 2: declaration (may be empty)
  SELECT d.* FROM it_declarations d
    JOIN (SELECT cycle_id FROM it_declaration_cycles ORDER BY cycle_id DESC LIMIT 1) latest USING (cycle_id)
   WHERE d.employee_id = p_employee_id LIMIT 1;

  -- Result 3: items (may be empty)
  SELECT i.* FROM it_declaration_items i
    JOIN it_declarations d ON d.declaration_id = i.declaration_id
    JOIN (SELECT cycle_id FROM it_declaration_cycles ORDER BY cycle_id DESC LIMIT 1) latest USING (cycle_id)
   WHERE d.employee_id = p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_it_declaration_by_id ;
CREATE PROCEDURE sp_get_it_declaration_by_id (IN p_declaration_id INT)
BEGIN
  SELECT * FROM it_declarations WHERE declaration_id = p_declaration_id;
END ;
DROP PROCEDURE IF EXISTS sp_replace_it_declaration_items ;
CREATE PROCEDURE sp_replace_it_declaration_items (IN p_declaration_id INT)
BEGIN
  DELETE FROM it_declaration_items WHERE declaration_id = p_declaration_id;
END ;
DROP PROCEDURE IF EXISTS sp_insert_it_declaration_item ;
CREATE PROCEDURE sp_insert_it_declaration_item (
  IN p_declaration_id INT, IN p_section_key VARCHAR(100),
  IN p_section_label VARCHAR(200), IN p_sub_label VARCHAR(200),
  IN p_declared_amount DECIMAL(12,2)
)
BEGIN
  INSERT INTO it_declaration_items
    (declaration_id, section_key, section_label, sub_label, declared_amount)
  VALUES (p_declaration_id, p_section_key, p_section_label, p_sub_label, p_declared_amount);
END ;
DROP PROCEDURE IF EXISTS sp_update_it_declaration_status ;
CREATE PROCEDURE sp_update_it_declaration_status (
  IN p_declaration_id INT, IN p_status VARCHAR(30),
  IN p_total DECIMAL(12,2), IN p_submitted_at DATETIME
)
BEGIN
  UPDATE it_declarations
     SET status=p_status, total_declared=p_total,
         submitted_at=p_submitted_at, admin_remarks=NULL
   WHERE declaration_id=p_declaration_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_my_it_proofs ;
CREATE PROCEDURE sp_get_my_it_proofs (IN p_employee_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_upload_it_proof ;
CREATE PROCEDURE sp_upload_it_proof (
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
END ;
DROP PROCEDURE IF EXISTS sp_get_it_proof ;
CREATE PROCEDURE sp_get_it_proof (IN p_proof_id INT, IN p_employee_id INT, IN p_is_admin TINYINT)
BEGIN
  IF p_is_admin THEN
    SELECT * FROM it_proof_documents WHERE proof_id = p_proof_id;
  ELSE
    SELECT * FROM it_proof_documents WHERE proof_id = p_proof_id AND employee_id = p_employee_id;
  END IF;
END ;
DROP PROCEDURE IF EXISTS sp_delete_it_proof ;
CREATE PROCEDURE sp_delete_it_proof (IN p_proof_id INT)
BEGIN
  DELETE FROM it_proof_documents WHERE proof_id = p_proof_id;
END ;
DROP PROCEDURE IF EXISTS sp_review_it_declaration ;
CREATE PROCEDURE sp_review_it_declaration (
  IN p_admin_id INT, IN p_declaration_id INT, IN p_status VARCHAR(30), IN p_remarks TEXT
)
BEGIN
  UPDATE it_declarations
     SET status=p_status, admin_remarks=p_remarks, reviewed_by=p_admin_id, reviewed_at=NOW()
   WHERE declaration_id=p_declaration_id;
  SELECT * FROM it_declarations WHERE declaration_id=p_declaration_id;
END ;
DROP PROCEDURE IF EXISTS sp_review_it_proof ;
CREATE PROCEDURE sp_review_it_proof (
  IN p_admin_id INT, IN p_proof_id INT, IN p_status VARCHAR(30), IN p_remarks TEXT
)
BEGIN
  UPDATE it_proof_documents
     SET status=p_status, admin_remarks=p_remarks, reviewed_by=p_admin_id, reviewed_at=NOW()
   WHERE proof_id=p_proof_id;
  SELECT * FROM it_proof_documents WHERE proof_id=p_proof_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_all_it_declarations ;
CREATE PROCEDURE sp_get_all_it_declarations (IN p_cycle_id INT)
BEGIN
  -- Result 1: all employees
  SELECT e.employee_id, e.emp_code,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.email, e.emp_job_title AS job_title, d.department_name
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
   ORDER BY e.first_name, e.last_name;

  -- Result 2: declarations for the cycle
  SELECT d.*, CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name
    FROM it_declarations d
    LEFT JOIN employees rev ON rev.employee_id = d.reviewed_by
   WHERE d.cycle_id = p_cycle_id;

  -- Result 3: all items for these declarations
  SELECT i.* FROM it_declaration_items i
    JOIN it_declarations d ON d.declaration_id = i.declaration_id
   WHERE d.cycle_id = p_cycle_id;

  -- Result 4: all proofs for these declarations
  SELECT p.* FROM it_proof_documents p
    JOIN it_declarations d ON d.declaration_id = p.declaration_id
   WHERE d.cycle_id = p_cycle_id;
END ;
-- =============================================================================
-- ░░  PAYSLIP (additional)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_list_payslips ;
CREATE PROCEDURE sp_list_payslips (
  IN p_employee_id INT, IN p_month INT, IN p_year INT,
  IN p_status VARCHAR(20), IN p_department_id INT,
  IN p_payroll_run_id INT, IN p_limit INT, IN p_offset INT
)
BEGIN
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
   LIMIT IFNULL(p_limit,18446744073709551615) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
   WHERE (p_employee_id    IS NULL OR p.employee_id    = p_employee_id)
     AND (p_month          IS NULL OR p.month          = p_month)
     AND (p_year           IS NULL OR p.year           = p_year)
     AND (p_status         IS NULL OR p.status         = p_status)
     AND (p_department_id  IS NULL OR e.department_id  = p_department_id)
     AND (p_payroll_run_id IS NULL OR p.payroll_run_id = p_payroll_run_id);
END ;
DROP PROCEDURE IF EXISTS sp_get_payslip ;
CREATE PROCEDURE sp_get_payslip (IN p_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_get_payslip_full ;
CREATE PROCEDURE sp_get_payslip_full (IN p_id INT)
BEGIN
  SELECT p.*,
         e.emp_code, e.first_name, e.last_name, e.emp_job_title, e.location,
         e.pf_number, e.employee_id AS emp_id,
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
END ;
DROP PROCEDURE IF EXISTS sp_get_payslip_raw ;
CREATE PROCEDURE sp_get_payslip_raw (IN p_id INT)
BEGIN
  SELECT * FROM payslips WHERE payslip_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_update_payslip_encrypted ;
CREATE PROCEDURE sp_update_payslip_encrypted (IN p_id INT, IN p_encrypted BLOB)
BEGIN
  UPDATE payslips SET
    salary_encrypted = p_encrypted,
    basic = NULL, hra = NULL, allowances = NULL,
    gross_earnings = NULL, ctc = NULL,
    deductions = NULL, net_pay = NULL
  WHERE payslip_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_mark_payslip_paid ;
CREATE PROCEDURE sp_mark_payslip_paid (IN p_id INT)
BEGIN
  UPDATE payslips SET status='Paid' WHERE payslip_id=p_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_active_employees_basic ;
CREATE PROCEDURE sp_get_active_employees_basic ()
BEGIN
  SELECT employee_id, emp_code, email,
         CONCAT(first_name,' ',IFNULL(last_name,'')) AS employee_name
    FROM employees WHERE employee_status='Active';
END ;
-- =============================================================================
-- ░░  REPORT (hiring)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_employee_summary_report ;
CREATE PROCEDURE sp_employee_summary_report ()
BEGIN
  SELECT employee_status AS status, COUNT(*) AS total FROM employees GROUP BY employee_status;
  SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS total
    FROM departments d
    LEFT JOIN employees e ON e.department_id=d.department_id AND e.employee_status='Active'
   GROUP BY d.department_id, d.department_name ORDER BY d.department_name;
  SELECT employee_type, COUNT(*) AS total FROM employees WHERE employee_status='Active' GROUP BY employee_type;
END ;
DROP PROCEDURE IF EXISTS sp_attendance_report ;
CREATE PROCEDURE sp_attendance_report (IN p_from_date DATE, IN p_to_date DATE, IN p_department_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_leave_report ;
CREATE PROCEDURE sp_leave_report (IN p_year INT, IN p_department_id INT, IN p_status VARCHAR(20))
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
END ;
DROP PROCEDURE IF EXISTS sp_payroll_report ;
CREATE PROCEDURE sp_payroll_report (IN p_month INT, IN p_year INT, IN p_department_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_helpdesk_report ;
CREATE PROCEDURE sp_helpdesk_report (IN p_from_date DATETIME, IN p_to_date DATETIME)
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
END ;
DROP PROCEDURE IF EXISTS sp_hiring_report ;
CREATE PROCEDURE sp_hiring_report ()
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
END ;
DROP PROCEDURE IF EXISTS sp_review_report ;
CREATE PROCEDURE sp_review_report (IN p_review_type_id INT, IN p_status VARCHAR(20))
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
END ;
-- =============================================================================
-- ░░  ORG HIERARCHY (stats + employee list)  ░░
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_org_dashboard_stats ;
CREATE PROCEDURE sp_org_dashboard_stats ()
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
END ;
DROP PROCEDURE IF EXISTS sp_get_org_employees ;
CREATE PROCEDURE sp_get_org_employees (IN p_department_id INT, IN p_status VARCHAR(20))
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
END ;
DROP PROCEDURE IF EXISTS sp_update_employee_reporting_to ;
CREATE PROCEDURE sp_update_employee_reporting_to (
  IN p_employee_id INT, IN p_reporting_to INT
)
BEGIN
  UPDATE employees SET reporting_to = p_reporting_to WHERE employee_id = p_employee_id;
END ;
DROP PROCEDURE IF EXISTS sp_get_org_tree_data ;
CREATE PROCEDURE sp_get_org_tree_data (IN p_department_id INT, IN p_status VARCHAR(20))
BEGIN
  -- Result 1: employees
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.employee_status != 'Terminated'
     AND (p_department_id IS NULL OR dp.department_id = p_department_id)
     AND (p_status        IS NULL OR e.employee_status = p_status)
   ORDER BY e.first_name;

  -- Result 2: active delegations
  SELECT wd.employee_id, CONCAT(d.first_name,' ',IFNULL(d.last_name,'')) AS delegate_name
    FROM workflow_delegates wd
    JOIN employees d ON d.employee_id = wd.delegate_employee_id
   WHERE wd.status='Active' AND wd.to_date >= CURDATE();

  -- Result 3: direct report counts
  SELECT reporting_to, COUNT(*) AS cnt FROM employees
   WHERE employee_status != 'Terminated' AND reporting_to IS NOT NULL
   GROUP BY reporting_to;
END ;
DROP PROCEDURE IF EXISTS sp_get_unassigned_employees ;
CREATE PROCEDURE sp_get_unassigned_employees ()
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
END ;
DROP PROCEDURE IF EXISTS sp_get_managers_list ;
CREATE PROCEDURE sp_get_managers_list ()
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
END ;
DROP PROCEDURE IF EXISTS sp_get_manager_details ;
CREATE PROCEDURE sp_get_manager_details (IN p_manager_id INT)
BEGIN
  -- Result 1: manager
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.employee_id=p_manager_id;

  -- Result 2: direct reports
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE e.reporting_to=p_manager_id AND e.employee_status != 'Terminated';

  -- Result 3: indirect reports (subordinates of direct reports)
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
END ;
DROP PROCEDURE IF EXISTS sp_search_employees_org ;
CREATE PROCEDURE sp_search_employees_org (
  IN p_q             VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  IN p_department_id INT,
  IN p_designation_id INT,
  IN p_status        VARCHAR(20)  COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE (e.first_name  COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.last_name  COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.emp_code   COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.email      COLLATE utf8mb4_unicode_ci LIKE p_q
          OR CONCAT(e.first_name,' ',e.last_name) COLLATE utf8mb4_unicode_ci LIKE p_q)
     AND (p_department_id  IS NULL OR e.department_id  = p_department_id)
     AND (p_designation_id IS NULL OR e.designation_id = p_designation_id)
     AND (p_status         IS NULL OR e.employee_status = p_status)
   LIMIT 30;

  -- All employees for hierarchy path building
  SELECT employee_id, reporting_to, CONCAT(first_name,' ',IFNULL(last_name,'')) AS full_name
    FROM employees;
END ;
DROP PROCEDURE IF EXISTS sp_assign_manager ;
CREATE PROCEDURE sp_assign_manager (
  IN p_employee_id INT, IN p_new_manager_id INT, IN p_changed_by INT, IN p_reason TEXT
)
BEGIN
  DECLARE v_old_manager INT;
  SELECT reporting_to INTO v_old_manager FROM employees WHERE employee_id=p_employee_id LIMIT 1;
  IF v_old_manager IS NULL AND p_new_manager_id IS NULL THEN LEAVE sp_assign_manager; END IF;
  UPDATE employees SET reporting_to=p_new_manager_id WHERE employee_id=p_employee_id;
  INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
  VALUES (p_employee_id, v_old_manager, p_new_manager_id, p_changed_by, p_reason, 'assign');
END ;
DROP PROCEDURE IF EXISTS sp_bulk_assign_manager ;
CREATE PROCEDURE sp_bulk_assign_manager (
  IN p_employee_id INT, IN p_new_manager_id INT, IN p_changed_by INT, IN p_reason TEXT
)
BEGIN
  DECLARE v_old_manager INT;
  SELECT reporting_to INTO v_old_manager FROM employees WHERE employee_id=p_employee_id LIMIT 1;
  IF v_old_manager IS NULL THEN LEAVE sp_bulk_assign_manager; END IF;
  UPDATE employees SET reporting_to=p_new_manager_id WHERE employee_id=p_employee_id;
  INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
  VALUES (p_employee_id, v_old_manager, p_new_manager_id, p_changed_by, p_reason, 'bulk_transfer');
END ;
DROP PROCEDURE IF EXISTS sp_transfer_manager_team ;
CREATE PROCEDURE sp_transfer_manager_team (
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
END ;
DROP PROCEDURE IF EXISTS sp_create_org_delegation ;
CREATE PROCEDURE sp_create_org_delegation (
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
END ;
DROP PROCEDURE IF EXISTS sp_list_org_delegations ;
CREATE PROCEDURE sp_list_org_delegations (IN p_status VARCHAR(20), IN p_employee_id INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_get_org_history ;
CREATE PROCEDURE sp_get_org_history (
  IN p_employee_id INT, IN p_manager_id INT, IN p_change_type VARCHAR(20),
  IN p_limit INT, IN p_offset INT
)
BEGIN
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
   LIMIT IFNULL(p_limit,50) OFFSET IFNULL(p_offset,0);

  SELECT COUNT(*) AS total FROM reporting_history rh
   WHERE (p_employee_id IS NULL OR rh.employee_id=p_employee_id)
     AND (p_manager_id  IS NULL OR rh.old_manager_id=p_manager_id OR rh.new_manager_id=p_manager_id)
     AND (p_change_type IS NULL OR rh.change_type=p_change_type);
END ;
DROP PROCEDURE IF EXISTS sp_log_reporting_history ;
CREATE PROCEDURE sp_log_reporting_history (
  IN p_employee_id INT, IN p_old_manager_id INT, IN p_new_manager_id INT,
  IN p_changed_by INT, IN p_reason TEXT, IN p_change_type VARCHAR(30)
)
BEGIN
  INSERT INTO reporting_history (employee_id, old_manager_id, new_manager_id, changed_by, reason, change_type)
  VALUES (p_employee_id, p_old_manager_id, p_new_manager_id, p_changed_by, p_reason, p_change_type);
END ;
DROP PROCEDURE IF EXISTS sp_get_auto_seed_employees ;
CREATE PROCEDURE sp_get_auto_seed_employees ()
BEGIN
  SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name,
         e.department_id, d.designation_name
    FROM employees e
    LEFT JOIN designations d ON d.designation_id=e.designation_id
   WHERE e.employee_status='Active'
   ORDER BY e.employee_id;
END ;
-- ─── Report Download SPs ────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_get_company ;
CREATE PROCEDURE sp_get_company ()
BEGIN
  SELECT * FROM companies LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_report_emp_data ;
CREATE PROCEDURE sp_report_emp_data ()
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
END ;
DROP PROCEDURE IF EXISTS sp_report_leave_balance ;
CREATE PROCEDURE sp_report_leave_balance ()
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         m.emp_code AS mgr_code,
         CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS mgr_name,
         d.department_name,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Comp%' OR lt.leave_type_name LIKE '%Compensatory%' THEN lb.balance_days ELSE 0 END) AS comp_off,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Earned%' OR lt.leave_type_name = 'EL' THEN lb.balance_days ELSE 0 END) AS earned_leave,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Paternity%' THEN lb.balance_days ELSE 0 END) AS paternity,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Restricted%' OR lt.leave_type_name = 'RH' THEN lb.balance_days ELSE 0 END) AS restricted_holiday,
         SUM(CASE WHEN lt.leave_type_name LIKE '%Sick%' OR lt.leave_type_name = 'SL' THEN lb.balance_days ELSE 0 END) AS sick_leave
    FROM leave_balances lb
    JOIN employees e ON e.employee_id = lb.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lb.leave_type_id
    LEFT JOIN employees m ON m.employee_id = e.reporting_to
    LEFT JOIN departments d ON d.department_id = e.department_id
   WHERE e.employee_status = 'Active'
   GROUP BY e.employee_id
   ORDER BY e.emp_code;
END ;
DROP PROCEDURE IF EXISTS sp_report_leave_summary_data ;
CREATE PROCEDURE sp_report_leave_summary_data (IN p_from DATE, IN p_to DATE)
BEGIN
  -- Result 1: Active employees
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         e.employee_status, e.date_of_confirmation, e.emp_joining_date, e.employee_id,
         d.department_name, ds.designation_name
    FROM employees e
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations ds ON ds.designation_id = e.designation_id
   WHERE e.employee_status = 'Active'
   ORDER BY e.emp_code;

  -- Result 2: Leave types
  SELECT leave_type_id, leave_type_name, short_code FROM leave_types ORDER BY leave_type_id;

  -- Result 3: Leave availed in date range
  SELECT lr.employee_id, lr.leave_type_id, IFNULL(SUM(lr.days), 0) AS days_availed
    FROM leave_requests lr
   WHERE lr.status = 'approved' AND lr.from_date >= p_from AND lr.to_date <= p_to
   GROUP BY lr.employee_id, lr.leave_type_id;

  -- Result 4: All leave balances
  SELECT lb.employee_id, lb.leave_type_id, lb.balance_days FROM leave_balances lb;
END ;
DROP PROCEDURE IF EXISTS sp_report_pf_statement ;
CREATE PROCEDURE sp_report_pf_statement (IN p_month INT, IN p_year INT)
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
END ;
DROP PROCEDURE IF EXISTS sp_report_payslips_for_month ;
CREATE PROCEDURE sp_report_payslips_for_month (IN p_month INT, IN p_year INT)
BEGIN
  SELECT e.emp_code, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS emp_name,
         p.gross_earnings, p.basic
    FROM employees e
    LEFT JOIN payslips p ON p.employee_id = e.employee_id AND p.month = p_month AND p.year = p_year
   WHERE e.employee_status = 'Active'
   ORDER BY e.emp_code;
END ;
-- ─── Auth helpers ────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_check_email_exists ;
CREATE PROCEDURE sp_check_email_exists (IN p_email VARCHAR(120))
BEGIN
  SELECT user_id FROM users WHERE email = p_email LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_user_password_hash ;
CREATE PROCEDURE sp_get_user_password_hash (IN p_user_id INT)
BEGIN
  SELECT password_hash FROM users WHERE user_id = p_user_id LIMIT 1;
END ;
-- ─── Permission helpers ──────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_get_role ;
CREATE PROCEDURE sp_get_role (IN p_role_id INT)
BEGIN
  SELECT * FROM roles WHERE role_id = p_role_id LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_get_role_permissions ;
CREATE PROCEDURE sp_get_role_permissions (IN p_role_id INT)
BEGIN
  SELECT p.permission_id, p.module, p.action,
         IFNULL(rp.allowed, 0) AS allowed
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.permission_id AND rp.role_id = p_role_id
   ORDER BY p.module, p.action;
END ;
DROP PROCEDURE IF EXISTS sp_list_permissions ;
CREATE PROCEDURE sp_list_permissions ()
BEGIN
  SELECT * FROM permissions ORDER BY module, action;
END ;
DROP PROCEDURE IF EXISTS sp_upsert_role_permission ;
CREATE PROCEDURE sp_upsert_role_permission (
  IN p_role_id INT, IN p_module VARCHAR(50), IN p_action VARCHAR(50), IN p_allowed TINYINT
)
BEGIN
  INSERT INTO role_permissions (role_id, permission_id, allowed)
  SELECT p_role_id, permission_id, p_allowed FROM permissions WHERE module = p_module AND action = p_action
  ON DUPLICATE KEY UPDATE allowed = p_allowed;
END ;
-- ─── Dashboard helpers ───────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_birthdays_anniversaries ;
CREATE PROCEDURE sp_birthdays_anniversaries (IN p_month INT)
BEGIN
  SELECT employee_id, emp_code, CONCAT(first_name, ' ', IFNULL(last_name,'')) AS employee_name,
         dob, emp_joining_date
    FROM employees
   WHERE employee_status = 'Active'
     AND (MONTH(dob) = p_month OR MONTH(emp_joining_date) = p_month);
END ;
DROP PROCEDURE IF EXISTS sp_recent_activities ;
CREATE PROCEDURE sp_recent_activities (IN p_limit INT)
BEGIN
  SELECT a.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS performed_by_name
    FROM audit_logs a
    LEFT JOIN employees e ON e.employee_id = a.user_id
   ORDER BY a.created_at DESC
   LIMIT IFNULL(p_limit, 10);
END ;
-- ─── Calendar event helpers ──────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_calendar_events ;
CREATE PROCEDURE sp_list_calendar_events (
  IN p_employee_id INT, IN p_visibility VARCHAR(20), IN p_type VARCHAR(50),
  IN p_from DATE, IN p_to DATE, IN p_limit INT, IN p_offset INT
)
BEGIN
  SELECT ce.*,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS created_by_name
    FROM calendar_events ce
    LEFT JOIN employees e ON e.employee_id = ce.employee_id
   WHERE (p_employee_id IS NULL OR ce.employee_id = p_employee_id OR ce.visibility = 'all')
     AND (p_visibility  IS NULL OR ce.visibility = p_visibility)
     AND (p_type        IS NULL OR ce.event_type = p_type)
     AND (p_from        IS NULL OR ce.start_date >= p_from)
     AND (p_to          IS NULL OR ce.end_date   <= p_to)
   ORDER BY ce.start_date ASC
   LIMIT IFNULL(p_limit, 50) OFFSET IFNULL(p_offset, 0);

  SELECT COUNT(*) AS total FROM calendar_events ce
   WHERE (p_employee_id IS NULL OR ce.employee_id = p_employee_id OR ce.visibility = 'all')
     AND (p_visibility  IS NULL OR ce.visibility = p_visibility)
     AND (p_type        IS NULL OR ce.event_type = p_type)
     AND (p_from        IS NULL OR ce.start_date >= p_from)
     AND (p_to          IS NULL OR ce.end_date   <= p_to);
END ;
-- ─── Holiday getById helper ──────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_get_holiday_by_id ;
CREATE PROCEDURE sp_get_holiday_by_id (IN p_holiday_id INT)
BEGIN
  SELECT * FROM holidays WHERE holiday_id = p_holiday_id LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_import_holiday ;
CREATE PROCEDURE sp_import_holiday (
  IN p_name VARCHAR(200), IN p_date DATE, IN p_calendar VARCHAR(50),
  IN p_shift VARCHAR(20), IN p_location VARCHAR(100), IN p_is_restricted TINYINT
)
BEGIN
  INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, shift, location, is_restricted)
  VALUES (p_name, p_date, p_calendar, p_shift, p_location, p_is_restricted);
END ;
-- ─── Designation CRUD ───────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_list_designations ;
CREATE PROCEDURE sp_list_designations (IN p_department_id INT)
BEGIN
  SELECT * FROM designations
   WHERE (p_department_id IS NULL OR department_id = p_department_id)
   ORDER BY designation_name;
END ;
DROP PROCEDURE IF EXISTS sp_get_designation ;
CREATE PROCEDURE sp_get_designation (IN p_id INT)
BEGIN
  SELECT * FROM designations WHERE designation_id = p_id LIMIT 1;
END ;
DROP PROCEDURE IF EXISTS sp_create_designation ;
CREATE PROCEDURE sp_create_designation (
  IN p_name VARCHAR(200), IN p_department_id INT, OUT p_id INT
)
BEGIN
  INSERT INTO designations (designation_name, department_id) VALUES (p_name, p_department_id);
  SET p_id = LAST_INSERT_ID();
  SELECT * FROM designations WHERE designation_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_update_designation ;
CREATE PROCEDURE sp_update_designation (
  IN p_id INT, IN p_name VARCHAR(200), IN p_department_id INT
)
BEGIN
  UPDATE designations
     SET designation_name = COALESCE(p_name, designation_name),
         department_id    = COALESCE(p_department_id, department_id)
   WHERE designation_id = p_id;
  SELECT * FROM designations WHERE designation_id = p_id;
END ;
DROP PROCEDURE IF EXISTS sp_delete_designation ;
CREATE PROCEDURE sp_delete_designation (IN p_id INT)
BEGIN
  DELETE FROM designations WHE