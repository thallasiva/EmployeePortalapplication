-- =====================================================================
-- Migration 033b: Add Recruiter role + 2 recruiter users
-- Safe version — does NOT touch role_id 4 or existing employees
-- =====================================================================
USE hrms_db;

-- 1. Add Recruiter role (role_id 5 only)
INSERT INTO roles (role_id, role_name, description) VALUES
  (5, 'Recruiter', 'Manages assigned requirements and candidate pipeline')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description);

-- 2. Recruitment department
INSERT INTO departments (department_id, department_name, company_id) VALUES
  (8, 'Recruitment', 1)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- 3. Recruiter designation
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (19, 'Recruiter', 8)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name), department_id = VALUES(department_id);

-- 4. Recruiter employees (IDs 51, 52 — safe range)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM salary_structures     WHERE employee_id IN (51, 52);
DELETE FROM employee_bank_details WHERE employee_id IN (51, 52);
DELETE FROM users                 WHERE employee_id IN (51, 52);
DELETE FROM employees             WHERE employee_id IN (51, 52);
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES
  (51, 'EMP00051', 'Mike',  'Williams', 'recruiter1@yopmail.com', '9876500051',
   'Recruiter', 8, 19, 'Full-Time', 'Active', 'general', '2022-07-15', 'new'),
  (52, 'EMP00052', 'Emily', 'Chen',     'recruiter2@yopmail.com', '9876500052',
   'Recruiter', 8, 19, 'Full-Time', 'Active', 'general', '2023-01-10', 'new');

-- 5. User accounts (password: Test@123)
DELETE FROM users WHERE user_id IN (51, 52);
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (51, 'recruiter1@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 51, 'Active'),
  (52, 'recruiter2@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 52, 'Active');

-- 6. Leave balances
DELETE FROM leave_balances WHERE employee_id IN (51, 52);
INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance) VALUES
  (51, 1, YEAR(CURDATE()), 0, 10, 0, 10),
  (51, 2, YEAR(CURDATE()), 0, 15, 0, 15),
  (52, 1, YEAR(CURDATE()), 0, 10, 0, 10),
  (52, 2, YEAR(CURDATE()), 0, 15, 0, 15);

SELECT 'Done — recruiters recruiter1@yopmail.com and recruiter2@yopmail.com created (password: Test@123)' AS status;
