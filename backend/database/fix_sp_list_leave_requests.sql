-- ============================================================
-- FIX: sp_list_leave_requests — correct parameter types
-- Run this in MySQL Workbench against hrms_db
-- Fixes: "Out of range value for column 'v_limit'"
-- ============================================================
USE hrms_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_list_leave_requests $$
CREATE PROCEDURE sp_list_leave_requests (
  IN p_employee_id   INT,
  IN p_status        VARCHAR(30),
  IN p_leave_type_id INT,
  IN p_department_id INT,
  IN p_reporting_to  INT,
  IN p_limit         BIGINT,
  IN p_offset        BIGINT,
  IN p_team_role_id  INT
)
BEGIN
  SELECT lr.*, e.emp_code,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         d.department_name, lt.leave_type_name,
         CONCAT(rv.first_name,' ',IFNULL(rv.last_name,'')) AS reviewer_name
    FROM leave_requests lr
    JOIN employees e    ON e.employee_id   = lr.employee_id
    JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
    JOIN users u        ON u.employee_id   = e.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN employees rv  ON rv.employee_id  = lr.reviewed_by
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (
           p_reporting_to IS NULL
           OR e.reporting_to = p_reporting_to
           OR (p_team_role_id IS NOT NULL AND u.role_id = p_team_role_id)
         )
   ORDER BY lr.applied_on DESC
   LIMIT IFNULL(p_limit, 9223372036854775807) OFFSET IFNULL(p_offset, 0);

  SELECT COUNT(*) AS total
    FROM leave_requests lr
    JOIN employees e ON e.employee_id = lr.employee_id
    JOIN users u     ON u.employee_id = e.employee_id
   WHERE (p_employee_id   IS NULL OR lr.employee_id   = p_employee_id)
     AND (p_status        IS NULL OR lr.status        = p_status)
     AND (p_leave_type_id IS NULL OR lr.leave_type_id = p_leave_type_id)
     AND (p_department_id IS NULL OR e.department_id  = p_department_id)
     AND (
           p_reporting_to IS NULL
           OR e.reporting_to = p_reporting_to
           OR (p_team_role_id IS NOT NULL AND u.role_id = p_team_role_id)
         );
END $$

DELIMITER ;

SELECT 'sp_list_leave_requests fixed — 8 params with BIGINT limit' AS status;
