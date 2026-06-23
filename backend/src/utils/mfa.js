'use strict';

/**
 * TOTP MFA Utility  (otplib v13 async API)
 * ==========================================
 * Wraps otplib for Time-based One-Time Password generation and
 * verification. Compatible with Google Authenticator, Authy, etc.
 *
 * otplib v13 dropped the legacy `authenticator` export in favour of
 * class-based async TOTP.  All public functions here are async.
 *
 * The raw base32 TOTP secret is never stored in plaintext — it is
 * AES-256-GCM encrypted before being written to users.mfa_secret.
 */

const crypto = require('crypto');
const {
  TOTP,
  NobleCryptoPlugin,
  ScureBase32Plugin,
  generateSecret,
} = require('otplib');
const { generateTOTP: buildUri } = require('@otplib/uri');
const QRCode = require('qrcode');
const { encrypt, decrypt } = require('./encryption');

const APP_NAME = process.env.APP_NAME || 'HRMS';

/** Shared TOTP instance configured for Noble/Scure (no Node crypto dep) */
const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
  window: 1,  // accept ±1 step (30 s each) for clock skew
});

/**
 * Generates a fresh TOTP secret for a user, returns everything needed for
 * QR code display and DB storage.
 *
 * @param {string} email  used in the QR code label
 * @returns {{ encryptedSecret: string, otpauthUrl: string, qrDataUrl: string }}
 */
async function generateMfaSetup(email) {
  const rawSecret = generateSecret(32);
  // otpauth URI:  otpauth://totp/LABEL?secret=...&issuer=...
  const otpauthUrl = buildUri({ secret: rawSecret, label: email, issuer: APP_NAME });
  const qrDataUrl   = await QRCode.toDataURL(otpauthUrl);
  const encryptedSecret = encrypt(rawSecret);
  return { encryptedSecret, otpauthUrl, qrDataUrl };
}

/**
 * Verifies a 6-digit TOTP token against an encrypted secret.
 *
 * @param {string} token            6-digit code from authenticator app
 * @param {string} encryptedSecret  value stored in users.mfa_secret
 * @returns {Promise<boolean>}
 */
async function verifyTotp(token, encryptedSecret) {
  if (!token || !encryptedSecret) return false;
  const rawSecret = decrypt(encryptedSecret);
  if (!rawSecret) return false;
  try {
    const result = await totp.verify(String(token).replace(/\s/g, ''), { secret: rawSecret });
    return result?.valid === true;
  } catch {
    return false;
  }
}

/**
 * Generates 8 random backup codes (10 hex chars each).
 * Returns plaintext codes (shown once) and JSON of SHA-256 hashes (stored).
 *
 * @returns {{ plainCodes: string[], hashedCodesJson: string }}
 */
function generateBackupCodes() {
  const plainCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  );
  const hashedCodes = plainCodes.map((c) =>
    crypto.createHash('sha256').update(c).digest('hex')
  );
  return { plainCodes, hashedCodesJson: JSON.stringify(hashedCodes) };
}

/**
 * Checks a submitted backup code against stored hashes, consuming it on match.
 *
 * @param {string} submittedCode    plain code from user
 * @param {string} hashedCodesJson  JSON from users.mfa_backup_codes
 * @returns {{ valid: boolean, updatedJson: string }}
 */
function consumeBackupCode(submittedCode, hashedCodesJson) {
  if (!submittedCode || !hashedCodesJson) return { valid: false, updatedJson: hashedCodesJson };
  let hashes;
  try { hashes = JSON.parse(hashedCodesJson); } catch { return { valid: false, updatedJson: hashedCodesJson }; }

  const submitted = crypto.createHash('sha256').update(submittedCode.trim().toUpperCase()).digest('hex');
  const idx = hashes.indexOf(submitted);
  if (idx === -1) return { valid: false, updatedJson: hashedCodesJson };

  hashes.splice(idx, 1);   // one-use: remove the consumed code
  return { valid: true, updatedJson: JSON.stringify(hashes) };
}

module.exports = { generateMfaSetup, verifyTotp, generateBackupCodes, consumeBackupCode };
