-- =============================================================
-- Migration 010: Auth Hardening
-- =============================================================
-- Adds:
--   1. TOTP MFA columns to users (mfa_enabled, mfa_secret, mfa_backup_codes)
--   2. Account lockout columns (failed_login_attempts, locked_until)
--   3. mfa_temp_tokens table — short-lived tokens issued after password
--      check when MFA is required, replaced by a full JWT after TOTP verify
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── MFA columns ───────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enabled      TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT '1 = TOTP MFA is active for this account',
  ADD COLUMN IF NOT EXISTS mfa_secret       VARCHAR(255) DEFAULT NULL
    COMMENT 'AES-256-encrypted TOTP base32 secret',
  ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT         DEFAULT NULL
    COMMENT 'JSON array of bcrypt-hashed one-use backup codes';

-- ── Account lockout columns ───────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Consecutive failed login attempts since last success',
  ADD COLUMN IF NOT EXISTS locked_until          DATETIME DEFAULT NULL
    COMMENT 'Account locked until this timestamp after too many failures';

-- ── MFA temp-token store ──────────────────────────────────────
-- After a successful password check for an MFA-enabled account,
-- we issue a short-lived token stored here. The client must
-- immediately present a valid TOTP code to exchange it for a
-- real JWT pair. Token expires in 5 minutes.
CREATE TABLE IF NOT EXISTS mfa_temp_tokens (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  token_hash VARCHAR(255) NOT NULL COMMENT 'SHA-256 hash of the temp token',
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mfa_token (token_hash),
  INDEX idx_mfa_expires (expires_at),
  CONSTRAINT fk_mfa_temp_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
