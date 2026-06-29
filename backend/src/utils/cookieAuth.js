'use strict';

/**
 * Cookie-based JWT helpers
 * =========================
 * Sets/clears httpOnly, Secure, SameSite=Strict cookies for the
 * access and refresh tokens so they are never readable by JavaScript.
 */

const { env } = require('../config/env');

const IS_PROD = env === 'production';

const BASE_OPTS = {
  httpOnly: true,                        // not accessible via document.cookie
  secure: IS_PROD,                       // HTTPS only in production
  sameSite: IS_PROD ? 'Strict' : 'Lax', // Lax in dev to work on http://localhost
  path: '/',
};

/**
 * Writes the access token (15 min) and refresh token (7 days)
 * as httpOnly cookies on the response.
 */
function setTokenCookies(res, accessToken, refreshToken) {
  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...BASE_OPTS,
      maxAge: 15 * 60 * 1000,        // 15 minutes
    });
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...BASE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}

/**
 * Clears both auth cookies (call on logout).
 */
function clearTokenCookies(res) {
  res.clearCookie('accessToken',  { ...BASE_OPTS });
  res.clearCookie('refreshToken', { ...BASE_OPTS });
}

module.exports = { setTokenCookies, clearTokenCookies };
