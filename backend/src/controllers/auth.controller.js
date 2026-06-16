const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  new ApiResponse(201, result, 'Registration successful').send(res);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  new ApiResponse(200, result, 'Login successful').send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  new ApiResponse(200, result, 'Token refreshed').send(res);
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.userId);
  new ApiResponse(200, profile, 'Profile fetched').send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
  new ApiResponse(200, null, 'Password changed successfully').send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  new ApiResponse(200, result, result.message).send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  new ApiResponse(200, null, 'Password has been reset successfully').send(res);
});

const logout = asyncHandler(async (_req, res) => {
  // Stateless JWT: client discards tokens. Placeholder for token-blacklisting if needed.
  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

module.exports = { register, login, refresh, me, changePassword, forgotPassword, resetPassword, logout };
