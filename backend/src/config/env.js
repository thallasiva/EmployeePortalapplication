'use strict';

require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

function parseDbUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     Number(u.port) || 3306,
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch { return null; }
}

const dbFromUrl = parseDbUrl(process.env.DATABASE_URL || process.env.MYSQL_URL);

module.exports = {
  env: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 5000)),
  clientOrigin: required('CLIENT_ORIGIN', '*'),

  db: {
    host:            required('DB_HOST',     dbFromUrl?.host     || 'localhost'),
    port:            Number(required('DB_PORT', dbFromUrl?.port  || 3306)),
    user:            required('DB_USER',     dbFromUrl?.user     || 'root'),
    password:        required('DB_PASSWORD', dbFromUrl?.password || ''),
    database:        required('DB_NAME',     dbFromUrl?.database || 'hrms_db'),
    connectionLimit: Number(required('DB_CONNECTION_LIMIT', 10)),
  },

  jwt: {
    secret:           required('JWT_SECRET',              'dev_secret_change_me'),
    expiresIn:        required('JWT_EXPIRES_IN',          '1d'),
    refreshSecret:    required('JWT_REFRESH_SECRET',      'dev_refresh_secret_change_me'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN',  '7d'),
  },

  upload: {
    dir:   required('UPLOAD_DIR',    'uploads'),
    maxMb: Number(required('MAX_UPLOAD_MB', 10)),
  },

  email: {
    host:   required('SMTP_HOST',   ''),
    port:   Number(required('SMTP_PORT', 587)),
    secure: String(required('SMTP_SECURE', 'false')).toLowerCase() === 'true',
    user:   required('SMTP_USER',   ''),
    pass:   required('SMTP_PASS',   ''),
    from:   required('SMTP_FROM',   'HRMS <no-reply@hrms.local>'),
  },

  salary: {
    encryptionKey: required('SALARY_ENCRYPTION_KEY', ''),
  },
};
