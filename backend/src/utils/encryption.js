'use strict';

/**
 * Salary Data Encryption Utility
 * ================================
 * AES-256-GCM authenticated encryption for sensitive salary fields.
 *
 * - Encryption key: 32-byte hex string in SALARY_ENCRYPTION_KEY env var.
 * - Each encryption call generates a random 12-byte IV (nonce).
 * - The 16-byte GCM auth tag prevents ciphertext tampering.
 * - Encrypted payload format: base64(iv):base64(authTag):base64(ciphertext)
 *
 * Only admins (roleId === 1) receive decrypted salary data.
 * All other roles receive masked values ("***").
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // bytes — GCM recommended
const TAG_LENGTH = 16;  // bytes — GCM auth tag

// Salary fields that must be encrypted before persisting
const SALARY_FIELDS = [
  'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
  'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc',
  // Payslip-specific
  'allowances', 'gross_earnings', 'deductions', 'net_pay',
];

function _getKey() {
  const hex = process.env.SALARY_ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    throw new Error(
      'SALARY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(hex.slice(0, 64), 'hex');
}

/**
 * Encrypts a plain-text string.
 * @param {string} plaintext
 * @returns {string}  "ivB64:tagB64:cipherB64"
 */
function encrypt(plaintext) {
  const key = _getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

/**
 * Decrypts a value produced by encrypt().
 * @param {string} payload  "ivB64:tagB64:cipherB64"
 * @returns {string}  original plaintext
 */
function decrypt(payload) {
  if (!payload || typeof payload !== 'string') return null;

  const parts = payload.split(':');
  if (parts.length !== 3) return null;

  try {
    const key = _getKey();
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    // Tampered or corrupt ciphertext — return null silently
    return null;
  }
}

/**
 * Encrypts salary fields from a data object into a single JSON blob.
 * Call this before INSERT / UPDATE.
 *
 * @param {object} data  any object that may contain salary fields
 * @returns {string|null}  encrypted JSON string, or null if no salary fields present
 */
function encryptSalaryFields(data) {
  const picked = {};
  for (const field of SALARY_FIELDS) {
    if (data[field] !== undefined) {
      picked[field] = data[field];
    }
  }
  if (Object.keys(picked).length === 0) return null;
  return encrypt(JSON.stringify(picked));
}

/**
 * Decrypts the salary blob and merges the values back into a row object.
 * Only call this for admin users or the record's own employee.
 *
 * @param {object} row  DB row (may contain salary_encrypted)
 * @returns {object}    row with decrypted salary fields merged in
 */
function decryptSalaryRow(row) {
  if (!row || !row.salary_encrypted) return row;
  const json = decrypt(row.salary_encrypted);
  if (!json) return row;
  try {
    const fields = JSON.parse(json);
    return { ...row, ...fields };
  } catch {
    return row;
  }
}

/**
 * Returns a copy of the row with salary fields replaced by "***".
 * Use this for non-admin, non-owner responses.
 *
 * @param {object} row
 * @returns {object}
 */
function maskSalaryRow(row) {
  if (!row) return row;
  const masked = { ...row };
  for (const field of SALARY_FIELDS) {
    if (masked[field] !== undefined) {
      masked[field] = '***';
    }
  }
  // Also strip the encrypted blob from non-admin responses
  delete masked.salary_encrypted;
  return masked;
}

/**
 * Decides whether to decrypt, pass-through, or mask a salary row
 * based on the requesting user.
 *
 * @param {object} row        DB row
 * @param {object} reqUser    req.user from JWT middleware
 * @param {number} [ownerId]  employee_id of the row owner (for self-service)
 * @returns {object}
 */
function applyVisibility(row, reqUser, ownerId = null) {
  if (!row) return row;

  const isAdmin = reqUser && reqUser.roleId === 1;
  const isOwner = ownerId && reqUser && reqUser.employeeId === ownerId;

  if (isAdmin || isOwner) {
    // Decrypt and return full data; strip blob from response
    const decrypted = decryptSalaryRow(row);
    const { salary_encrypted, ...clean } = decrypted;
    return clean;
  }

  return maskSalaryRow(row);
}

module.exports = {
  encrypt,
  decrypt,
  encryptSalaryFields,
  decryptSalaryRow,
  maskSalaryRow,
  applyVisibility,
  SALARY_FIELDS,
};
