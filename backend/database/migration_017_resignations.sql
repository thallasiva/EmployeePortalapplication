-- ── Migration 017: Resignations ──────────────────────────────────────────────
-- Run: mysql -u root -p hrms_db < migration_017_resignations.sql

USE hrms_db;

CREATE TABLE IF NOT EXISTS resignations (
  resignation_id    INT AUTO_INCREMENT PRIMARY KEY,
  employee_id       INT NOT NULL,
  start_date        DATE NOT NULL,              -- Date of resignation submission
  end_date          DATE NOT NULL,              -- Employee's requested Last Working Day
  tentative_lwd     DATE,                       -- Calculated: start_date + notice_period_days
  shortfall_days    INT DEFAULT 0,
  notice_period     INT DEFAULT 60,
  reason            TEXT NOT NULL,              -- Free text reason
  alternate_email   VARCHAR(255),
  alternate_mobile  VARCHAR(20),
  remarks           TEXT,
  attachment_name   VARCHAR(255),
  attachment_path   VARCHAR(500),
  status            ENUM('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
  admin_remarks     TEXT,
  reviewed_by       INT,
  reviewed_at       DATETIME,
  created_at        DATETIME DEFAULT NOW(),
  updated_at        DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employee_id)  REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)  REFERENCES employees(employee_id) ON DELETE SET NULL
);
