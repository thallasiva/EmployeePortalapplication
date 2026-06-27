-- ============================================================
-- Migration 026 – Task status sync with timesheets
-- Adds 'in_timesheet' to employee_tasks.status ENUM so tasks
-- are visually locked while they belong to a live timesheet.
-- ============================================================

USE hrms_db;

ALTER TABLE employee_tasks
  MODIFY COLUMN status
    ENUM('open', 'in_timesheet', 'completed')
    NOT NULL DEFAULT 'open';
