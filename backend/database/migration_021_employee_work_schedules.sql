-- ── Migration 021: Per-Employee Work Schedules ───────────────────────────────
-- Allows Admin to assign individual work day patterns and shift times to each
-- employee, overriding the company-level defaults.
-- Run: mysql -u root -p hrms_db < migration_021_employee_work_schedules.sql

USE hrms_db;

CREATE TABLE IF NOT EXISTS employee_work_schedules (
  schedule_id   INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT NOT NULL,

  -- fixed | rotational
  schedule_type ENUM('fixed', 'rotational') NOT NULL DEFAULT 'fixed',

  -- JSON array of day abbreviations: ["mon","tue","wed","thu","fri"]
  work_days     JSON DEFAULT NULL,

  start_time    TIME DEFAULT NULL,   -- e.g. 09:00:00
  end_time      TIME DEFAULT NULL,   -- e.g. 18:00:00

  -- Free text for rotational shifts: "Week A: Mon-Fri, Week B: Tue-Sat"
  rotation_pattern VARCHAR(255) DEFAULT NULL,

  updated_by    INT DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_emp_schedule (employee_id),
  CONSTRAINT fk_ws_employee   FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  CONSTRAINT fk_ws_updated_by FOREIGN KEY (updated_by)  REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
