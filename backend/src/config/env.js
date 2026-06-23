'use strict';

require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

module.exports = {
  env: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 5000)),
  clientOrigin: required('CLIENT_ORIGIN', '*'),

  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(required('DB_PORT', 3306)),
    user: required('DB_USER', 'root'),
    password: required('DB_PASSWORD', ''),
    database: required('DB_NAME', 'hrms_db'),
    connectionLimit: Number(required('DB_CONNECTION_LIMIT', 10)),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_change_me'),
    expiresIn: required('JWT_EXPIRES_IN', '1d'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  upload: {
    dir: required('UPLOAD_DIR', 'uploads'),
    maxMb: Number(required('MAX_UPLOAD_MB', 10)),
  },

  email: {
    host: required('SMTP_HOST', ''),
    port: Number(required('SMTP_PORT', 587)),
    secure: String(required('SMTP_SECURE', 'false')).toLowerCase() === 'true',
    user: required('SMTP_USER', ''),
    pass: required('SMTP_PASS', ''),
    from: required('SMTP_FROM', 'HRMS <no-reply@hrms.local>'),
  },

  // 32-byte hex key for AES-256-GCM salary encryption
  salaryEncryptionKey: required('SALARY_ENCRYPTION_KEY', ''),
};
