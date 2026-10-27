const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { callProcedure, query } = require('../config/db');







function requirePermission(module, action) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (req.user.roleId === 1) {
      return next();
    }

    const results = await callProcedure('sp_check_role_permission(?, ?, ?)', [req.user.roleId, module, action]);
    const row = (results[0] ?? [])[0];

    if (!row?.allowed) {
      throw ApiError.forbidden(`You do not have '${action}' access to '${module}'`);
    }

    next();
  });
}








async function hasPermission(user, module, action) {
  if (!user) return false;
  if (user.roleId === 1) return true;

  const results = await callProcedure('sp_check_role_permission(?, ?, ?)', [user.roleId, module, action]);
  const row = (results[0] ?? [])[0];

  return Boolean(row?.allowed);
}



// Reporting Managers hold team-level leave/attendance permissions, so any action on a
// specific employee must be limited to their direct reports. Other roles are unaffected.
async function assertManagesEmployee(user, employeeId) {
  if (user?.roleName !== 'Reporting Manager') return;
  const rows = await query('SELECT reporting_to FROM employees WHERE employee_id = ?', [employeeId]);
  if (!rows.length || Number(rows[0].reporting_to) !== Number(user.employeeId)) {
    throw ApiError.forbidden('You can only manage your direct reports');
  }
}

module.exports = { requirePermission, hasPermission, assertManagesEmployee };
