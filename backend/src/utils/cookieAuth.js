'use strict';








const { env } = require('../config/env');

const IS_PROD = env === 'production';

const BASE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'Strict' : 'Lax',
  path: '/'
};





function setTokenCookies(res, accessToken, refreshToken) {
  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...BASE_OPTS,
      maxAge: 15 * 60 * 1000
    });
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...BASE_OPTS,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }
}




function clearTokenCookies(res) {
  res.clearCookie('accessToken', { ...BASE_OPTS });
  res.clearCookie('refreshToken', { ...BASE_OPTS });
}

module.exports = { setTokenCookies, clearTokenCookies };
