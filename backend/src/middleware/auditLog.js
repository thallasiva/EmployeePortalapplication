'use strict';

const { callProcedure } = require('../config/db');

function auditLog(action, getEmployeeId = null) {
  return async (req, res, next) => {

    res.on('finish', () => {
      _writeLog(req, res, action, getEmployeeId).catch(() => {

      });
    });
    next();
  };
}

async function _writeLog(req, res, action, getEmployeeId) {
  if (!req.user) return;

  const userId = req.user.userId;
  const employeeId = getEmployeeId ? getEmployeeId(req) : req.query.employee_id || req.params.employeeId || null;
  const resource = `${req.method} ${req.path}`;
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const userAgent = (req.headers['user-agent'] || '').slice(0, 255);
  const status = res.statusCode >= 400 ? res.statusCode === 403 ? 'DENIED' : 'ERROR' : 'OK';

  await callProcedure(
    'sp_insert_salary_audit_log(?, ?, ?, ?, ?, ?, ?)',
    [userId, employeeId || null, action, resource.slice(0, 100), ip, userAgent, status]
  );
}

module.exports = auditLog;
