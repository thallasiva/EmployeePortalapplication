-- ============================================================
-- STEP 1: Diagnose — see Michael's current user + role setup
-- ============================================================
SELECT
  u.user_id,
  u.email,
  u.role_id,
  r.role_name,
  u.employee_id,
  e.first_name,
  e.last_name,
  e.emp_job_title,
  (SELECT COUNT(*) FROM employees WHERE reporting_to = u.employee_id) AS direct_reports
FROM users u
LEFT JOIN roles r ON r.role_id = u.role_id
LEFT JOIN employees e ON e.employee_id = u.employee_id
WHERE u.email = 'michael.j@company.com';

-- ============================================================
-- STEP 2: See all roles available
-- ============================================================
SELECT role_id, role_name FROM roles ORDER BY role_id;

-- ============================================================
-- STEP 3: Fix — set Michael's role to "Reporting Manager"
--  (role_id=3 is standard; confirm from STEP 2 output first)
-- ============================================================
UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'Reporting Manager' LIMIT 1)
WHERE email = 'michael.j@company.com';

-- ============================================================
-- STEP 4: Also fix any other user whose employee record
--  has direct reports but whose role is still "Employee"
-- ============================================================
UPDATE users u
JOIN (
  SELECT DISTINCT reporting_to AS emp_id
  FROM employees
  WHERE reporting_to IS NOT NULL
) managers ON managers.emp_id = u.employee_id
JOIN roles r ON r.role_id = u.role_id AND r.role_name = 'Employee'
SET u.role_id = (SELECT role_id FROM roles WHERE role_name = 'Reporting Manager' LIMIT 1)
WHERE u.employee_id IS NOT NULL;

-- ============================================================
-- STEP 5: Verify fix
-- ============================================================
SELECT u.email, r.role_name, u.employee_id,
  (SELECT COUNT(*) FROM employees WHERE reporting_to = u.employee_id) AS direct_reports
FROM users u
JOIN roles r ON r.role_id = u.role_id
WHERE r.role_name = 'Reporting Manager'
ORDER BY u.email;
