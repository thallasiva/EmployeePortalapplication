/* eslint-disable no-console */
const { env } = require('../config/env');

const logger = {
  info: (...args) => console.log(`[INFO]`, ...args),
  warn: (...args) => console.warn(`[WARN]`, ...args),
  error: (...args) => console.error(`[ERROR]`, ...args),
  debug: (...args) => {
    if (env !== 'production') console.debug(`[DEBUG]`, ...args);
  },
};

module.exports = logger;
