-- =============================================================
-- Migration 050: Production-Readiness Improvements
-- Run with: mysql -u root -p hrms_db < database/migration_050_production_readiness.sql
-- =============================================================

-- 1. Payroll lock columns
ALTER TABLE payroll_runs ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN locked_by INT DEFAULT NULL;
ALTER TABLE payroll_runs ADD COLUMN locked_at DATETIME DEFAULT NULL;
ALTER TABLE payroll_runs ADD COLUMN lock_note VARCHAR(255) DEFAULT NULL;

-- Auto-lock already-approved runs
UPDATE payroll_runs SET is_locked=1, locked_at=COALESCE(reviewed_at, NOW())
  WHERE review_status='APPROVED' AND is_locked=0;

-- 2. Audit logs enhancement
ALTER TABLE audit_logs ADD COLUMN ip VARCHAR(45) DEFAULT NULL;
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL;
ALTER TABLE audit_logs ADD COLUMN result VARCHAR(20) DEFAULT 'OK';

-- 3. Notification log table
CREATE TABLE IF NOT EXISTS notification_log (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          DEFAULT NULL,
  employee_id  INT          DEFAULT NULL,
  type         VARCHAR(60)  NOT NULL,
  channel      ENUM('EMAIL','IN_APP') NOT NULL DEFAULT 'EMAIL',
  subject      VARCHAR(255) DEFAULT NULL,
  body         TEXT         DEFAULT NULL,
  status       ENUM('SENT','FAILED','PENDING') NOT NULL DEFAULT 'PENDING',
  error        TEXT         DEFAULT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  sent_at      DATETIME     DEFAULT NULL
) ENGINE=InnoDB;

-- 4. Missing check-out tracking
ALTER TABLE attendance ADD COLUMN missing_checkout_notified TINYINT(1) NOT NULL DEFAULT 0;

SELECT 'migration_050_production_readiness done' AS status;
