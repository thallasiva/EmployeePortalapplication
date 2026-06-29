-- =====================================================================
-- NAT IT — Full Hierarchy & Designation Fix
-- Run this ONCE to correct:
--   1. Remove "Cheedella" last names from founders
--   2. Assign correct designations to each founder
--   3. Set correct reporting_to hierarchy for all 8 employees
--
-- Run: node src/database/runSql.js database/fix_all_hierarchy.sql
--   OR paste into MySQL Workbench
-- =====================================================================

USE hrms_db;

-- ─── Step 1: Get Admin employee_id (Lenin Kumar, role_id=1) ──────────────────
SET @admin_emp_id = (
  SELECT u.employee_id FROM users u
  WHERE u.role_id = 1 AND u.employee_id IS NOT NULL
  LIMIT 1
);

SELECT CONCAT('Admin (Lenin Kumar) employee_id = ', @admin_emp_id) AS info;

-- ─── Step 2: Ensure designations 18–21 exist ─────────────────────────────────
INSERT INTO designations (designation_id, designation_name) VALUES
  (18, 'Chief Executive Officer'),
  (19, 'Managing Director'),
  (20, 'Director'),
  (21, 'Promoter & Director')
ON DUPLICATE KEY UPDATE designation_name = VALUES(designation_name);

-- ─── Step 3: Fix Lenin Kumar (Admin) — CEO, no last name ─────────────────────
UPDATE employees
   SET first_name    = 'Lenin Kumar',
       last_name     = NULL,
       designation_id = 18,         -- Chief Executive Officer
       reporting_to  = NULL          -- org root
 WHERE employee_id = @admin_emp_id;

-- ─── Step 4: Fix Tirumala Rao — Managing Director, reports to Lenin Kumar ─────
UPDATE employees
   SET first_name    = 'Tirumala Rao',
       last_name     = NULL,
       designation_id = 19,          -- Managing Director
       reporting_to  = @admin_emp_id
 WHERE first_name LIKE '%Tirumala%'
   AND employee_id != @admin_emp_id;

-- Get Tirumala Rao's employee_id for downstream use
SET @tirumala_id = (
  SELECT employee_id FROM employees
  WHERE first_name LIKE '%Tirumala%' AND employee_id != @admin_emp_id
  LIMIT 1
);

SELECT CONCAT('Tirumala Rao employee_id = ', @tirumala_id) AS info;

-- ─── Step 5: Fix Srinivas Rao — Promoter & Director, reports to Tirumala ─────
UPDATE employees
   SET first_name    = 'Srinivas Rao',
       last_name     = NULL,
       designation_id = 21,           -- Promoter & Director
       reporting_to  = @tirumala_id
 WHERE (first_name LIKE '%Srinivas%' OR first_name LIKE '%Sreenivas%')
   AND employee_id NOT IN (@admin_emp_id, @tirumala_id);

-- ─── Step 6: Fix Seetharamaiah — Promoter & Director, reports to Tirumala ────
UPDATE employees
   SET first_name    = 'Seetharamaiah',
       last_name     = NULL,
       designation_id = 21,
       reporting_to  = @tirumala_id
 WHERE first_name LIKE '%Seetha%'
   AND employee_id NOT IN (@admin_emp_id, @tirumala_id);

-- ─── Step 7: Fix Radhey Shyam Mamidi — Promoter & Director, reports Tirumala ─
UPDATE employees
   SET first_name    = 'Radhey Shyam Mamidi',
       last_name     = NULL,
       designation_id = 21,
       reporting_to  = @tirumala_id
 WHERE (first_name LIKE '%Radhey%' OR first_name LIKE '%Radhe%')
   AND employee_id NOT IN (@admin_emp_id, @tirumala_id);

-- ─── Step 8: Arjun Naidu → Project Manager, reports to Tirumala Rao ──────────
UPDATE employees
   SET reporting_to = @tirumala_id
 WHERE first_name LIKE '%Arjun%';

SET @arjun_id = (
  SELECT employee_id FROM employees WHERE first_name LIKE '%Arjun%' LIMIT 1
);

-- ─── Step 9: Kavitha Reddy & Ravi Teja → reports to Arjun Naidu ─────────────
UPDATE employees
   SET reporting_to = @arjun_id
 WHERE first_name LIKE '%Kavitha%';

UPDATE employees
   SET reporting_to = @arjun_id
 WHERE first_name LIKE '%Ravi%';

-- ─── Step 10: Fix user roles ──────────────────────────────────────────────────
-- Tirumala Rao = Reporting Manager (role_id=3)
UPDATE users SET role_id = 3 WHERE employee_id = @tirumala_id;

-- Srinivas Rao, Seetharamaiah, Radhey Shyam = Employee (role_id=2)
UPDATE users SET role_id = 2
 WHERE employee_id IN (
   SELECT employee_id FROM (
     SELECT employee_id FROM employees
     WHERE (first_name LIKE '%Srinivas%' OR first_name LIKE '%Seetha%' OR first_name LIKE '%Radhey%')
       AND employee_id NOT IN (@admin_emp_id, @tirumala_id)
   ) t
 );

-- ─── Step 11: Verify final state ─────────────────────────────────────────────
SELECT
  e.employee_id,
  e.first_name,
  IFNULL(e.last_name, '(none)') AS last_name,
  d.designation_name,
  e.reporting_to,
  CONCAT(m.first_name, ' ', IFNULL(m.last_name,'')) AS reports_to_name,
  u.role_id
FROM employees e
LEFT JOIN designations d ON d.designation_id = e.designation_id
LEFT JOIN employees m    ON m.employee_id = e.reporting_to
LEFT JOIN users u        ON u.employee_id = e.employee_id
WHERE e.employee_status = 'Active'
ORDER BY e.reporting_to IS NULL DESC, e.employee_id;
