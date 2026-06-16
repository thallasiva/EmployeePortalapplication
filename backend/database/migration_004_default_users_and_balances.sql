-- =====================================================================
-- Migration 004: Reset employee data + seed default users & sample leave balances
--
-- 1. Truncates all existing employee-related records (employees, users,
--    leave requests/balances, attendance, salary structures, etc.) so the
--    system starts from a clean slate.
-- 2. Creates 5 default login accounts:
--      - Admin                (admin@yopmail.com   / Admin@123)
--      - Reporting Manager    (manager@yopmail.com / Manager@123)
--      - Employee (General Shift) (employee.general@yopmail.com / Employee@123)
--      - Employee (Mid Shift)     (employee.mid@yopmail.com     / Employee@123)
--      - Employee (Night Shift)   (employee.night@yopmail.com   / Employee@123)
--    The three shift employees report to the Reporting Manager so the
--    leave-approval workflow (Admin + Reporting Manager) can be exercised.
-- 3. Seeds sample leave balances (Sick Leave, Earned Leave, Compensatory
--    Off) for the General Shift employee.
--
-- Safe to re-run (idempotent: truncates first, then re-inserts fixed rows).
-- =====================================================================

USE hrms_db;

-- ---------------------------------------------------------------------
-- 1. Truncate existing employee-related data
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE leave_balances;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE attendance;
TRUNCATE TABLE attendance_regularization;
TRUNCATE TABLE salary_structures;
TRUNCATE TABLE payslips;
TRUNCATE TABLE payroll_runs;
TRUNCATE TABLE employee_contact_info;
TRUNCATE TABLE employee_bank_details;
TRUNCATE TABLE team_members;
TRUNCATE TABLE users;
TRUNCATE TABLE employees;
TRUNCATE TABLE holidays;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 2. Default employees
-- ---------------------------------------------------------------------

-- Admin
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title,
  department_id, designation_id, employee_type, employee_status, shift, emp_joining_date
) VALUES (
  1, 'EMP00001', 'Admin', 'User', 'admin@yopmail.com', '9999999999', 'System Administrator',
  2, 3, 'Full-Time', 'Active', 'general', CURDATE()
);

-- Reporting Manager
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title,
  department_id, designation_id, employee_type, employee_status, shift, emp_joining_date
) VALUES (
  2, 'EMP00002', 'Reporting', 'Manager', 'manager@yopmail.com', '9999999998', 'Engineering Manager',
  1, 2, 'Full-Time', 'Active', 'general', CURDATE()
);

-- Employee - General Shift (reports to Reporting Manager)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title,
  department_id, designation_id, reporting_to, employee_type, employee_status, shift, emp_joining_date
) VALUES (
  3, 'EMP00003', 'General', 'Shift Employee', 'employee.general@yopmail.com', '9999999997', 'Software Engineer',
  1, 1, 2, 'Full-Time', 'Active', 'general', CURDATE()
);

-- Employee - Mid Shift (reports to Reporting Manager)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title,
  department_id, designation_id, reporting_to, employee_type, employee_status, shift, emp_joining_date
) VALUES (
  4, 'EMP00004', 'Mid', 'Shift Employee', 'employee.mid@yopmail.com', '9999999996', 'Software Engineer',
  1, 1, 2, 'Full-Time', 'Active', 'mid', CURDATE()
);

-- Employee - Night Shift (reports to Reporting Manager)
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title,
  department_id, designation_id, reporting_to, employee_type, employee_status, shift, emp_joining_date
) VALUES (
  5, 'EMP00005', 'Night', 'Shift Employee', 'employee.night@yopmail.com', '9999999995', 'Software Engineer',
  1, 1, 2, 'Full-Time', 'Active', 'night', CURDATE()
);

-- ---------------------------------------------------------------------
-- 3. Login accounts (password hashes generated with bcryptjs, cost 10)
--    admin@yopmail.com          -> Admin@123
--    manager@yopmail.com        -> Manager@123
--    employee.general@yopmail.com / employee.mid@yopmail.com / employee.night@yopmail.com -> Employee@123
-- ---------------------------------------------------------------------
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (1, 'admin@yopmail.com',            '$2b$10$7d7tY9j89EC1LCT3j3JYG.qyTuXA/UguIhas0z2nX/TjdaI2mGWXq', 1, 1, 'Active'),
  (2, 'manager@yopmail.com',          '$2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.', 3, 2, 'Active'),
  (3, 'employee.general@yopmail.com', '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 3, 'Active'),
  (4, 'employee.mid@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 4, 'Active'),
  (5, 'employee.night@yopmail.com',   '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 5, 'Active');

-- ---------------------------------------------------------------------
-- 4. Sample leave balances for the General Shift employee (employee_id = 3)
--    Sick Leave (1), Earned Leave (2), Compensatory Off (4)
-- ---------------------------------------------------------------------
INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance) VALUES
  (3, 1, YEAR(CURDATE()), 0, 10, 2, 8),   -- Sick Leave: 10 granted, 2 availed, 8 remaining
  (3, 2, YEAR(CURDATE()), 0, 15, 3, 12),  -- Earned Leave: 15 granted, 3 availed, 12 remaining
  (3, 4, YEAR(CURDATE()), 0, 2, 0, 2);    -- Compensatory Off: 2 granted, 0 availed, 2 remaining

-- ---------------------------------------------------------------------
-- 5. Sample holiday calendar (shown on the employee Holiday Calendar page
--    and the "Upcoming Holidays" card on the employee dashboard).
-- ---------------------------------------------------------------------
INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, is_restricted) VALUES
  ('Republic Day', CONCAT(YEAR(CURDATE()), '-01-26'), 'India - Default', 0),
  ('Holi', CONCAT(YEAR(CURDATE()), '-03-06'), 'India - Default', 1),
  ('Independence Day', CONCAT(YEAR(CURDATE()), '-08-15'), 'India - Default', 0),
  ('Raksha Bandhan', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'India - Default', 1),
  ('Ganesh Chaturthi', DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'India - Default', 0),
  ('Gandhi Jayanti', CONCAT(YEAR(CURDATE()), '-10-02'), 'India - Default', 0),
  ('Diwali', CONCAT(YEAR(CURDATE()), '-11-08'), 'India - Default', 0),
  ('Christmas', CONCAT(YEAR(CURDATE()), '-12-25'), 'India - Default', 0),
  ('New Year', CONCAT(YEAR(CURDATE()) + 1, '-01-01'), 'India - Default', 0);
