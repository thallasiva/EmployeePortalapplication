-- =====================================================================
-- Migration 033: Recruiter Team Lead + 2 Recruiter employees
--
-- Adds:
--   • roles 4 (Recruiter Team Lead) and 5 (Recruiter)
--   • department 8  — Recruitment
--   • designations 18 (Recruiter Team Lead) and 19 (Recruiter)
--   • 3 employees (IDs 21–23) with user accounts
--
-- Login credentials (password: Test@123)
--   teamlead@yopmail.com  → Recruiter Team Lead (role 4)
--   recruiter1@yopmail.com → Recruiter (role 5)
--   recruiter2@yopmail.com → Recruiter (role 5)
--
-- Safe to re-run — uses ON DUPLICATE KEY / DELETE + re-INSERT pattern.
-- =====================================================================

USE hrms_db;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Roles
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO roles (role_id, role_name, description) VALUES
  (4, 'Recruiter Team Lead', 'Leads the recruitment team; assigns requirements, approves offers'),
  (5, 'Recruiter',           'Manages assigned requirements and candidate pipeline')
ON DUPLICATE KEY UPDATE
  role_name   = VALUES(role_name),
  description = VALUES(description);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Recruitment department
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO departments (department_id, department_name, company_id) VALUES
  (8, 'Recruitment', 1)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Designations
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (18, 'Recruiter Team Lead', 8),
  (19, 'Recruiter',           8)
ON DUPLICATE KEY UPDATE
  designation_name = VALUES(designation_name),
  department_id    = VALUES(department_id);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Remove existing rows for these IDs (idempotent)
-- ─────────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM salary_structures     WHERE employee_id IN (21, 22, 23);
DELETE FROM employee_bank_details WHERE employee_id IN (21, 22, 23);
DELETE FROM users                 WHERE employee_id IN (21, 22, 23);
DELETE FROM employees             WHERE employee_id IN (21, 22, 23);
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────
-- 5. Employees
-- ─────────────────────────────────────────────────────────────────────

-- Recruiter Team Lead
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  21, 'EMP00021', 'Sarah', 'Johnson', 'teamlead@yopmail.com', '9876500021',
  'Recruiter Team Lead', 8, 18,
  'Full-Time', 'Active', 'general', '2021-04-01', 'new'
);

-- Recruiter 1
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id, reporting_to,
  employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  22, 'EMP00022', 'Mike', 'Williams', 'recruiter1@yopmail.com', '9876500022',
  'Recruiter', 8, 19, 21,
  'Full-Time', 'Active', 'general', '2022-07-15', 'new'
);

-- Recruiter 2
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id, reporting_to,
  employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  23, 'EMP00023', 'Emily', 'Chen', 'recruiter2@yopmail.com', '9876500023',
  'Recruiter', 8, 19, 21,
  'Full-Time', 'Active', 'general', '2023-01-10', 'new'
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. User accounts  (password: Test@123)
-- ─────────────────────────────────────────────────────────────────────
-- hash generated: bcrypt('Test@123', 10) = $2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG
DELETE FROM users WHERE user_id IN (21, 22, 23);

INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (21, 'teamlead@yopmail.com',   '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 4, 21, 'Active'),
  (22, 'recruiter1@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 22, 'Active'),
  (23, 'recruiter2@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 23, 'Active');

-- ─────────────────────────────────────────────────────────────────────
-- 7. Leave balances (Sick + Earned Leave for current year)
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM leave_balances WHERE employee_id IN (21, 22, 23);

INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance) VALUES
  -- Sarah Johnson (Team Lead)
  (21, 1, YEAR(CURDATE()), 0, 10, 0, 10),   -- Sick Leave
  (21, 2, YEAR(CURDATE()), 0, 15, 0, 15),   -- Earned Leave
  (21, 3, YEAR(CURDATE()), 0,  5, 0,  5),   -- Casual Leave
  -- Mike Williams (Recruiter 1)
  (22, 1, YEAR(CURDATE()), 0, 10, 0, 10),
  (22, 2, YEAR(CURDATE()), 0, 15, 0, 15),
  (22, 3, YEAR(CURDATE()), 0,  5, 0,  5),
  -- Emily Chen (Recruiter 2)
  (23, 1, YEAR(CURDATE()), 0, 10, 0, 10),
  (23, 2, YEAR(CURDATE()), 0, 15, 0, 15),
  (23, 3, YEAR(CURDATE()), 0,  5, 0,  5);

-- ─────────────────────────────────────────────────────────────────────
-- 8. Also update staticData login mapping:
--    Frontend static users already have teamlead@yopmail.com (role 4)
--    and recruiter@yopmail.com (role 5) — added in migration 033 branch.
--    recruiter1@yopmail.com and recruiter2@yopmail.com are DB-only;
--    recruiter@yopmail.com maps to Mike Williams in the static file.
-- ─────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────
-- 9. Salary structures (basic package for display in payroll screens)
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM salary_structures WHERE employee_id IN (21, 22, 23);

INSERT INTO salary_structures (
  employee_id, effective_date,
  basic, hra, special_allowance, medical_allowance, travel_allowance,
  pf_employee, pf_employer, professional_tax, tds,
  gross_salary, net_salary, ctc
) VALUES
  -- Sarah Johnson — ₹18 LPA
  (21, '2021-04-01',
   75000, 30000, 15000, 1250, 1500,
   9000,  9000,  200,   5000,
   122750, 107550, 131750),
  -- Mike Williams — ₹12 LPA
  (22, '2022-07-15',
   50000, 20000, 10000, 1250, 1250,
   6000,  6000,  200,   2500,
   82500,  73800,  88500),
  -- Emily Chen — ₹10 LPA
  (23, '2023-01-10',
   42000, 16800,  8200, 1250, 1250,
   5040,  5040,   200,  1800,
   69500,  62460,  74540);

-- Done.
SELECT 'Migration 033 complete — 3 recruiter employees inserted.' AS status;
