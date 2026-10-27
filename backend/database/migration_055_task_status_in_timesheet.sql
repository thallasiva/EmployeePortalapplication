-- =============================================================
-- Migration 055: employee_tasks.status gains 'in_timesheet'.
-- sp_review_timesheet sets approved tasks to 'in_timesheet' (and the web My Tasks page shows an
-- "In Timesheet" badge), but the enum only allowed open/completed, so under STRICT_TRANS_TABLES
-- approving a timesheet that contained a task failed.
-- Run with: node src/database/runSql.js migration_055_task_status_in_timesheet.sql
-- =============================================================

ALTER TABLE employee_tasks
  MODIFY status ENUM('open', 'completed', 'in_timesheet') NOT NULL DEFAULT 'open';

SELECT 'migration_055_task_status_in_timesheet done' AS status;
