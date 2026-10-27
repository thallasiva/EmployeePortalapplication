-- =============================================================
-- Migration 052: procedures behind the daily attendance-reminder cron jobs in server.js
-- (11:00 missing check-in, 19:00 missing check-out). Until these exist the jobs fail and
-- log a warning; once applied, every server running the cron EMAILS employees daily.
-- Run with: node src/database/runSql.js migration_052_attendance_reminder_procedures.sql
-- =============================================================

-- Active employees with no check-in today, excluding approved leave and holidays.
DROP PROCEDURE IF EXISTS sp_get_missing_checkins;
DELIMITER $$
CREATE PROCEDURE sp_get_missing_checkins()
BEGIN
  SELECT e.employee_id, e.email, e.first_name, e.last_name,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         CURDATE() AS attendance_date
    FROM employees e
    LEFT JOIN attendance a
           ON a.employee_id = e.employee_id AND a.attendance_date = CURDATE()
   WHERE e.employee_status = 'Active'
     AND e.email IS NOT NULL
     AND (a.attendance_id IS NULL OR a.check_in IS NULL)
     AND NOT EXISTS (
           SELECT 1 FROM leave_requests lr
            WHERE lr.employee_id = e.employee_id
              AND lr.status = 'Approved'
              AND CURDATE() BETWEEN lr.from_date AND lr.to_date)
     AND NOT EXISTS (
           SELECT 1 FROM holidays h
            WHERE h.holiday_date = CURDATE() AND h.is_restricted = 0);
END $$
DELIMITER ;

-- Employees who checked in today but have not checked out.
DROP PROCEDURE IF EXISTS sp_get_missing_checkouts;
DELIMITER $$
CREATE PROCEDURE sp_get_missing_checkouts()
BEGIN
  SELECT e.employee_id, e.email, e.first_name, e.last_name,
         CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
         a.attendance_date
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
   WHERE a.attendance_date = CURDATE()
     AND a.check_in IS NOT NULL
     AND a.check_out IS NULL
     AND e.employee_status = 'Active'
     AND e.email IS NOT NULL;
END $$
DELIMITER ;

SELECT 'migration_052_attendance_reminder_procedures done' AS status;
