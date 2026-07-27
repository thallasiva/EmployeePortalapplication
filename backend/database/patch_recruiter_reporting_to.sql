-- ============================================================
-- Patch: Set reporting_to for all Recruiter (role_id=5) employees
-- to point to the HR Manager (role_id=4) employee.
-- Safe to run multiple times (idempotent).
-- ============================================================
USE hrms_db;

-- Step 1: Find the HR Manager's employee_id
SET @hr_manager_id = (
  SELECT e.employee_id
  FROM employees e
  JOIN users u ON u.employee_id = e.employee_id
  WHERE u.role_id = 4
  LIMIT 1
);

SELECT CONCAT('HR Manager employee_id = ', IFNULL(@hr_manager_id, 'NOT FOUND')) AS info;

-- Step 2: Update all Recruiter employees to report to HR Manager
UPDATE employees e
JOIN users u ON u.employee_id = e.employee_id
SET e.reporting_to = @hr_manager_id
WHERE u.role_id = 5
  AND @hr_manager_id IS NOT NULL;

SELECT ROW_COUNT() AS recruiters_updated;

-- Step 3: Verify
SELECT e.employee_id, e.first_name, e.last_name, e.reporting_to,
       u.role_id,
       CONCAT(m.first_name,' ',m.last_name) AS reports_to
FROM employees e
JOIN users u ON u.employee_id = e.employee_id
LEFT JOIN employees m ON m.employee_id = e.reporting_to
WHERE u.role_id = 5;
