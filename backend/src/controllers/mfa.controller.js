'use strict';

const mfaService = require('../services/mfa.service');
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { setTokenCookies } = require('../utils/cookieAuth');
const { callProcedure } = require('../config/db');

/**
 * GET /api/auth/mfa/setup
 * Returns a QR code data URL for the logged-in user to scan.
 */
const setup = asyncHandler(async (req, res) => {
  const result = await mfaService.setupMfa(req.user.userId);
  new ApiResponse(200, result, 'Scan the QR code with your authenticator app, then call /mfa/enable').send(res);
});

/**
 * POST /api/auth/mfa/enable
 * Body: { code: "123456" }
 * Activates MFA after the user confirms with a valid TOTP.
 * Returns 8 one-use backup codes — show once, never again.
 */
const enable = asyncHandler(async (req, res) => {
  const result = await mfaService.enableMfa(req.user.userId, req.body.code);
  new ApiResponse(200, result, 'MFA enabled. Save these backup codes — they cannot be retrieved later.').send(res);
});

/**
 * POST /api/auth/mfa/verify
 * Body: { mfaTempToken: "...", code: "123456" }
 * Called during the second step of login when MFA is enabled.
 * Exchanges a valid TOTP code for a full JWT pair.
 */
const verify = asyncHandler(async (req, res) => {
  const userId = await mfaService.verifyMfaLogin(req.body.mfaTempToken, req.body.code);
  const tokens = await authService.issueTokensForUser(userId);

  // Set httpOnly cookies
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

  // Also return in body for non-cookie clients
  new ApiResponse(200, tokens, 'MFA verified. Login successful.').send(res);
});

/**
 * POST /api/auth/mfa/disable
 * Body: { code: "123456" }
 * Disables MFA after the user confirms with current TOTP.
 */
const disable = asyncHandler(async (req, res) => {
  await mfaService.disableMfa(req.user.userId, req.body.code);
  new ApiResponse(200, null, 'MFA has been disabled').send(res);
});

/**
 * GET /api/auth/mfa/status
 * Returns whether MFA is currently enabled for the logged-in user.
 */
const status = asyncHandler(async (req, res) => {
  const results = await callProcedure('sp_get_user_mfa(?)', [req.user.userId]);
  const row = (results[0] ?? [])[0];
  new ApiResponse(200, { mfaEnabled: Boolean(row?.mfa_enabled) }, 'MFA status').send(res);
});

module.exports = { setup, enable, verify, disable, status };
