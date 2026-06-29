'use strict';

/**
 * Salary Audit Log Middleware
 * ============================
 * Records every access to payroll / salary routes in salary_audit_log.
 * Call as: router.use(auditLog('READ_SALARY'))
 *       or: router.post('/...', auditLog('CREATE_SALARY'), controller.xxx)
 *
 * Logging is best-effort — a DB write failure never blocks the request.
 */

const { query } = require('../config/db');

/**
 * @param {string} action  e.g. 'READ_SALARY', 'CREATE_SALARY', 'UPDATE_SALARY', 'DELETE_SALARY'
 * @param {Function} [getEmployeeId]  optional fn(req) => employeeId for the target record
 */
function auditLog(action, getEmployeeId = null) {
  return async (req, res, next) => {
    // Run audit write after the response is sent so it never adds latency
    res.on('finish', () => {
      _writeLog(req, res, action, getEmployeeId).catch(() => {
        // Swallow — logging must never crash the app
      });
    });
    next();
  };
}

async function _writeLog(req, res, action, getEmployeeId) {
  if (!req.user) return;   // unauthenticated requests are handled by auth middleware

  const userId     = req.user.userId;
  const employeeId = getEmployeeId ? getEmployeeId(req) : (req.query.employee_id || req.params.employeeId || null);
  const resource   = `${req.method} ${req.path}`;
  const ip         = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const userAgent  = (req.headers['user-agent'] || '').slice(0, 255);
  const status     = res.statusCode >= 400 ? (res.statusCode === 403 ? 'DENIED' : 'ERROR') : 'OK';

  await query(
    `INSERT INTO salary_audit_log
       (user_id, employee_id, action, resource, ip_address, user_agent, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, employeeId || null, action, resource.slice(0, 100), ip, userAgent, status]
  );
}

module.exports = auditLog;
