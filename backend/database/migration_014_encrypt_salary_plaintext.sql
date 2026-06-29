-- migration_014: Null out plaintext salary columns after encrypting into salary_encrypted
-- This ensures raw DB access reveals NO salary values — only the AES-256-GCM blob.
--
-- IMPORTANT: Run migration_009 first (adds salary_encrypted column).
-- Run application backfill AFTER this migration (see instructions below).
--
-- After running this SQL, restart the backend so the app service re-encrypts
-- any rows that still have salary_encrypted = NULL.

USE hrms_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ── salary_structures: allow NULL so we can clear plaintext ──────────────────
ALTER TABLE salary_structures
  MODIFY COLUMN basic              DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN hra                DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN conveyance         DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN medical_allowance  DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN special_allowance  DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN pf_employee        DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN pf_employer        DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN professional_tax   DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN income_tax         DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN ctc                DECIMAL(12,2) DEFAULT NULL;

-- ── payslips: allow NULL so we can clear plaintext ───────────────────────────
ALTER TABLE payslips
  MODIFY COLUMN basic          DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN hra            DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN allowances     DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN gross_earnings DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN ctc            DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN deductions     DECIMAL(12,2) DEFAULT NULL,
  MODIFY COLUMN net_pay        DECIMAL(12,2) DEFAULT NULL;

SET FOREIGN_KEY_CHECKS = 1;
