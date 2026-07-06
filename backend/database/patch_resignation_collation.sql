-- ─────────────────────────────────────────────────────────────────────────────
-- PATCH: Fix collation mismatch in sp_get_all_resignations
-- Error: "Illegal mix of collations (utf8mb4_0900_ai_ci,IMPLICIT) and
--         (utf8mb4_unicode_ci,IMPLICIT) for operation 'like'"
-- Fix:  Declare IN params with explicit COLLATE utf8mb4_unicode_ci so LIKE
--       comparisons against VARCHAR columns work regardless of DB default.
-- Run once in MySQL — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_all_resignations $$
CREATE PROCEDURE sp_get_all_resignations (
  IN p_status VARCHAR(30)  COLLATE utf8mb4_unicode_ci,
  IN p_search VARCHAR(200) COLLATE utf8mb4_unicode_ci
)
BEGIN
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name) AS employee_name,
         e.emp_code, e.emp_job_title AS job_title, d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
    FROM resignations r
    JOIN employees e       ON e.employee_id  = r.employee_id
    LEFT JOIN departments d   ON d.department_id = e.department_id
    LEFT JOIN employees rev   ON rev.employee_id = r.reviewed_by
    LEFT JOIN employees mgr   ON mgr.employee_id = r.manager_reviewed_by
   WHERE (p_status IS NULL OR p_status = 'all' OR r.status = p_status)
     AND (p_search IS NULL
          OR CONCAT(e.first_name,' ',e.last_name) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%')
          OR e.emp_code        COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%')
          OR d.department_name COLLATE utf8mb4_unicode_ci LIKE CONCAT('%',p_search,'%'))
   ORDER BY r.created_at DESC;
END $$

DELIMITER ;
