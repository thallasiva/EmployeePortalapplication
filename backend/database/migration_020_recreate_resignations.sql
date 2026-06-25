-- ── Migration 020: Recreate resignations table with correct schema ───────────
-- Run: mysql -u root -p hrms_db < migration_020_recreate_resignations.sql

USE hrms_db;

DROP TABLE IF EXISTS resignations;

CREATE TABLE resignations (
  resignation_id       INT AUTO_INCREMENT PRIMARY KEY,
  employee_id          INT NOT NULL,
  start_date           DATE NOT NULL,
  end_date             DATE NOT NULL,
  tentative_lwd        DATE,
  shortfall_days       INT DEFAULT 0,
  notice_period        INT DEFAULT 90,
  reason               TEXT NOT NULL,
  alternate_email      VARCHAR(255),
  alternate_mobile     VARCHAR(20),
  remarks              TEXT,
  attachment_name      VARCHAR(255),
  attachment_path      VARCHAR(500),
  status               ENUM('pending','rm_approved','rm_rejected','accepted','rejected','withdrawn') DEFAULT 'pending',
  admin_remarks        TEXT,
  manager_remarks      TEXT,
  reviewed_by          INT,
  reviewed_at          DATETIME,
  manager_reviewed_by  INT,
  manager_reviewed_at  DATETIME,
  created_at           DATETIME DEFAULT NOW(),
  updated_at           DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (employee_id)         REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)         REFERENCES employees(employee_id) ON DELETE SET NULL,
  FOREIGN KEY (manager_reviewed_by) REFERENCES employees(employee_id) ON DELETE SET NULL
);
