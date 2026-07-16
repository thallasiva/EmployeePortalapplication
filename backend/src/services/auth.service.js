const crypto = require('crypto');
const { callProcedure, readOuts } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { issueMfaTempToken } = require('../services/mfa.service');
const notify = require('./mailNotify.service');

/* ── Profile cache ── */
const _profileCache  = new Map();
const PROFILE_TTL_MS = 60_000;
function cacheProfile(id, data)   { _profileCache.set(id, { data, expiresAt: Date.now() + PROFILE_TTL_MS }); }
function getCachedProfile(id)     { const h = _profileCache.get(id); if (!h || Date.now() > h.expiresAt) { _profileCache.delete(id); return null; } return h.data; }
function bustProfileCache(id)     { _profileCache.delete(id); }

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES     = 15;

function toAuthPayload(u) {
  return { userId: u.user_id, employeeId: u.employee_id, email: u.email, roleId: u.role_id, roleName: u.role_name };
}
function toProfile(u) {
  return {
    userId: u.user_id, email: u.email, role: u.role_id, roleName: u.role_name,
    employeeId: u.employee_id,
    name:         [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
    empCode:      u.emp_code      || null,
    jobTitle:     u.emp_job_title || null,
    departmentId: u.department_id || null,
    profilePhoto: u.profile_photo || null,
  };
}

async function _getUserById(userId) {
  const results = await callProcedure('sp_get_user_by_id(?)', [userId]);
  return (results[0] ?? results)[0] ?? null;
}

async function issueTokens(userRow) {
  const payload      = toAuthPayload(userRow);
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: payload.userId });
  await callProcedure('sp_login_success(?)', [userRow.user_id]);
  return { accessToken, refreshToken, user: toProfile(userRow) };
}

async function issueTokensForUser(userId) {
  const userRow = await _getUserById(userId);
  if (!userRow || userRow.status !== 'Active') throw ApiError.unauthorized('Account is not active');
  return issueTokens(userRow);
}

async function register({ email, password, firstName, lastName, mobile, roleId, departmentId, designationId, empJobTitle }) {
  const existsResults = await callProcedure('sp_check_email_exists(?)', [email]);
  if ((existsResults[0] ?? []).length) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  await callProcedure(
    'sp_register_user(?, ?, ?, ?, ?, ?, ?, ?, ?, @employee_id, @emp_code)',
    [firstName, lastName ?? null, email, mobile ?? null, empJobTitle ?? 'Employee',
     departmentId ?? null, designationId ?? null, passwordHash, roleId ?? 2]
  );
  const out = await readOuts('employee_id', 'emp_code');
  return { employeeId: out.employee_id, empCode: out.emp_code };
}

async function login({ email, password, ip, userAgent }) {
  const results = await callProcedure('sp_get_user_for_login(?)', [email]);
  const userRow = (results[0] ?? results)[0] ?? null;

  // Always compare to prevent timing-based user enumeration
  const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhas';
  if (!userRow) {
    await comparePassword(password, dummyHash).catch(() => {});
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (userRow.status === 'Locked' || (userRow.locked_until && new Date(userRow.locked_until) > new Date())) {
    const remaining = userRow.locked_until
      ? Math.ceil((new Date(userRow.locked_until) - Date.now()) / 60000)
      : LOCKOUT_MINUTES;
    throw ApiError.forbidden(`Account locked. Try again in ${remaining} minute(s).`);
  }
  if (userRow.status !== 'Active') throw ApiError.forbidden('This account is not active. Contact your administrator.');

  const valid = await comparePassword(password, userRow.password_hash);
  if (!valid) {
    await callProcedure('sp_login_fail(?, ?, ?, @locked, @attempts)', [userRow.user_id, MAX_FAILED_ATTEMPTS, LOCKOUT_MINUTES]);
    const { locked } = await readOuts('locked');
    if (locked) {
      notify.accountLocked({
        name:    [userRow.first_name, userRow.last_name].filter(Boolean).join(' '),
        email:   userRow.email,
        minutes: LOCKOUT_MINUTES,
      });
      throw ApiError.forbidden(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
    }
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (userRow.mfa_enabled) {
    const mfaTempToken = await issueMfaTempToken(userRow.user_id);
    return { mfaRequired: true, mfaTempToken };
  }

  return issueTokens(userRow);
}

async function refresh(refreshToken) {
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); }
  catch { throw ApiError.unauthorized('Invalid or expired refresh token'); }

  const userRow = await _getUserById(decoded.userId);
  if (!userRow || userRow.status !== 'Active') throw ApiError.unauthorized('Account is no longer active');
  return issueTokens(userRow);
}

async function getProfile(userId) {
  const cached = getCachedProfile(userId);
  if (cached) return cached;
  const userRow = await _getUserById(userId);
  if (!userRow) throw ApiError.notFound('User not found');
  const profile = toProfile(userRow);
  cacheProfile(userId, profile);
  return profile;
}

async function changePassword(userId, currentPassword, newPassword) {
  const _pwResults = await callProcedure('sp_get_user_password_hash(?)', [userId]);
  const rows = _pwResults[0] ?? [];
  if (!rows.length) throw ApiError.notFound('User not found');
  const valid = await comparePassword(currentPassword, rows[0].password_hash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');
  const newHash = await hashPassword(newPassword);
  await callProcedure('sp_change_password(?, ?)', [userId, newHash]);
  bustProfileCache(userId);

  // Notify employee of password change
  const userRow = await _getUserById(userId);
  if (userRow) {
    notify.passwordChanged({
      name:  [userRow.first_name, userRow.last_name].filter(Boolean).join(' '),
      email: userRow.email,
    });
  }
}

async function forgotPassword(email) {
  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  const results = await callProcedure('sp_set_reset_token(?, ?, ?)', [email, token, expiry]);
  const affected = (results[0] ?? results)[0]?.affected ?? 0;
  if (!affected) return { message: 'If that email exists, a reset link has been sent' };

  // Send password reset email (critical — bypass queue)
  const { email: emailCfg } = require('../config/env');
  const resetUrl = `${emailCfg.frontendUrl || 'http://localhost:3000'}/reset-password?token=${token}`;
  notify.forgotPassword({ name: email, email, resetUrl, expiresIn: '1 hour' });

  return { message: 'If that email exists, a reset link has been sent', resetToken: token };
}

async function resetPassword(token, newPassword) {
  const newHash = await hashPassword(newPassword);
  await callProcedure('sp_reset_password(?, ?, @ok)', [token, newHash]);
  const out = await readOuts('ok');
  if (!out?.ok) throw ApiError.badRequest('Invalid or expired reset token');
}

module.exports = { register, login, refresh, getProfile, changePassword, forgotPassword, resetPassword, issueTokensForUser, bustProfileCache };
