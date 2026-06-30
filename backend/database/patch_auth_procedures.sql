-- =====================================================================
-- PATCH: Auth stored procedures
-- Run this if sp_get_user_for_login (or any auth SP) is missing.
-- Safe to re-run — uses DROP PROCEDURE IF EXISTS before each CREATE.
-- =====================================================================

USE hrms_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_user_for_login $$
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
END $$

DROP PROCEDURE IF EXISTS sp_get_user_by_id $$
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
END $$

DROP PROCEDURE IF EXISTS sp_login_success $$
CREATE PROCEDURE sp_login_success (IN p_user_id INT)
BEGIN
  UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL
   WHERE user_id = p_user_id;
END $$

DROP PROCEDURE IF EXISTS sp_login_fail $$
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
END $$

DROP PROCEDURE IF EXISTS sp_register_user $$
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
END $$

DROP PROCEDURE IF EXISTS sp_check_email_exists $$
CREATE PROCEDURE sp_check_email_exists (IN p_email VARCHAR(150))
BEGIN
  SELECT user_id FROM users WHERE email = p_email LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_get_user_password_hash $$
CREATE PROCEDURE sp_get_user_password_hash (IN p_user_id INT)
BEGIN
  SELECT password_hash FROM users WHERE user_id = p_user_id LIMIT 1;
END $$

DROP PROCEDURE IF EXISTS sp_change_password $$
CREATE PROCEDURE sp_change_password (IN p_user_id INT, IN p_new_hash VARCHAR(255))
BEGIN
  UPDATE users SET password_hash = p_new_hash WHERE user_id = p_user_id;
END $$

DROP PROCEDURE IF EXISTS sp_set_reset_token $$
CREATE PROCEDURE sp_set_reset_token (IN p_email VARCHAR(150), IN p_token VARCHAR(64), IN p_expiry DATETIME)
BEGIN
  UPDATE users SET reset_token = p_token, reset_token_expiry = p_expiry WHERE email = p_email;
END $$

DROP PROCEDURE IF EXISTS sp_verify_reset_token $$
CREATE PROCEDURE sp_verify_reset_token (IN p_token VARCHAR(64), IN p_new_hash VARCHAR(255), OUT p_ok TINYINT)
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

DELIMITER ;

SELECT 'Auth procedures patched successfully.' AS status;
