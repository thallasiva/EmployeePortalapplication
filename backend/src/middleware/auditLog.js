'use strict';
const { callProcedure, query } = require('../config/db');
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
  await query(
    `INSERT INTO audit_logs (company_id, user_id, action, entity, entity_id, details, ip, user_agent, result)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.companyId || null,
      userId,
      action,
      resource.split('/')[0].slice(0, 60),
      employeeId ? String(employeeId).slice(0, 40) : null,
      JSON.stringify({ method: req.method, path: req.path, employeeId: employeeId || null }),
      ip || null,
      userAgent || null,
      status,
    ]
  );
}
module.exports = auditLog;
