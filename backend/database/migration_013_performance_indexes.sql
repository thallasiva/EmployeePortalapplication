-- migration_013: Performance indexes for common query paths
-- Run once: mysql -u root -p hrms_db < migration_013_performance_indexes.sql

USE hrms_db;

-- users: FK to employees (used in every JOIN for /auth/me)
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_employee_id (employee_id);

-- users: role lookup
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_users_role_id (role_id);

-- employees: emp_code lookups
ALTER TABLE employees
  ADD INDEX IF NOT EXISTS idx_employees_emp_code (emp_code);

-- salary_structures: look up by employee
ALTER TABLE salary_structures
  ADD INDEX IF NOT EXISTS idx_salary_structure_employee (employee_id);

-- payslips: most common filter (employee + month + year)
ALTER TABLE payslips
  ADD INDEX IF NOT EXISTS idx_payslips_emp_month_year (employee_id, month, year);

-- attendance: today's record lookup
ALTER TABLE attendance
  ADD INDEX IF NOT EXISTS idx_attendance_emp_date (employee_id, attendance_date);

-- leave_requests: balance lookups per employee
ALTER TABLE leave_requests
  ADD INDEX IF NOT EXISTS idx_leave_requests_employee (employee_id, status);
