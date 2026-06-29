-- =====================================================================
-- Fix org hierarchy: Admin user's employee becomes the true root (CEO)
-- All orphaned employees (reporting_to = NULL) are assigned to the admin
--
-- Run: node src/database/runSql.js database/fix_hierarchy_ceo.sql
--   OR paste into MySQL Workbench
-- =====================================================================

USE hrms_db;

-- Step 1: Find admin employee_id (role_id = 1)
SET @admin_emp_id = (
  SELECT employee_id FROM users
  WHERE role_id = 1 AND employee_id IS NOT NULL
  LIMIT 1
);

SELECT CONCAT('Admin employee_id = ', @admin_emp_id) AS info;

-- Step 2: Admin gets reporting_to = NULL (they are the top)
UPDATE employees
   SET reporting_to = NULL
 WHERE employee_id = @admin_emp_id;

-- Step 3: Everyone else with NULL reporting_to now reports to admin
UPDATE employees
   SET reporting_to = @admin_emp_id
 WHERE employee_id != @admin_emp_id
   AND (reporting_to IS NULL OR reporting_to = 0)
   AND employee_status = 'Active';

-- Verify
SELECT
  e.employee_id,
  CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS name,
  d.designation_name,
  e.reporting_to,
  CONCAT(m.first_name, ' ', IFNULL(m.last_name,'')) AS reports_to_name
FROM employees e
LEFT JOIN designations d ON d.designation_id = e.designation_id
LEFT JOIN employees m    ON m.employee_id = e.reporting_to
WHERE e.employee_status = 'Active'
ORDER BY e.reporting_to IS NULL DESC, e.employee_id;
