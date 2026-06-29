-- =====================================================================
-- NAT IT — Founders & Promoters Seed
-- Run: node src/database/runSql.js database/seed_natit_founders.sql
--
-- Hierarchy:
--   Lenin Kumar  (CEO / Admin)
--     └── Tirumala Rao  (Managing Director / Reporting Manager)
--           ├── Seetharamaiah  (Director / Employee)
--           ├── Srinivas Rao   (Director / Employee)
--           └── Radhey Shyam   (Director / Employee)
--
-- Password (all accounts): Natit@2024
-- =====================================================================

USE hrms_db;

-- ─────────────────────────────────────────────────────────────────────
-- 1. TRUNCATE all employee-dependent tables
-- ─────────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE reporting_history;
TRUNCATE TABLE workflow_delegates;
TRUNCATE TABLE it_proof_documents;
TRUNCATE TABLE it_declaration_items;
TRUNCATE TABLE it_declarations;
TRUNCATE TABLE appraisal_reviews;
TRUNCATE TABLE appraisal_rollouts;
TRUNCATE TABLE resignations;
TRUNCATE TABLE helpdesk_tickets;
TRUNCATE TABLE employee_tasks;
TRUNCATE TABLE timesheet_entries;
TRUNCATE TABLE timesheets;
TRUNCATE TABLE attendance_regularization;
TRUNCATE TABLE attendance;
TRUNCATE TABLE leave_balances;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE payslips;
TRUNCATE TABLE payroll_runs;
TRUNCATE TABLE salary_structures;
TRUNCATE TABLE employee_bank_details;
TRUNCATE TABLE employee_contact_info;
TRUNCATE TABLE team_members;
TRUNCATE TABLE users;
TRUNCATE TABLE employees;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Departments (upsert)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO departments (department_id, department_name, company_id) VALUES
  (1, 'Engineering',     1),
  (2, 'Human Resources', 1),
  (3, 'Finance',         1),
  (4, 'Design',          1),
  (5, 'Marketing',       1),
  (6, 'Sales',           1),
  (7, 'Operations',      1),
  (8, 'Management',      1),
  (9, 'Technology',      1)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Designations (upsert)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (1,  'Software Engineer',        1),
  (2,  'Senior Developer',         1),
  (3,  'HR Executive',             2),
  (4,  'UI/UX Designer',           4),
  (5,  'Accountant',               3),
  (6,  'Senior Software Engineer', 1),
  (7,  'Team Lead',                1),
  (8,  'Project Manager',          7),
  (9,  'Technical Architect',      1),
  (10, 'Engineering Manager',      1),
  (11, 'Delivery Manager',         7),
  (12, 'HR Manager',               2),
  (13, 'QA Lead',                  1),
  (14, 'Business Analyst',         7),
  (15, 'DevOps Engineer',          1),
  (16, 'Product Owner',            1),
  (17, 'Database Administrator',   1),
  (18, 'Chief Executive Officer',  8),
  (19, 'Managing Director',        8),
  (20, 'Director',                 8),
  (21, 'Promoter & Director',      8)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Employees
-- ─────────────────────────────────────────────────────────────────────

-- Lenin Kumar — CEO / Admin
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  1, 'NAT00001', 'Lenin Kumar', NULL, 'leninkumar@yopmail.com', '9000000001',
  'Chief Executive Officer', 8, 18,
  NULL, 'Full-Time', 'Active', 'general', '2015-01-01', 'new'
);

-- Tirumala Rao — Managing Director / Reporting Manager
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  2, 'NAT00002', 'Tirumala Rao', NULL, 'tirumalarao@yopmail.com', '9000000002',
  'Managing Director', 8, 19,
  1, 'Full-Time', 'Active', 'general', '2015-01-01', 'new'
);

-- Seetharamaiah — Promoter & Director
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  3, 'NAT00003', 'Seetharamaiah', NULL, 'seetharamaiah@yopmail.com', '9000000003',
  'Promoter & Director', 8, 21,
  2, 'Full-Time', 'Active', 'general', '2015-01-01', 'new'
);

-- Srinivas Rao — Promoter & Director
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  4, 'NAT00004', 'Srinivas Rao', NULL, 'srinivasrao@yopmail.com', '9000000004',
  'Promoter & Director', 8, 21,
  2, 'Full-Time', 'Active', 'general', '2015-01-01', 'new'
);

-- Radhey Shyam — Promoter & Director
INSERT INTO employees (
  employee_id, emp_code, first_name, last_name, email, mobile,
  emp_job_title, department_id, designation_id,
  reporting_to, employee_type, employee_status, shift, emp_joining_date, tax_regime
) VALUES (
  5, 'NAT00005', 'Radhey Shyam', NULL, 'radheysham@yopmail.com', '9000000005',
  'Promoter & Director', 8, 21,
  2, 'Full-Time', 'Active', 'general', '2015-01-01', 'new'
);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Login accounts  (password: Natit@2024)
--    role_id: 1=Admin  2=Employee  3=Reporting Manager
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status) VALUES
  (1, 'leninkumar@yopmail.com',    '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 1, 1, 'Active'),
  (2, 'tirumalarao@yopmail.com',   '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 3, 2, 'Active'),
  (3, 'seetharamaiah@yopmail.com', '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 3, 'Active'),
  (4, 'srinivasrao@yopmail.com',   '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 4, 'Active'),
  (5, 'radheysham@yopmail.com',    '$2a$10$qqJZdvL7ZuS1m5ypmkPDcOaVIORNSFarEBpl9LP1yEGmKrTmY50DW', 2, 5, 'Active');

-- ─────────────────────────────────────────────────────────────────────
-- 6. Leave balances (current year)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO leave_balances (employee_id, leave_type_id, year, opening_balance, granted, availed, balance)
SELECT e.employee_id, lt.leave_type_id, YEAR(CURDATE()), 0, lt.annual_quota, 0, lt.annual_quota
FROM employees e
CROSS JOIN leave_types lt
WHERE lt.annual_quota > 0 AND e.employee_status = 'Active';

-- ─────────────────────────────────────────────────────────────────────
-- 7. Holidays
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, is_restricted, shift) VALUES
  ('New Year Day',        CONCAT(YEAR(CURDATE()), '-01-01'), 'NAT IT - Default', 0, 'general'),
  ('Republic Day',        CONCAT(YEAR(CURDATE()), '-01-26'), 'NAT IT - Default', 0, 'general'),
  ('Ugadi',               CONCAT(YEAR(CURDATE()), '-03-30'), 'NAT IT - Default', 0, 'general'),
  ('Ram Navami',          CONCAT(YEAR(CURDATE()), '-04-06'), 'NAT IT - Default', 1, 'general'),
  ('Independence Day',    CONCAT(YEAR(CURDATE()), '-08-15'), 'NAT IT - Default', 0, 'general'),
  ('Gandhi Jayanti',      CONCAT(YEAR(CURDATE()), '-10-02'), 'NAT IT - Default', 0, 'general'),
  ('Diwali',              CONCAT(YEAR(CURDATE()), '-10-20'), 'NAT IT - Default', 0, 'general'),
  ('Diwali (Laxmi Puja)', CONCAT(YEAR(CURDATE()), '-10-21'), 'NAT IT - Default', 1, 'general'),
  ('Christmas',           CONCAT(YEAR(CURDATE()), '-12-25'), 'NAT IT - Default', 0, 'general');

-- ─────────────────────────────────────────────────────────────────────
-- Login credentials (password: Natit@2024)
--   Admin            : leninkumar@yopmail.com
--   Reporting Manager: tirumalarao@yopmail.com
--   Employee         : seetharamaiah@yopmail.com
--   Employee         : srinivasrao@yopmail.com
--   Employee         : radheysham@yopmail.com
-- ─────────────────────────────────────────────────────────────────────
