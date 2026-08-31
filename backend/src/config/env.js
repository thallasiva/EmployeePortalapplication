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
    host: required('DB_HOST', 'hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com'),
    port: Number(required('DB_PORT', 4306)),
    user: required('DB_USER', 'HRMSadmin'),
    password: required('DB_PASSWORD', 'HwULGJ6gbxQIhzwNeZ9L'),
    database: required('DB_NAME', 'hrms_db'),
    connectionLimit: Number(required('DB_CONNECTION_LIMIT', 10))
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_change_me'),
    expiresIn: required('JWT_EXPIRES_IN', '1d'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d')
  },

  upload: {
    dir: required('UPLOAD_DIR', 'uploads'),
    maxMb: Number(required('MAX_UPLOAD_MB', 10))
  },

  email: {
    host: required('SMTP_HOST', ''),
    port: Number(required('SMTP_PORT', 587)),
    secure: String(required('SMTP_SECURE', 'false')).toLowerCase() === 'true',
    user: required('SMTP_USER', ''),
    pass: required('SMTP_PASS', ''),
    from: required('SMTP_FROM', 'HRMS <thallasiva786@gmail.com>'),
    adminAlert: required('EMAIL_ADMIN_ALERT', ''),
    companyName: required('COMPANY_NAME', 'HRMS'),
    companyAddress: required('COMPANY_ADDRESS', ''),
    companyPhone: required('COMPANY_PHONE', ''),
    companyCIN: required('COMPANY_CIN', ''),
    companyEmail: required('COMPANY_EMAIL', ''),
    companyReportTo: required('COMPANY_REPORT_TO', ''),
    hrManagerName: required('HR_MANAGER_NAME', ''),
    logoPath: required('COMPANY_LOGO_PATH', ''),
    backendUrl: required('BACKEND_URL', 'https://backend.natsoft.io'),
    frontendUrl: required('FRONTEND_URL', 'http://localhost:3000')
  },

  redis: {
    host: required('REDIS_HOST', '127.0.0.1'),
    port: Number(required('REDIS_PORT', 6379)),
    password: required('REDIS_PASSWORD', '') || undefined
  },

  queue: {
    concurrency: Number(required('EMAIL_QUEUE_CONCURRENCY', 5)),
    maxRetries: Number(required('EMAIL_QUEUE_MAX_RETRIES', 3)),
    retryDelayMs: Number(required('EMAIL_QUEUE_RETRY_DELAY_MS', 5000))
  },


  salaryEncryptionKey: required('SALARY_ENCRYPTION_KEY', ''),


  azure: {
    tenantId: required('AZURE_TENANT_ID', ''),
    clientId: required('AZURE_CLIENT_ID', ''),
    clientSecret: required('AZURE_CLIENT_SECRET', ''),
    organizerUserId: required('TEAMS_ORGANIZER_USER_ID', '')
  },

  googleMeet: {
    clientId:     required('GOOGLE_CLIENT_ID', ''),
    clientSecret: required('GOOGLE_CLIENT_SECRET', ''),
    refreshToken: required('GOOGLE_REFRESH_TOKEN', ''),
    organizerEmail: required('GOOGLE_ORGANIZER_EMAIL', '')
  },

  zoom: {
    accountId:   required('ZOOM_ACCOUNT_ID', ''),
    clientId:    required('ZOOM_CLIENT_ID', ''),
    clientSecret: required('ZOOM_CLIENT_SECRET', ''),
    hostEmail:   required('ZOOM_HOST_EMAIL', '')
  },

  openai: {
    apiKey: required('OPENAI_API_KEY', ''),
    model:  required('OPENAI_MODEL', 'gpt-4o-mini')
  },

  frontend: {
    url: required('FRONTEND_URL', 'http://localhost:3000')
  }

};
