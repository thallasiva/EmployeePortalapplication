'use strict';















const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;


const SALARY_FIELDS = [
'basic', 'hra', 'conveyance', 'medical_allowance', 'special_allowance',
'pf_employee', 'pf_employer', 'professional_tax', 'income_tax', 'ctc',

'allowances', 'gross_earnings', 'deductions', 'net_pay'];


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






function encrypt(plaintext) {
  const key = _getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
  iv.toString('base64'),
  tag.toString('base64'),
  encrypted.toString('base64')].
  join(':');
}






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

    return null;
  }
}








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








function maskSalaryRow(row) {
  if (!row) return row;
  const masked = { ...row };
  for (const field of SALARY_FIELDS) {
    if (masked[field] !== undefined) {
      masked[field] = '***';
    }
  }

  delete masked.salary_encrypted;
  return masked;
}










function applyVisibility(row, reqUser, ownerId = null) {
  if (!row) return row;

  const isAdmin = reqUser && reqUser.roleId === 1;
  const isOwner = ownerId && reqUser && reqUser.employeeId === ownerId;

  if (isAdmin || isOwner) {

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
  SALARY_FIELDS
};
