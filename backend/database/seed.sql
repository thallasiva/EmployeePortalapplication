-- =====================================================================
-- HRMS Backend - Seed Data
-- Run AFTER schema.sql and procedures.sql
-- =====================================================================

USE hrms_db;

-- Roles
INSERT INTO roles (role_id, role_name, description) VALUES
  (1, 'Admin', 'Full system access'),
  (2, 'Employee', 'Standard employee access'),
  (3, 'Reporting Manager', 'Team management access')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Company
INSERT INTO companies (company_id, company_name, address, email) VALUES
  (1, 'NAT IT Services', 'Hyderabad, India', 'info@natit.com'),
  (2, 'NAT IT Solutions Pvt Ltd', 'Bangalore, India', 'info@natitsolutions.com')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- Departments
INSERT INTO departments (department_id, department_name, company_id) VALUES
  (1, 'Engineering', 1),
  (2, 'Human Resources', 1),
  (3, 'Finance', 1),
  (4, 'Design', 1),
  (5, 'Marketing', 1),
  (6, 'Sales', 1),
  (7, 'Operations', 1)
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

-- Designations
INSERT INTO designations (designation_id, designation_name, department_id) VALUES
  (1, 'Software Engineer', 1),
  (2, 'Senior Developer', 1),
  (3, 'HR Executive', 2),
  (4, 'UI/UX Designer', 4),
  (5, 'Accountant', 3)
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

-- Offices
INSERT INTO offices (office_id, office_name, location, holiday_calendar) VALUES
  (1, 'HQ - Hyderabad', 'Hyderabad', 'India - Default'),
  (2, 'Bangalore Office', 'Bangalore', 'Karnataka'),
  (3, 'Chennai Office', 'Chennai', 'India - Default'),
  (4, 'Mumbai Office', 'Mumbai', 'India - Default')
ON DUPLICATE KEY UPDATE office_name = VALUES(office_name);

-- Leave Types
INSERT INTO leave_types (leave_type_id, leave_type_name, annual_quota, carry_forward_limit, requires_proof, description) VALUES
  (1, 'Sick Leave', 10, 0, 1, '10 days/year, medical proof required for 3+ consecutive days'),
  (2, 'Earned Leave', 15, 5, 0, '15 days/year, 1.25 days/month accrual, up to 5 days carryover'),
  (3, 'Casual Leave', 5, 0, 0, '5 days/year, no carryover, requires 1-day advance notice'),
  (4, 'Compensatory Off', 0, 0, 0, 'Granted for extra hours worked')
ON DUPLICATE KEY UPDATE leave_type_name = VALUES(leave_type_name);

-- Document categories
INSERT INTO document_categories (category_id, category_name) VALUES
  (1, 'policies'), (2, 'handbooks'), (3, 'templates'), (4, 'forms')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- Review types
INSERT INTO review_types (review_type_id, name, description, frequency) VALUES
  (1, 'Annual Performance Review', 'Yearly performance evaluation', 'Annual'),
  (2, 'Probation Review', 'Review at end of probation period', 'One-time'),
  (3, 'Quarterly Check-in', 'Quarterly goal review', 'Quarterly')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Leadership roles
INSERT INTO leadership_roles (leadership_role_id, role_name, description) VALUES
  (1, 'Team Lead', 'Leads a project team'),
  (2, 'Manager', 'Departmental manager'),
  (3, 'VP', 'Vice president / senior leadership')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Permissions matrix (module x action)
INSERT INTO permissions (module, action)
SELECT m.module, a.action FROM
  (SELECT 'employees' AS module UNION SELECT 'attendance' UNION SELECT 'leave' UNION SELECT 'payroll'
   UNION SELECT 'teams' UNION SELECT 'documents' UNION SELECT 'helpdesk' UNION SELECT 'hiring'
   UNION SELECT 'reviews' UNION SELECT 'reports' UNION SELECT 'settings') m
  CROSS JOIN (SELECT 'view' AS action UNION SELECT 'add' UNION SELECT 'edit' UNION SELECT 'delete') a
ON DUPLICATE KEY UPDATE module = m.module;

-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT 1, permission_id, 1 FROM permissions
ON DUPLICATE KEY UPDATE allowed = 1;

-- Employee gets view-only on most modules + add on leave/attendance/helpdesk
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT 2, permission_id, 1 FROM permissions
WHERE action = 'view'
ON DUPLICATE KEY UPDATE allowed = 1;

INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT 2, permission_id, 1 FROM permissions
WHERE action = 'add' AND module IN ('leave','attendance','helpdesk','hiring')
ON DUPLICATE KEY UPDATE allowed = 1;

-- Reporting Manager: view all + add/edit on leave, attendance, reviews, teams
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT 3, permission_id, 1 FROM permissions
WHERE action = 'view'
ON DUPLICATE KEY UPDATE allowed = 1;

INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT 3, permission_id, 1 FROM permissions
WHERE action IN ('add','edit') AND module IN ('leave','attendance','reviews','teams','helpdesk')
ON DUPLICATE KEY UPDATE allowed = 1;

-- Default admin employee + login (password: Admin@123)
INSERT INTO employees (employee_id, emp_code, first_name, last_name, email, mobile, emp_job_title, department_id, designation_id, employee_type, employee_status, emp_joining_date)
VALUES (1, 'EMP00001', 'Admin', 'User', 'admin@yopmail.com', '9999999999', 'System Administrator', 2, 3, 'Full-Time', 'Active', CURDATE())
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- password_hash below corresponds to bcrypt hash of "Admin@123"
INSERT INTO users (user_id, email, password_hash, role_id, employee_id, status)
VALUES (1, 'admin@yopmail.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8WJpxa7AlHU3wLLlSwxbsZpcyPYDIO', 1, 1, 'Active')
ON DUPLICATE KEY UPDATE email = VALUES(email);
