-- =============================================================
-- Migration 009: Salary Encryption & Audit Log
-- =============================================================
-- 1. Adds salary_encrypted TEXT column to salary_structures and
--    payslips. The application layer (AES-256-GCM) writes an
--    encrypted JSON blob here on every INSERT / UPDATE.
--    Only admin users receive decrypted values via the API.
--
-- 2. Creates salary_audit_log to record every read / write of
--    salary data (who accessed what and when).
--
-- Run once per environment. Safe to re-run (IF NOT EXISTS guards).
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── salary_structures ────────────────────────────────────────
ALTER TABLE salary_structures
  ADD COLUMN IF NOT EXISTS salary_encrypted LONGTEXT DEFAULT NULL
    COMMENT 'AES-256-GCM encrypted JSON of all salary fields (application-managed)';

-- ── payslips ─────────────────────────────────────────────────
ALTER TABLE payslips
  ADD COLUMN IF NOT EXISTS salary_encrypted LONGTEXT DEFAULT NULL
    COMMENT 'AES-256-GCM encrypted JSON of all salary fields (application-managed)';

-- ── salary_audit_log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_audit_log (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          NOT NULL  COMMENT 'users.user_id of the requesting account',
  employee_id  INT          DEFAULT NULL COMMENT 'target employee whose salary was accessed',
  action       VARCHAR(50)  NOT NULL  COMMENT 'e.g. READ_SALARY, CREATE_SALARY, UPDATE_SALARY',
  resource     VARCHAR(100) DEFAULT NULL COMMENT 'e.g. salary_structures/42, payslips/7',
  ip_address   VARCHAR(45)  DEFAULT NULL,
  user_agent   VARCHAR(255) DEFAULT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'OK' COMMENT 'OK | DENIED | ERROR',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sal_audit_user   (user_id),
  INDEX idx_sal_audit_emp    (employee_id),
  INDEX idx_sal_audit_ts     (created_at),
  CONSTRAINT fk_sal_audit_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
