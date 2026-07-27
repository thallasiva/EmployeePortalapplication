'use strict';

const crypto = require('crypto');
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { generateMfaSetup, verifyTotp, generateBackupCodes, consumeBackupCode } = require('../utils/mfa');



async function issueMfaTempToken(userId) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await callProcedure('sp_issue_mfa_temp_token_hash(?, ?, ?)', [userId, hash, expiresAt]);
  return raw;
}

async function consumeMfaTempToken(rawToken) {
  if (!rawToken) throw ApiError.unauthorized('MFA temp token is required');
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await callProcedure('sp_consume_mfa_temp_token(?, @user_id)', [hash]);
  const out = await readOuts('user_id');
  const userId = out[0]?.user_id ?? null;
  if (!userId) throw ApiError.unauthorized('Invalid or expired MFA session. Please log in again.');
  return userId;
}



async function setupMfa(userId) {
  const results = await callProcedure('sp_get_user_mfa(?)', [userId]);
  const userRow = (results[0] ?? [])[0] ?? null;
  if (!userRow) throw ApiError.notFound('User not found');
  if (userRow.mfa_enabled) throw ApiError.conflict('MFA is already enabled on this account');

  const { encryptedSecret, qrDataUrl, otpauthUrl } = await generateMfaSetup(userRow.email);
  await callProcedure('sp_setup_mfa_secret(?, ?)', [userId, encryptedSecret]);
  return { qrDataUrl, otpauthUrl };
}

async function enableMfa(userId, totpCode) {
  const results = await callProcedure('sp_get_user_mfa(?)', [userId]);
  const userRow = (results[0] ?? [])[0] ?? null;
  if (!userRow) throw ApiError.notFound('User not found');
  if (userRow.mfa_enabled) throw ApiError.conflict('MFA is already enabled');
  if (!userRow.mfa_secret) throw ApiError.badRequest('Run MFA setup first');

  const valid = await verifyTotp(totpCode, userRow.mfa_secret);
  if (!valid) throw ApiError.badRequest('Invalid authenticator code');

  const { plainCodes, hashedCodesJson } = generateBackupCodes();
  await callProcedure('sp_enable_mfa_with_backup(?, ?)', [userId, hashedCodesJson]);
  return { backupCodes: plainCodes };
}

async function verifyMfaLogin(mfaTempToken, totpCode) {
  const userId = await consumeMfaTempToken(mfaTempToken);

  const results = await callProcedure('sp_get_user_mfa(?)', [userId]);
  const userRow = (results[0] ?? [])[0] ?? null;
  if (!userRow || !userRow.mfa_enabled) throw ApiError.unauthorized('MFA not enabled for this account');

  if (await verifyTotp(totpCode, userRow.mfa_secret)) return userId;

  const { valid, updatedJson } = consumeBackupCode(totpCode, userRow.mfa_backup_codes);
  if (valid) {
    await callProcedure('sp_update_mfa_backup_codes(?, ?)', [userId, updatedJson]);
    return userId;
  }

  throw ApiError.unauthorized('Invalid authenticator code');
}

async function disableMfa(userId, totpCode) {
  const results = await callProcedure('sp_get_user_mfa(?)', [userId]);
  const userRow = (results[0] ?? [])[0] ?? null;
  if (!userRow) throw ApiError.notFound('User not found');
  if (!userRow.mfa_enabled) throw ApiError.badRequest('MFA is not enabled on this account');

  const valid = await verifyTotp(totpCode, userRow.mfa_secret);
  if (!valid) throw ApiError.badRequest('Invalid authenticator code');

  await callProcedure('sp_disable_mfa_full(?)', [userId]);
}

module.exports = { setupMfa, enableMfa, verifyMfaLogin, disableMfa, issueMfaTempToken };
