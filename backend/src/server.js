const app = require('./app');
const { port, env, jwt, salaryEncryptionKey } = require('./config/env');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

// ── Production security guardrails ────────────────────────────────────────────
function enforceSecrets() {
  const WEAK_SECRETS = [
    'dev_secret_change_me',
    'dev_refresh_secret_change_me',
    'secret',
    'changeme',
    'password',
    '',
  ];

  if (env === 'production') {
    if (WEAK_SECRETS.includes(jwt.secret)) {
      logger.error('FATAL: JWT_SECRET is set to a default/weak value. Set a strong random secret before running in production.');
      logger.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
      process.exit(1);
    }
    if (WEAK_SECRETS.includes(jwt.refreshSecret)) {
      logger.error('FATAL: JWT_REFRESH_SECRET is set to a default/weak value.');
      process.exit(1);
    }
    if (!salaryEncryptionKey || salaryEncryptionKey.length < 64 || salaryEncryptionKey === 'replace_with_64_char_hex_string') {
      logger.error('FATAL: SALARY_ENCRYPTION_KEY is missing or is still the placeholder value.');
      logger.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      process.exit(1);
    }
  } else {
    // Non-production: warn but don't crash
    if (WEAK_SECRETS.includes(jwt.secret)) {
      logger.warn('WARNING: JWT_SECRET is using a weak default. Set a strong value before deploying to production.');
    }
  }
}

enforceSecrets();

(async () => {
  try {
    await testConnection();
    logger.info('Connected to MySQL database');
  } catch (err) {
    logger.error('Failed to connect to MySQL database:', err.message);
    logger.error('Make sure the database is running and .env is configured correctly.');
    process.exit(1);
  }

  const server = app.listen(port, () => {
    logger.info(`HRMS backend listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
