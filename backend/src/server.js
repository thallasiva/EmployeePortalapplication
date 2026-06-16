const app = require('./app');
const { port } = require('./config/env');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

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
