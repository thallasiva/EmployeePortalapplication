'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { env } = require('../config/env');

const IS_PROD = env === 'production';




function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
















function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;


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
    statusCode = err.errno === 1644 ? 400 : statusCode;
    message = IS_PROD ? 'Database error' : err.sqlMessage || message;
  }


  if (err.isJoi) {
    statusCode = 400;
    message = 'Validation error';
    details = err.details?.map((d) => d.message) || null;
  }


  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }


  if (statusCode >= 500) {

    logger.error({ requestId: req.requestId, err });
  } else {
    logger.warn(`${statusCode} ${message} [${req.requestId || '-'}]`);
  }



  if (IS_PROD && statusCode >= 500) {
    message = 'Internal server error';
    details = null;
  }

  const body = { success: false, statusCode, message };
  if (details) body.details = details;


  if (!IS_PROD && statusCode >= 500 && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler, ApiError };
