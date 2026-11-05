const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { callProcedure, query } = require('../config/db');
const COMPANY_MODULE_BY_PERMISSION = Object.freeze({
  attendance: 'attendance', leave: 'leave', payroll: 'payroll',
  employees: 'employees', reviews: 'performance', timesheets: 'timesheets',
  helpdesk: 'helpdesk', documents: 'documents', reports: 'reports',
  salary_components: 'payroll', salary_templates: 'payroll', recruitment: 'recruitment', hiring: 'recruitment'
});

async function isCompanyModuleAllowed(user, moduleKey) {
  if (!user?.companyId || !moduleKey) return true;
  const rows = await query(
    'SELECT enabled FROM company_modules WHERE company_id = ? AND module_key = ? LIMIT 1',
    [user.companyId, moduleKey]
  );
  // Missing rows retain compatibility for modules introduced after this migration.
  return !rows.length || Number(rows[0].enabled) === 1;
}

function requireCompanyModule(moduleKey) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!await isCompanyModuleAllowed(req.user, moduleKey)) {
      throw ApiError.forbidden(`The '${moduleKey}' module is disabled for this company`);
    }
    next();
  });
}

// Menu visibility is an access boundary, not merely a sidebar preference.  Keep
// this mapping intentionally at the business-module level so every endpoint
// protected with requirePermission also observes the administrator's menu rule.
const MENU_BY_MODULE = Object.freeze({
  attendance: 'attendance',
  leave: 'leave',
  payroll: 'payroll',
  helpdesk: 'helpdesk',
  reviews: 'performance',
  settings: 'settings',
  employees: 'employees',
  departments: 'employees',
  designations: 'employees',
  companies: 'employees',
  documents: 'documents',
  timesheets: 'timesheets',
  salary_templates: 'payroll',
  salary_components: 'payroll',
});

async function isMenuAllowed(user, menuId) {
  if (!menuId || !user || user.roleId === 1) return true;
  try {
    const companyRows = user.companyId ? await query(
      'SELECT permissions FROM company_menu_permissions WHERE company_id = ? AND role_name = ? LIMIT 1',
      [user.companyId, user.roleName]
    ) : [];
    const rows = companyRows.length ? companyRows : await query(
      'SELECT permissions FROM hr_menu_permissions WHERE role_name = ? LIMIT 1', [user.roleName]
    );
    if (!rows.length) return true; // no configuration has been saved for this role
    let permissions = rows[0].permissions;
    if (typeof permissions === 'string') permissions = JSON.parse(permissions);
    // Unset items retain the legacy allow behaviour; only an explicit false denies.
    return permissions?.[menuId] !== false;
  } catch (error) {
    // Older installations may not have opened Settings yet, and therefore do
    // not have the settings table. Preserve existing access until it exists.
    if (error?.code === 'ER_NO_SUCH_TABLE') return true;
    throw error;
  }
}

function requireMenuPermission(menuId) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!await isMenuAllowed(req.user, menuId)) {
      throw ApiError.forbidden(`The '${menuId}' menu is disabled for your role`);
    }
    next();
  });
}

function requirePermission(module, action) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const companyModule = COMPANY_MODULE_BY_PERMISSION[module];
    if (!await isCompanyModuleAllowed(req.user, companyModule)) {
      throw ApiError.forbidden(`The '${companyModule}' module is disabled for this company`);
    }
    if (req.user.roleId === 1) {
      return next();
    }
    const menuId = MENU_BY_MODULE[module];
    if (!await isMenuAllowed(req.user, menuId)) {
      throw ApiError.forbidden(`The '${menuId}' menu is disabled for your role`);
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
  await assertCompanyEmployee(user, employeeId);
  if (user?.roleName !== 'Reporting Manager') return;
  const rows = await query('SELECT reporting_to FROM employees WHERE employee_id = ?', [employeeId]);
  if (!rows.length || Number(rows[0].reporting_to) !== Number(user.employeeId)) {
    throw ApiError.forbidden('You can only manage your direct reports');
  }
}
async function assertCompanyEmployee(user, employeeId) {
  if (!user?.companyId) {
    throw ApiError.forbidden('Company context is required');
  }
  if (!employeeId) {
    throw ApiError.badRequest('Employee ID is required');
  }
  const rows = await query('SELECT company_id FROM employees WHERE employee_id = ? LIMIT 1', [employeeId]);
  if (!rows.length || Number(rows[0].company_id) !== Number(user.companyId)) {
    throw ApiError.forbidden('You can only access employee records in your company');
  }
}
module.exports = { requirePermission, requireMenuPermission, requireCompanyModule, hasPermission, assertManagesEmployee, assertCompanyEmployee, isMenuAllowed, isCompanyModuleAllowed };
