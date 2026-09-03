'use strict';

const ApiError = require('../utils/ApiError');
const logger   = require('../utils/logger');
const { env }  = require('../config/env');

const IS_PROD = env === 'production';

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Maps raw MySQL/Sequelize error codes to user-friendly messages.
 */
function mysqlMessage(err) {
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return { status: 409, msg: 'A record with these details already exists. Please check for duplicates.' };
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_NO_REFERENCED_ROW':
      return { status: 400, msg: 'The selected record does not exist or has been deleted.' };
    case 'ER_ROW_IS_REFERENCED_2':
    case 'ER_ROW_IS_REFERENCED':
      return { status: 409, msg: 'This record is used by other entries and cannot be deleted.' };
    case 'ER_DATA_TOO_LONG':
      return { status: 400, msg: 'One of the fields contains too many characters. Please shorten it.' };
    case 'ER_BAD_NULL_ERROR':
      return { status: 400, msg: 'A required field is missing. Please fill in all required values.' };
    case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
      return { status: 400, msg: 'One of the fields has an invalid value. Please check your input.' };
    case 'ER_LOCK_WAIT_TIMEOUT':
      return { status: 503, msg: 'The server is busy processing another request. Please try again.' };
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
      return { status: 503, msg: 'Cannot connect to the database. Please try again shortly.' };
    default:
      if (err.sqlState) {
        const sqlMsg = err.errno === 1644 ? err.sqlMessage : null; // SIGNAL from stored procedure
        return { status: err.errno === 1644 ? 400 : 500, msg: sqlMsg || (IS_PROD ? 'A database error occurred.' : err.sqlMessage) };
      }
      return null;
  }
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message    = err.message   || 'Internal server error';
  let details    = err.details   || null;

  // ── MySQL / DB errors ────────────────────────────────────────────────────
  const dbErr = mysqlMessage(err);
  if (dbErr) {
    statusCode = dbErr.status;
    message    = dbErr.msg;
  }

  // ── Joi validation errors ────────────────────────────────────────────────
  else if (err.isJoi || err.name === 'ValidationError') {
    statusCode = 422;
    const fieldErrors = err.details?.map(d => d.message.replace(/['"]/g, '')) || [];
    message = fieldErrors.length === 1
      ? fieldErrors[0]
      : `Please fix ${fieldErrors.length} validation errors: ${fieldErrors.slice(0, 3).join('; ')}${fieldErrors.length > 3 ? '…' : ''}`;
    details = fieldErrors.length > 1 ? fieldErrors : null;
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid authentication token. Please log in again.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Your session has expired. Please log in again.';
  }

  // ── Multer file upload errors ────────────────────────────────────────────
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message    = 'File is too large. Maximum allowed size is 10 MB.';
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message    = 'Unexpected file field. Please use the correct file upload field.';
  }

  // ── Logging ──────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error({ requestId: req.requestId, err });
  } else {
    logger.warn(`${statusCode} ${message} [${req.requestId || '-'}]`);
  }

  // ── Production: never leak stack traces ───────────────────────────────────
  if (IS_PROD && statusCode >= 500) {
    message = 'Something went wrong on the server. Our team has been notified.';
    details = null;
  }

  const body = { success: false, statusCode, message };
  if (details) body.details = details;
  if (!IS_PROD && statusCode >= 500 && err.stack) body.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler, ApiError };
