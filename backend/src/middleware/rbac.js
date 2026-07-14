const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { callProcedure } = require('../config/db');

/**
 * Fine-grained permission check backed by the `permissions` /
 * `role_permissions` tables (module + action, e.g. 'employees' + 'edit').
 *
 * Admins (role_id = 1) always pass.
 */
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

/**
 * Non-middleware permission check usable inside controllers, e.g. to allow
 * an employee to access their own record OR a user with the relevant
 * module/action permission to access any record.
 *
 * Admins (role_id = 1) always return true.
 */
async function hasPermission(user, module, action) {
  if (!user) return false;
  if (user.roleId === 1) return true;

  const results = await callProcedure('sp_check_role_permission(?, ?, ?)', [user.roleId, module, action]);
  const row = (results[0] ?? [])[0];

  return Boolean(row?.allowed);
}

module.exports = { requirePermission, hasPermission };
