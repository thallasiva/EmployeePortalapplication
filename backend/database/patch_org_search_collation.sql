-- ─────────────────────────────────────────────────────────────────────────────
-- PATCH: Fix collation mismatch in sp_search_employees_org
-- Error: "Illegal mix of collations ... for operation 'like'"
-- Run once in MySQL — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_search_employees_org $$
CREATE PROCEDURE sp_search_employees_org (
  IN p_q             VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  IN p_department_id INT,
  IN p_designation_id INT,
  IN p_status        VARCHAR(20)  COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT e.employee_id, e.emp_code, e.first_name, e.last_name, e.email, e.employee_status,
         e.reporting_to, e.emp_joining_date, e.employee_type,
         d.designation_name, dp.department_name, dp.department_id,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS full_name
    FROM employees e
    LEFT JOIN designations d  ON d.designation_id  = e.designation_id
    LEFT JOIN departments  dp ON dp.department_id  = e.department_id
   WHERE (e.first_name  COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.last_name  COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.emp_code   COLLATE utf8mb4_unicode_ci LIKE p_q
          OR e.email      COLLATE utf8mb4_unicode_ci LIKE p_q
          OR CONCAT(e.first_name,' ',e.last_name) COLLATE utf8mb4_unicode_ci LIKE p_q)
     AND (p_department_id  IS NULL OR e.department_id  = p_department_id)
     AND (p_designation_id IS NULL OR e.designation_id = p_designation_id)
     AND (p_status         IS NULL OR e.employee_status = p_status)
   LIMIT 30;

  -- All employees for hierarchy path building
  SELECT employee_id, reporting_to, CONCAT(first_name,' ',IFNULL(last_name,'')) AS full_name
    FROM employees;
END $$

DELIMITER ;
