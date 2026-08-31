-- ─────────────────────────────────────────────────────────────────────────────
-- Patch: Break Tracking
-- Adds attendance_punches table + break_minutes to attendance
-- Safe to re-run. Run via: node fix_patch.js patch_break_tracking.sql
-- ─────────────────────────────────────────────────────────────────────────────

USE hrms_db;

-- 1. Punch log table
CREATE TABLE IF NOT EXISTS attendance_punches (
  punch_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT NOT NULL,
  attendance_date DATE NOT NULL,
  punch_time      TIME NOT NULL,
  punch_type      ENUM('IN','OUT') NOT NULL,
  source          VARCHAR(30) DEFAULT 'web',
  lat             DECIMAL(10,6) DEFAULT NULL,
  lng             DECIMAL(10,6) DEFAULT NULL,
  location        VARCHAR(200) DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_punch_emp_date (employee_id, attendance_date),
  CONSTRAINT fk_punch_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Add break_minutes column to attendance if not exists
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS break_minutes  INT DEFAULT 0 AFTER work_hours,
  ADD COLUMN IF NOT EXISTS total_punches  INT DEFAULT 0 AFTER break_minutes,
  ADD COLUMN IF NOT EXISTS checkin_lat    DECIMAL(10,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkin_lng    DECIMAL(10,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkin_location VARCHAR(200) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkout_lat   DECIMAL(10,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkout_lng   DECIMAL(10,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checkout_location VARCHAR(200) DEFAULT NULL;

