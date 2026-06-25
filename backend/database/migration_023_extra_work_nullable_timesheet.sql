-- ── Migration 023: Make timesheet_id nullable in extra_work_requests ──────────
-- Allows employees to raise extra work requests directly from My Tasks tab
-- without needing an existing weekly timesheet entry.
-- Run: mysql -u root -p hrms_db < migration_023_extra_work_nullable_timesheet.sql

USE hrms_db;

-- 1. Drop the existing NOT NULL FK constraint
ALTER TABLE extra_work_requests
  DROP FOREIGN KEY fk_ew_timesheet;

-- 2. Make the column nullable
ALTER TABLE extra_work_requests
  MODIFY COLUMN timesheet_id INT UNSIGNED NULL DEFAULT NULL;

-- 3. Re-add the FK allowing NULL (ON DELETE SET NULL)
ALTER TABLE extra_work_requests
  ADD CONSTRAINT fk_ew_timesheet
    FOREIGN KEY (timesheet_id)
    REFERENCES weekly_timesheets(timesheet_id)
    ON DELETE SET NULL;
