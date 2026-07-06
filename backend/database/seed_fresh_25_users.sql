-- =====================================================================
-- FRESH SEED: 1 Admin + 3 Reporting Managers + 1 HR Manager +
--             2 Recruiters + 20 Regular Employees  (27 total)
-- =====================================================================
-- Run in MySQL:
--   source C:/TimeSheet/humanresourceshradmintemplate/backend/database/seed_fresh_25_users.sql
--
-- Passwords:
--   admin@yopmail.com            → Admin@123
--   manager1/2/3@yopmail.com     → Manager@123
--   hrmanager@yopmail.com        → Manager@123
--   recruiter1/2@yopmail.com     → Test@123
--   All 20 employees             → Employee@123
-- =====================================================================

USE hrms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────
-- 1. TRUNCATE ALL TRANSACTIONAL TABLES
-- ─────────────────────────────────────────────────────────────────────
TRUNCATE TABLE workflow_delegates;
TRUNCATE TABLE reporting_history;
TRUNCATE TABLE rec_resume_matches;
TRUNCATE TABLE rec_audit_log;
TRUNCATE TABLE rec_onboarding;
TRUNCATE TABLE rec_offers;
TRUNCATE TABLE rec_interviews;
TRUNCATE TABLE rec_candidates;
TRUNCATE TABLE rec_job_recruiters;
TRUNCATE TABLE rec_job_requests;
TRUNCATE TABLE self_appraisals;
TRUNCATE TABLE appraisal_enrollments;
TRUNCATE TABLE appraisal_ratings;
TRUNCATE TABLE appraisal_cycles;
TRUNCATE TABLE it_proof_documents;
TRUNCATE TABLE it_declaration_items;
TRUNCATE TABLE it_declarations;
TRUNCATE TABLE it_declaration_cycles;
TRUNCATE TABLE resignations;
TRUNCATE TABLE extra_work_requests;
TRUNCATE TABLE timesheet_entries;
TRUNCATE TABLE weekly_timesheets;
TRUNCATE TABLE employee_tasks;
TRUNCATE TABLE employee_work_schedules;
TRUNCATE TABLE helpdesk_comments;
TRUNCATE TABLE helpdesk_tickets;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE salary_audit_log;
TRUNCATE TABLE reviews;
TRUNCATE TABLE leave_balances;
TRUNCATE TABLE leave_requests;
TRUNCATE TABLE attendance_regularization;
TRUNCATE TABLE attendance;
TRUNCATE TABLE payslips;
TRUNCATE TABLE payroll_runs;
TRUNCATE TABLE salary_structures;
TRUNCATE TABLE team_members;
TRUNCATE TABLE teams;
TRUNCATE TABLE mfa_temp_tokens;
TRUNCATE TABLE users;
TRUNCATE TABLE employee_bank_details;
TRUNCATE TABLE employee_contact_info;
TRUNCATE TABLE employees;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────
-- 2. ENSURE ROLES EXIST
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO roles (role_id, role_name, description) VALUES
  (1, 'Admin',                'Full system access'),
  (2, 'Employee',             'Standard employee access'),
  (3, 'Reporting Manager',    'Team management access'),
  (4, 'HR Manager',           'Leads recruitment team; approves offers'),
  (5, 'Recruiter',            'Manages assigned requirements and candidate pipeline')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description);

-- ─────────────────────────────────────────────────────────────────────
-- 3. ENSURE DEPARTMENTS EXIST
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO departments (department_id, department_name, company_id) VALUES
  (1, 'Engineering',     1),
  (2, 'Human Resources', 1),
  (3, 'Finance',         1),
  (4, 'Design',          1),
  (5, 'Marketing',       1),
  (6, 'Sales',           1),
  (7, 'Operations',      1),
  (8, 'Recruitment',     1)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- ─────────────────────────────────────────────────────────────────────
-- 4. ENSURE DESIGNATIONS EXIST
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (1,  'Software Engineer',     1),
  (2,  'Senior Developer',      1),
  (3,  'HR Executive',          2),
  (4,  'UI/UX Designer',        4),
  (5,  'Accountant',            3),
  (6,  'Engineering Manager',   1),
  (7,  'Operations Manager',    7),
  (8,  'DevOps Engineer',       1),
  (9,  'Finance Executive',     3),
  (10, 'Sales Executive',       6),
  (11, 'Marketing Executive',   5),
  (12, 'Operations Executive',  7),
  (13, 'HR Coordinator',        2),
  (14, 'Senior Accountant',     3),
  (15, 'Tech Lead',             1),
  (16, 'Finance Analyst',       3),
  (17, 'Marketing Analyst',     5),
  (18, 'Recruiter Team Lead',   8),
  (19, 'Recruiter',             8),
  (20, 'System Administrator',  2)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name), department_id = VALUES(department_id);

-- ─────────────────────────────────────────────────────────────────────
-- 5. ENSURE OFFICE EXISTS
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO offices (office_id, office_name, location, holiday_calendar) VALUES
  (1, 'HQ - Hyderabad', 'Hyderabad', 'India - Default')
ON DUPLICATE KEY UPDATE office_name = VALUES(office_name);

-- ─────────────────────────────────────────────────────────────────────
-- 6. EMPLOYEES
--    IDs 1   : Admin
--    IDs 2-4 : Reporting Managers
--    ID  5   : HR Manager (role 4)
--    IDs 6-12: 7 employees under Manager 1 (Engineering)
--    IDs 13-19: 7 employees under Manager 2 (HR/Finance)
--    IDs 20-25: 6 employees under Manager 3 (Ops/Sales/Marketing)
--    IDs 26-27: Recruiters (report to HR Manager)
-- ─────────────────────────────────────────────────────────────────────

-- ── Admin ──────────────────────────────────────────────────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,office_id,employee_type,employee_status,
  shift,emp_joining_date,ctc,base_salary)
VALUES
(1,'EMP001','Vikram','Nair','admin@yopmail.com','9000000001','Male',
 'System Administrator',2,20,1,'Full-Time','Active','general','2020-01-01',1200000,60000);

-- ── Reporting Managers ─────────────────────────────────────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,office_id,employee_type,employee_status,
  shift,emp_joining_date,ctc,base_salary)
VALUES
(2,'EMP002','Arjun','Kumar','manager1@yopmail.com','9000000002','Male',
 'Engineering Manager',1,6,1,'Full-Time','Active','general','2019-03-01',2400000,110000),
(3,'EMP003','Priya','Sharma','manager2@yopmail.com','9000000003','Female',
 'HR Manager',2,3,1,'Full-Time','Active','general','2019-06-01',1800000,85000),
(4,'EMP004','Rajesh','Patel','manager3@yopmail.com','9000000004','Male',
 'Operations Manager',7,7,1,'Full-Time','Active','general','2020-02-01',2000000,95000);

-- ── HR Manager / Recruiter Admin ───────────────────────────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,reporting_to,office_id,employee_type,
  employee_status,shift,emp_joining_date,ctc,base_salary)
VALUES
(5,'EMP005','Sneha','Reddy','hrmanager@yopmail.com','9000000005','Female',
 'HR Manager',8,18,1,1,'Full-Time','Active','general','2020-08-01',1800000,80000);

-- ── 7 Employees under Arjun Kumar (Engineering) ───────────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,reporting_to,office_id,employee_type,
  employee_status,shift,emp_joining_date,ctc,base_salary)
VALUES
(6, 'EMP006','Karthik','Iyer',  'karthik@yopmail.com', '9000000006','Male',  'Software Engineer',1,1, 2,1,'Full-Time','Active','general','2021-04-01',900000, 40000),
(7, 'EMP007','Divya',  'Menon', 'divya@yopmail.com',   '9000000007','Female','Software Engineer',1,1, 2,1,'Full-Time','Active','general','2021-06-15',900000, 40000),
(8, 'EMP008','Suresh', 'Rajan', 'suresh@yopmail.com',  '9000000008','Male',  'Senior Developer', 1,2, 2,1,'Full-Time','Active','general','2020-09-01',1500000,65000),
(9, 'EMP009','Kavitha','Krishnan','kavitha@yopmail.com','9000000009','Female','Software Engineer',1,1, 2,1,'Full-Time','Active','general','2022-01-10',900000, 40000),
(10,'EMP010','Aditya', 'Singh',  'aditya@yopmail.com', '9000000010','Male',  'DevOps Engineer',  1,8, 2,1,'Full-Time','Active','general','2021-11-01',1200000,55000),
(11,'EMP011','Pooja',  'Mehta',  'pooja@yopmail.com',  '9000000011','Female','Senior Developer', 1,2, 2,1,'Full-Time','Active','general','2020-07-15',1500000,65000),
(12,'EMP012','Manoj',  'Verma',  'manoj@yopmail.com',  '9000000012','Male',  'Tech Lead',        1,15,2,1,'Full-Time','Active','general','2019-10-01',1800000,80000);

-- ── 7 Employees under Priya Sharma (HR/Finance) ───────────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,reporting_to,office_id,employee_type,
  employee_status,shift,emp_joining_date,ctc,base_salary)
VALUES
(13,'EMP013','Ananya',  'Nair',   'ananya@yopmail.com', '9000000013','Female','HR Executive',   2,3, 3,1,'Full-Time','Active','general','2021-02-01',720000,32000),
(14,'EMP014','Rohan',   'Das',    'rohan@yopmail.com',  '9000000014','Male',  'Finance Executive',3,9,3,1,'Full-Time','Active','general','2021-09-01',900000,40000),
(15,'EMP015','Deepa',   'Pillai', 'deepa@yopmail.com',  '9000000015','Female','HR Coordinator', 2,13,3,1,'Full-Time','Active','general','2022-03-15',720000,32000),
(16,'EMP016','Sanjay',  'Gupta',  'sanjay@yopmail.com', '9000000016','Male',  'Senior Accountant',3,14,3,1,'Full-Time','Active','general','2020-11-01',1200000,55000),
(17,'EMP017','Lakshmi', 'Suresh', 'lakshmi@yopmail.com','9000000017','Female','HR Executive',   2,3, 3,1,'Full-Time','Active','general','2022-07-01',720000,32000),
(18,'EMP018','Ravi',    'Shankar','ravi@yopmail.com',   '9000000018','Male',  'Finance Analyst', 3,16,3,1,'Full-Time','Active','general','2021-05-10',900000,40000),
(19,'EMP019','Meena',   'Kumari', 'meena@yopmail.com',  '9000000019','Female','HR Executive',   2,3, 3,1,'Full-Time','Active','general','2023-01-10',720000,32000);

-- ── 6 Employees under Rajesh Patel (Ops/Sales/Marketing) ──────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,reporting_to,office_id,employee_type,
  employee_status,shift,emp_joining_date,ctc,base_salary)
VALUES
(20,'EMP020','Prakash',  'Rao',       'prakash@yopmail.com','9000000020','Male',  'Sales Executive',   6,10,4,1,'Full-Time','Active','general','2021-08-01',900000,40000),
(21,'EMP021','Sunita',   'Joshi',     'sunita@yopmail.com', '9000000021','Female','Marketing Executive',5,11,4,1,'Full-Time','Active','general','2022-02-15',900000,40000),
(22,'EMP022','Amit',     'Bhat',      'amit@yopmail.com',   '9000000022','Male',  'Operations Executive',7,12,4,1,'Full-Time','Active','general','2021-10-01',900000,40000),
(23,'EMP023','Neha',     'Kapoor',    'neha@yopmail.com',   '9000000023','Female','Sales Executive',   6,10,4,1,'Full-Time','Active','general','2022-05-01',900000,40000),
(24,'EMP024','Venkat',   'Subramaniam','venkat@yopmail.com','9000000024','Male',  'Operations Executive',7,12,4,1,'Full-Time','Active','general','2022-09-01',900000,40000),
(25,'EMP025','Pallavi',  'Singh',     'pallavi@yopmail.com','9000000025','Female','Marketing Analyst', 5,17,4,1,'Full-Time','Active','general','2023-03-01',840000,37000);

-- ── 2 Recruiters (report to HR Manager Sneha Reddy) ───────────────
INSERT INTO employees (employee_id,emp_code,first_name,last_name,email,mobile,gender,
  emp_job_title,department_id,designation_id,reporting_to,office_id,employee_type,
  employee_status,shift,emp_joining_date,ctc,base_salary)
VALUES
(26,'EMP026','Sarah',  'Johnson', 'recruiter1@yopmail.com','9000000026','Female','Recruiter',8,19,5,1,'Full-Time','Active','general','2022-04-01',900000,40000),
(27,'EMP027','Rahul',  'Mehta',   'recruiter2@yopmail.com','9000000027','Male',  'Recruiter',8,19,5,1,'Full-Time','Active','general','2023-02-01',840000,37000);

-- ─────────────────────────────────────────────────────────────────────
-- 7. USER ACCOUNTS
--    Admin@123     hash: $2b$10$7d7tY9j89EC1LCT3j3JYG.qyTuXA/UguIhas0z2nX/TjdaI2mGWXq
--    Manager@123   hash: $2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.
--    Employee@123  hash: $2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2
--    Test@123      hash: $2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO users (user_id,email,password_hash,role_id,employee_id,status) VALUES
-- Admin
(1,  'admin@yopmail.com',      '$2b$10$7d7tY9j89EC1LCT3j3JYG.qyTuXA/UguIhas0z2nX/TjdaI2mGWXq', 1, 1,  'Active'),
-- Reporting Managers
(2,  'manager1@yopmail.com',   '$2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.', 3, 2,  'Active'),
(3,  'manager2@yopmail.com',   '$2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.', 3, 3,  'Active'),
(4,  'manager3@yopmail.com',   '$2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.', 3, 4,  'Active'),
-- HR Manager
(5,  'hrmanager@yopmail.com',  '$2b$10$2OdX4zjvyEfokmaae.LckuvuzinmQ9A5CIyzGs4neipOg8Sa0dmO.', 4, 5,  'Active'),
-- 20 Regular Employees
(6,  'karthik@yopmail.com',    '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 6,  'Active'),
(7,  'divya@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 7,  'Active'),
(8,  'suresh@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 8,  'Active'),
(9,  'kavitha@yopmail.com',    '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 9,  'Active'),
(10, 'aditya@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 10, 'Active'),
(11, 'pooja@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 11, 'Active'),
(12, 'manoj@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 12, 'Active'),
(13, 'ananya@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 13, 'Active'),
(14, 'rohan@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 14, 'Active'),
(15, 'deepa@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 15, 'Active'),
(16, 'sanjay@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 16, 'Active'),
(17, 'lakshmi@yopmail.com',    '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 17, 'Active'),
(18, 'ravi@yopmail.com',       '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 18, 'Active'),
(19, 'meena@yopmail.com',      '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 19, 'Active'),
(20, 'prakash@yopmail.com',    '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 20, 'Active'),
(21, 'sunita@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 21, 'Active'),
(22, 'amit@yopmail.com',       '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 22, 'Active'),
(23, 'neha@yopmail.com',       '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 23, 'Active'),
(24, 'venkat@yopmail.com',     '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 24, 'Active'),
(25, 'pallavi@yopmail.com',    '$2b$10$i9tItK26cOgpCbFn4h4f0uEHwx4o11EXn9X636DCWMXHTpBCpLvO2', 2, 25, 'Active'),
-- Recruiters
(26, 'recruiter1@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 26, 'Active'),
(27, 'recruiter2@yopmail.com', '$2a$10$foYEOSL4CBGFcBKjoEwz4u8AiyjD/BqTYcWr71ZuFjS9VGeG21CTG', 5, 27, 'Active');

-- ─────────────────────────────────────────────────────────────────────
-- 8. LEAVE BALANCES (current year, all employees)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO leave_balances (employee_id,leave_type_id,year,opening_balance,granted,availed,balance)
SELECT e.employee_id, lt.leave_type_id, YEAR(CURDATE()), 0, lt.annual_quota, 0, lt.annual_quota
FROM employees e
CROSS JOIN leave_types lt
WHERE lt.leave_type_id IN (1,2,3)
ON DUPLICATE KEY UPDATE granted = lt.annual_quota, balance = lt.annual_quota;

-- ─────────────────────────────────────────────────────────────────────
-- 9. SALARY STRUCTURES (basic packages)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO salary_structures
  (employee_id,effective_date,basic,hra,special_allowance,medical_allowance,travel_allowance,
   pf_employee,pf_employer,professional_tax,tds,gross_salary,net_salary,ctc)
VALUES
-- Admin
(1, '2020-01-01',  50000,20000,10000,1250,1250, 6000,6000,200,2500, 82500, 73800, 88500),
-- Reporting Managers
(2, '2019-03-01', 110000,44000,22000,1250,1500,13200,13200,200,8000,178750,157350,191950),
(3, '2019-06-01',  85000,34000,17000,1250,1500,10200,10200,200,6000,138750,122350,149150),
(4, '2020-02-01',  95000,38000,19000,1250,1500,11400,11400,200,7000,154750,136350,166150),
-- HR Manager
(5, '2020-08-01',  80000,32000,16000,1250,1500, 9600, 9600,200,5500,130750,115450,140350),
-- Engineering team (emp 6–12)
(6,  '2021-04-01', 40000,16000, 8000,1250,1250, 4800, 4800,200,1500, 66500, 60000, 71300),
(7,  '2021-06-15', 40000,16000, 8000,1250,1250, 4800, 4800,200,1500, 66500, 60000, 71300),
(8,  '2020-09-01', 65000,26000,13000,1250,1250, 7800, 7800,200,4000,106500, 94500,114300),
(9,  '2022-01-10', 40000,16000, 8000,1250,1250, 4800, 4800,200,1500, 66500, 60000, 71300),
(10, '2021-11-01', 55000,22000,11000,1250,1250, 6600, 6600,200,3000, 90500, 80700, 97100),
(11, '2020-07-15', 65000,26000,13000,1250,1250, 7800, 7800,200,4000,106500, 94500,114300),
(12, '2019-10-01', 80000,32000,16000,1250,1250, 9600, 9600,200,5500,130500,115200,140100),
-- HR/Finance team (emp 13–19)
(13, '2021-02-01', 32000,12800, 6400,1250,1000, 3840, 3840,200,1000, 53450, 48410, 57290),
(14, '2021-09-01', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(15, '2022-03-15', 32000,12800, 6400,1250,1000, 3840, 3840,200,1000, 53450, 48410, 57290),
(16, '2020-11-01', 55000,22000,11000,1250,1000, 6600, 6600,200,3000, 90250, 80450, 96850),
(17, '2022-07-01', 32000,12800, 6400,1250,1000, 3840, 3840,200,1000, 53450, 48410, 57290),
(18, '2021-05-10', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(19, '2023-01-10', 32000,12800, 6400,1250,1000, 3840, 3840,200,1000, 53450, 48410, 57290),
-- Ops/Sales/Marketing team (emp 20–25)
(20, '2021-08-01', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(21, '2022-02-15', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(22, '2021-10-01', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(23, '2022-05-01', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(24, '2022-09-01', 40000,16000, 8000,1250,1000, 4800, 4800,200,1500, 66250, 59750, 71050),
(25, '2023-03-01', 37000,14800, 7400,1250,1000, 4440, 4440,200,1200, 61450, 55610, 65890),
-- Recruiters (emp 26–27)
(26, '2022-04-01', 40000,16000, 8000,1250,1250, 4800, 4800,200,1500, 66500, 60000, 71300),
(27, '2023-02-01', 37000,14800, 7400,1250,1250, 4440, 4440,200,1200, 61700, 55860, 66140);

-- ─────────────────────────────────────────────────────────────────────
-- 10. HOLIDAYS (current year)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO holidays (holiday_name, holiday_date, holiday_calendar, is_restricted) VALUES
  ('New Year',          CONCAT(YEAR(CURDATE()),'-01-01'), 'India - Default', 0),
  ('Republic Day',      CONCAT(YEAR(CURDATE()),'-01-26'), 'India - Default', 0),
  ('Holi',              CONCAT(YEAR(CURDATE()),'-03-14'), 'India - Default', 1),
  ('Good Friday',       CONCAT(YEAR(CURDATE()),'-04-18'), 'India - Default', 1),
  ('Eid ul-Fitr',       CONCAT(YEAR(CURDATE()),'-04-21'), 'India - Default', 1),
  ('Independence Day',  CONCAT(YEAR(CURDATE()),'-08-15'), 'India - Default', 0),
  ('Gandhi Jayanti',    CONCAT(YEAR(CURDATE()),'-10-02'), 'India - Default', 0),
  ('Diwali',            CONCAT(YEAR(CURDATE()),'-10-20'), 'India - Default', 0),
  ('Christmas',         CONCAT(YEAR(CURDATE()),'-12-25'), 'India - Default', 0)
ON DUPLICATE KEY UPDATE holiday_name = VALUES(holiday_name);

-- ─────────────────────────────────────────────────────────────────────
-- SUMMARY
-- ─────────────────────────────────────────────────────────────────────
SELECT CONCAT(
  'Done! ',
  (SELECT COUNT(*) FROM employees), ' employees | ',
  (SELECT COUNT(*) FROM users), ' users | ',
  (SELECT COUNT(*) FROM leave_balances), ' leave balance rows'
) AS result;

SELECT
  r.role_name,
  COUNT(u.user_id) AS count
FROM users u
JOIN roles r ON r.role_id = u.role_id
GROUP BY r.role_id, r.role_name
ORDER BY r.role_id;
