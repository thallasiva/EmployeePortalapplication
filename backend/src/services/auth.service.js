const crypto = require('crypto');
const { query, withTransaction } = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { issueMfaTempToken } = require('../services/mfa.service');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const USER_WITH_ROLE_SQL = `
  SELECT u.user_id, u.email, u.password_hash, u.role_id, u.employee_id, u.status,
         r.role_name,
         e.first_name, e.last_name, e.emp_code, e.emp_job_title, e.department_id
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    LEFT JOIN employees e ON e.employee_id = u.employee_id
`;

function toAuthPayload(userRow) {
  return {
    userId: userRow.user_id,
    employeeId: userRow.employee_id,
    email: userRow.email,
    roleId: userRow.role_id,
    roleName: userRow.role_name,
  };
}

function toProfile(userRow) {
  return {
    userId: userRow.user_id,
    email: userRow.email,
    role: userRow.role_id,
    roleName: userRow.role_name,
    employeeId: userRow.employee_id,
    name: [userRow.first_name, userRow.last_name].filter(Boolean).join(' ') || null,
    empCode: userRow.emp_code || null,
    jobTitle: userRow.emp_job_title || null,
    departmentId: userRow.department_id || null,
  };
}

async function issueTokens(userRow) {
  const payload = toAuthPayload(userRow);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: payload.userId });
  await query('UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?', [userRow.user_id]);
  return { accessToken, refreshToken, user: toProfile(userRow) };
}

/**
 * Issues a full JWT pair given only a userId.
 * Used by the MFA verify step after TOTP is confirmed.
 */
async function issueTokensForUser(userId) {
  const rows = await query(`${USER_WITH_ROLE_SQL} WHERE u.user_id = ?`, [userId]);
  if (!rows.length || rows[0].status !== 'Active') {
    throw ApiError.unauthorized('Account is not active');
  }
  return issueTokens(rows[0]);
}

async function register({ email, password, firstName, lastName, mobile, roleId, departmentId, designationId, empJobTitle }) {
  const existing = await query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  return withTransaction(async (conn) => {
    const empCode = `EMP${Date.now().toString().slice(-6)}`;
    const [empResult] = await conn.query(
      `INSERT INTO employees (emp_code, first_name, last_name, email, mobile, emp_job_title, department_id, designation_id, employee_type, employee_status, emp_joining_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Full-Time', 'Active', CURDATE())`,
      [empCode, firstName, lastName || null, email, mobile || null, empJobTitle || 'Employee', departmentId || null, designationId || null]
    );

    const employeeId = empResult.insertId;

    await conn.query(
      `INSERT INTO users (email, password_hash, role_id, employee_id, status) VALUES (?, ?, ?, ?, 'Active')`,
      [email, passwordHash, roleId || 2, employeeId]
    );

    return { employeeId, empCode };
  });
}

async function login({ email, password }) {
  const rows = await query(`${USER_WITH_ROLE_SQL} WHERE u.email = ?`, [email]);
  const userRow = rows[0];

  // Always compare password to avoid user-enumeration timing attacks
  const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhas';
  const passwordToCheck = userRow ? userRow.password_hash : dummyHash;

  if (!userRow) {
    await comparePassword(password, dummyHash).catch(() => {});
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (userRow.status === 'Locked' || (userRow.locked_until && new Date(userRow.locked_until) > new Date())) {
    const remaining = userRow.locked_until
      ? Math.ceil((new Date(userRow.locked_until) - Date.now()) / 60000)
      : LOCKOUT_MINUTES;
    throw ApiError.forbidden(`Account locked due to too many failed attempts. Try again in ${remaining} minute(s).`);
  }

  if (userRow.status !== 'Active') {
    throw ApiError.forbidden('This account is not active. Contact your administrator.');
  }

  const valid = await comparePassword(password, passwordToCheck);
  if (!valid) {
    // Increment failure counter; lock if threshold reached
    const attempts = (userRow.failed_login_attempts || 0) + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await query(
        'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE user_id = ?',
        [attempts, lockedUntil, userRow.user_id]
      );
      throw ApiError.forbidden(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
    }
    await query('UPDATE users SET failed_login_attempts = ? WHERE user_id = ?', [attempts, userRow.user_id]);
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Password correct — check if MFA is required
  if (userRow.mfa_enabled) {
    const mfaTempToken = await issueMfaTempToken(userRow.user_id);
    return { mfaRequired: true, mfaTempToken };
  }

  return issueTokens(userRow);
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const rows = await query(`${USER_WITH_ROLE_SQL} WHERE u.user_id = ?`, [decoded.userId]);
  const userRow = rows[0];
  if (!userRow || userRow.status !== 'Active') {
    throw ApiError.unauthorized('Account is no longer active');
  }

  return issueTokens(userRow);
}

async function getProfile(userId) {
  const rows = await query(`${USER_WITH_ROLE_SQL} WHERE u.user_id = ?`, [userId]);
  if (!rows.length) throw ApiError.notFound('User not found');
  return toProfile(rows[0]);
}

async function changePassword(userId, currentPassword, newPassword) {
  const rows = await query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
  if (!rows.length) throw ApiError.notFound('User not found');

  const valid = await comparePassword(currentPassword, rows[0].password_hash);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, userId]);
}

/**
 * Generates a password-reset token. In production this would be emailed to
 * the user; here it is returned so the frontend's "Forgot Password" flow
 * can complete end-to-end.
 */
async function forgotPassword(email) {
  const rows = await query('SELECT user_id FROM users WHERE email = ?', [email]);
  if (!rows.length) {
    // Avoid leaking whether an email is registered
    return { message: 'If that email exists, a reset link has been sent' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?', [
    token,
    expiry,
    rows[0].user_id,
  ]);

  return { message: 'If that email exists, a reset link has been sent', resetToken: token };
}

async function resetPassword(token, newPassword) {
  const rows = await query(
    'SELECT user_id, reset_token_expiry FROM users WHERE reset_token = ?',
    [token]
  );
  const userRow = rows[0];
  if (!userRow) throw ApiError.badRequest('Invalid or expired reset token');
  if (new Date(userRow.reset_token_expiry) < new Date()) {
    throw ApiError.badRequest('Reset token has expired');
  }

  const newHash = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?',
    [newHash, userRow.user_id]
  );
}

module.exports = {
  register,
  login,
  refresh,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  issueTokensForUser,
};
