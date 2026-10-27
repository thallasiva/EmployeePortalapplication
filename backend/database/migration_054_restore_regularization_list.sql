-- =============================================================
-- Migration 054: restore sp_list_attendance_regularization (Team Regularizations page and
-- GET /api/attendance/regularizations). It was dropped from hrms_db on 2026-09-25.
-- Run with: node src/database/runSql.js migration_054_restore_regularization_list.sql
-- =============================================================

DROP PROCEDURE IF EXISTS sp_list_attendance_regularization;
DELIMITER $$
CREATE PROCEDURE `sp_list_attendance_regularization`(
    IN p_employee_id INT,
    IN p_status VARCHAR(20),
    IN p_reporting_to INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN

    DECLARE v_limit INT DEFAULT 10;
    DECLARE v_offset INT DEFAULT 0;

    SET v_limit = GREATEST(IFNULL(p_limit, 10), 1);
    SET v_offset = GREATEST(IFNULL(p_offset, 0), 0);

    SELECT
        r.*,
        e.emp_code,
        CONCAT(
            e.first_name,
            ' ',
            IFNULL(e.last_name, '')
        ) AS employee_name,
        CONCAT(
            rv.first_name,
            ' ',
            IFNULL(rv.last_name, '')
        ) AS reviewer_name
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    LEFT JOIN employees rv
        ON rv.employee_id = r.reviewed_by
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to)
    ORDER BY r.created_at DESC
    LIMIT v_limit OFFSET v_offset;

    SELECT COUNT(*) AS total
    FROM attendance_regularization r
    INNER JOIN employees e
        ON e.employee_id = r.employee_id
    WHERE
        (p_employee_id IS NULL OR r.employee_id = p_employee_id)
        AND (p_status IS NULL OR r.status = p_status)
        AND (p_reporting_to IS NULL OR e.reporting_to = p_reporting_to);

END $$
DELIMITER ;

SELECT 'migration_054_restore_regularization_list done' AS status;
