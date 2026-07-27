'use strict';

const mfaService = require('../services/mfa.service');
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { setTokenCookies } = require('../utils/cookieAuth');
const { callProcedure } = require('../config/db');





const setup = asyncHandler(async (req, res) => {
  const result = await mfaService.setupMfa(req.user.userId);
  new ApiResponse(200, result, 'Scan the QR code with your authenticator app, then call /mfa/enable').send(res);
});







const enable = asyncHandler(async (req, res) => {
  const result = await mfaService.enableMfa(req.user.userId, req.body.code);
  new ApiResponse(200, result, 'MFA enabled. Save these backup codes — they cannot be retrieved later.').send(res);
});







const verify = asyncHandler(async (req, res) => {
  const userId = await mfaService.verifyMfaLogin(req.body.mfaTempToken, req.body.code);
  const tokens = await authService.issueTokensForUser(userId);


  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);


  new ApiResponse(200, tokens, 'MFA verified. Login successful.').send(res);
});






const disable = asyncHandler(async (req, res) => {
  await mfaService.disableMfa(req.user.userId, req.body.code);
  new ApiResponse(200, null, 'MFA has been disabled').send(res);
});





const status = asyncHandler(async (req, res) => {
  const results = await callProcedure('sp_get_user_mfa(?)', [req.user.userId]);
  const row = (results[0] ?? [])[0];
  new ApiResponse(200, { mfaEnabled: Boolean(row?.mfa_enabled) }, 'MFA status').send(res);
});

module.exports = { setup, enable, verify, disable, status };
