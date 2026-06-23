'use strict';

/**
 * MFA Service
 * ============
 * Handles the full MFA lifecycle:
 *   setup   → generate secret + QR → user scans app
 *   enable  → user submits first TOTP code to confirm setup
 *   verify  → called during login when MFA is already enabled
 *   disable → admin turns MFA off (requires current TOTP)
 *
 * Also handles MFA temp-token creation and consumption for the
 * two-step login flow.
 */

const crypto = require('crypto');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { generateMfaSetup, verifyTotp, generateBackupCodes, consumeBackupCode } = require('../utils/mfa');

// ── Temp token helpers ────────────────────────────────────────────────────────

/**
 * Issues a short-lived (5-min) MFA temp token after password check succeeds.
 * Returns the raw token to send to the client; stores its SHA-256 hash in DB.
 */
async function issueMfaTempToken(userId) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await query('DELETE FROM mfa_temp_tokens WHERE user_id = ? OR expires_at < NOW()', [userId]);
  await query(
    'INSERT INTO mfa_temp_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, hash, expiresAt]
  );
  return raw;
}

/**
 * Validates and consumes a MFA temp token. Returns the userId, or throws.
 */
async function consumeMfaTempToken(rawToken) {
  if (!rawToken) throw ApiError.unauthorized('MFA temp token is required');

  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const rows = await query(
    'SELECT * FROM mfa_temp_tokens WHERE token_hash = ? AND used = 0 AND expires_at > NOW()',
    [hash]
  );

  if (!rows.length) throw ApiError.unauthorized('Invalid or expired MFA session. Please log in again.');

  await query('UPDATE mfa_temp_tokens SET used = 1 WHERE id = ?', [rows[0].id]);
  return rows[0].user_id;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

/**
 * Generates a TOTP secret + QR code for a user who wants to enable MFA.
 * Secret is stored (encrypted) but mfa_enabled stays 0 until confirmed.
 */
async function setupMfa(userId) {
  const userRows = await query('SELECT email, mfa_enabled FROM users WHERE user_id = ?', [userId]);
  if (!userRows.length) throw ApiError.notFound('User not found');
  if (userRows[0].mfa_enabled) throw ApiError.conflict('MFA is already enabled on this account');

  const { encryptedSecret, qrDataUrl, otpauthUrl } = await generateMfaSetup(userRows[0].email);
  await query('UPDATE users SET mfa_secret = ? WHERE user_id = ?', [encryptedSecret, userId]);
  return { qrDataUrl, otpauthUrl };
}

/**
 * Confirms MFA setup by verifying the first TOTP code the user submits.
 * Generates and returns 8 one-use backup codes.
 */
async function enableMfa(userId, totpCode) {
  const rows = await query('SELECT mfa_secret, mfa_enabled FROM users WHERE user_id = ?', [userId]);
  if (!rows.length) throw ApiError.notFound('User not found');
  if (rows[0].mfa_enabled) throw ApiError.conflict('MFA is already enabled');
  if (!rows[0].mfa_secret) throw ApiError.badRequest('Run MFA setup first');

  const valid = await verifyTotp(totpCode, rows[0].mfa_secret);  // async
  if (!valid) throw ApiError.badRequest('Invalid authenticator code');

  const { plainCodes, hashedCodesJson } = generateBackupCodes();
  await query(
    'UPDATE users SET mfa_enabled = 1, mfa_backup_codes = ? WHERE user_id = ?',
    [hashedCodesJson, userId]
  );
  return { backupCodes: plainCodes };
}

/**
 * Verifies a TOTP code (or backup code) during login.
 * @param {string} mfaTempToken  raw temp token from login response
 * @param {string} totpCode      6-digit TOTP or 10-char backup code
 */
async function verifyMfaLogin(mfaTempToken, totpCode) {
  const userId = await consumeMfaTempToken(mfaTempToken);

  const rows = await query(
    'SELECT mfa_secret, mfa_backup_codes FROM users WHERE user_id = ? AND mfa_enabled = 1',
    [userId]
  );
  if (!rows.length) throw ApiError.unauthorized('MFA not enabled for this account');

  // Try TOTP first
  if (await verifyTotp(totpCode, rows[0].mfa_secret)) return userId;  // async

  // Fall back to backup code
  const { valid, updatedJson } = consumeBackupCode(totpCode, rows[0].mfa_backup_codes);
  if (valid) {
    await query('UPDATE users SET mfa_backup_codes = ? WHERE user_id = ?', [updatedJson, userId]);
    return userId;
  }

  throw ApiError.unauthorized('Invalid authenticator code');
}

/**
 * Disables MFA for a user (requires current TOTP to confirm).
 */
async function disableMfa(userId, totpCode) {
  const rows = await query('SELECT mfa_secret, mfa_enabled FROM users WHERE user_id = ?', [userId]);
  if (!rows.length) throw ApiError.notFound('User not found');
  if (!rows[0].mfa_enabled) throw ApiError.badRequest('MFA is not enabled on this account');

  const valid = await verifyTotp(totpCode, rows[0].mfa_secret);  // async
  if (!valid) throw ApiError.badRequest('Invalid authenticator code');

  await query(
    'UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL WHERE user_id = ?',
    [userId]
  );
}

module.exports = { setupMfa, enableMfa, verifyMfaLogin, disableMfa, issueMfaTempToken };
