-- ============================================================
-- Migration 008 – Timesheet Feature
-- Tables: employee_tasks, weekly_timesheets, timesheet_entries,
--         extra_work_requests
-- ============================================================

USE hrms_db;

-- ── 1. Employee-owned tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_tasks (
  task_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  task_name      VARCHAR(200) NOT NULL,
  project_name   VARCHAR(200) NOT NULL DEFAULT '',
  description    TEXT,
  status         ENUM('open','completed') NOT NULL DEFAULT 'open',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_et_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. Weekly timesheet header ───────────────────────────────────────────────
-- One row per employee per ISO week (week_start = Monday of that week).
CREATE TABLE IF NOT EXISTS weekly_timesheets (
  timesheet_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  week_start     DATE NOT NULL,                          -- Monday of the ISO week
  week_end       DATE NOT NULL,                          -- Sunday of the ISO week
  status         ENUM('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  submitted_at   DATETIME,
  reviewed_by    INT UNSIGNED,
  reviewed_at    DATETIME,
  comments       TEXT,                                   -- manager rejection reason / notes
  total_hours    DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ts_emp_week (employee_id, week_start),
  CONSTRAINT fk_wt_employee  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_wt_reviewer  FOREIGN KEY (reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. Timesheet entries (rows inside a weekly sheet) ───────────────────────
CREATE TABLE IF NOT EXISTS timesheet_entries (
  entry_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timesheet_id   INT UNSIGNED NOT NULL,
  employee_id    INT UNSIGNED NOT NULL,
  task_id        INT UNSIGNED,                           -- FK to employee_tasks (optional)
  project_name   VARCHAR(200) NOT NULL,
  task_name      VARCHAR(200) NOT NULL,
  activity_desc  TEXT,
  work_date      DATE NOT NULL,
  start_time     TIME,
  end_time       TIME,
  duration_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_te_timesheet FOREIGN KEY (timesheet_id) REFERENCES weekly_timesheets(timesheet_id) ON DELETE CASCADE,
  CONSTRAINT fk_te_employee  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_te_task      FOREIGN KEY (task_id)     REFERENCES employee_tasks(task_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. Extra-work requests ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extra_work_requests (
  extra_work_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT UNSIGNED NOT NULL,
  timesheet_id   INT UNSIGNED NOT NULL,
  work_date      DATE NOT NULL,
  task_name      VARCHAR(200) NOT NULL,
  extra_hours    DECIMAL(5,2) NOT NULL,
  reason         TEXT NOT NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by    INT UNSIGNED,
  reviewed_at    DATETIME,
  manager_notes  TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ew_employee  FOREIGN KEY (employee_id)  REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_ew_timesheet FOREIGN KEY (timesheet_id) REFERENCES weekly_timesheets(timesheet_id) ON DELETE CASCADE,
  CONSTRAINT fk_ew_reviewer  FOREIGN KEY (reviewed_by)  REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Patch: add date/time fields to employee_tasks ────────────────────────────
ALTER TABLE employee_tasks
  ADD COLUMN IF NOT EXISTS start_date  DATE          DEFAULT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS end_date    DATE          DEFAULT NULL AFTER start_date,
  ADD COLUMN IF NOT EXISTS start_time  TIME          DEFAULT NULL AFTER end_date,
  ADD COLUMN IF NOT EXISTS end_time    TIME          DEFAULT NULL AFTER start_time,
  ADD COLUMN IF NOT EXISTS duration_days  DECIMAL(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN end_date IS NOT NULL AND start_date IS NOT NULL
      THEN DATEDIFF(end_date, start_date) + 1
      ELSE NULL
    END
  ) STORED AFTER end_time,
  ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(6,2) DEFAULT NULL AFTER duration_days;
