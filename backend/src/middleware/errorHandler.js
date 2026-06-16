const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { env } = require('../config/env');

/**
 * Catch-all for unmatched routes. Must be registered after all routes.
 */
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Normalizes known error types (ApiError,
 * MySQL errors, Joi validation errors, JWT errors) into a consistent
 * JSON response shape.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry: a record with these values already exists';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Invalid reference: related record does not exist';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    message = 'Cannot delete: this record is referenced by other records';
  } else if (err.sqlState) {
    // Errors raised via SIGNAL SQLSTATE in stored procedures
    statusCode = err.errno === 1644 ? 400 : statusCode;
    message = err.sqlMessage || message;
  }

  // Joi validation errors
  if (err.isJoi) {
    statusCode = 400;
    message = 'Validation error';
    details = err.details?.map((d) => d.message) || null;
  }

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${statusCode} ${message}`);
  }

  const body = {
    success: false,
    statusCode,
    message,
  };

  if (details) body.details = details;
  if (env !== 'production' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler, ApiError };
