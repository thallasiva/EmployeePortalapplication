const employeeService = require('../services/employee.service');
const { createCrudController } = require('./base.controller');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('../utils/hash');
const { query } = require('../config/db');
const { assertCompanyEmployee } = require('../middleware/rbac');
const officeService = require('../services/office.service');
const { isPlatformAdmin, resolveCompanyScope } = require('../utils/companyScope');
const { hasScopeAccess } = require('../utils/accessScope');
const accessControlService = require('../services/accessControl.service');
const base = createCrudController(employeeService, { entityName: 'Employee' });

async function filterEmployeesByCompany(rows, companyId, user) {
  if (companyId === null) return rows;
  if (!user?.enterpriseRbac && !user?.roleIds?.length && user?.roleName !== 'Reporting Manager') {
  const allowedRows = await query(
    `SELECT e.employee_id
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE COALESCE(e.company_id, d.company_id) = ?`,
    [companyId]
  );
  const allowedIds = new Set(allowedRows.map((row) => Number(row.employee_id)));
  return rows.filter((row) => allowedIds.has(Number(row.employee_id)));
  }
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map((row) => Number(row.employee_id)).filter(Number.isInteger))];
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const allowedRows = await query(
    `SELECT e.employee_id, COALESCE(e.company_id, d.company_id) AS company_id,
            e.office_id AS branch_id, o.region_id, e.department_id,
            e.team_id, e.reporting_to
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN offices o ON o.office_id = e.office_id
      WHERE e.employee_id IN (${placeholders}) AND COALESCE(e.company_id, d.company_id) = ?`,
    [...ids, companyId]
  );
  const byId = new Map(allowedRows.map((row) => [Number(row.employee_id), row]));
  const reportingTreeIds = (
    user?.roleName === 'Reporting Manager'
    || user?.scopeAssignments?.some((scope) => scope.scope_type === 'TEAM' && scope.team_id == null)
  ) && user.employeeId
    ? await accessControlService.getReportingTreeIds(user.employeeId)
    : new Set();
  return rows.filter((row) => {
    const target = byId.get(Number(row.employee_id));
    if (!target) return false;
    target.employee_id = row.employee_id;
    target.is_direct_report = Number(target.reporting_to) === Number(user.employeeId);
    return hasScopeAccess(user, target)
      || reportingTreeIds.has(Number(row.employee_id))
      || Number(row.employee_id) === Number(user.employeeId);
  });
}

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { department, status, search } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const allowedEmployeeIds = companyId === null
    ? undefined
    : [...await accessControlService.getAllowedEmployeeIds(req.user, companyId)];
  const { rows, total } = await employeeService.list({
    department, status, search, reporting_to, limit, offset, companyId, allowedEmployeeIds,
  });
  new ApiResponse(200, rows, 'Employee list fetched', buildMeta({ page, limit, total })).send(res);
});
const getMe = asyncHandler(async (req, res) => {
  const empId = req.user.employeeId;
  if (!empId) throw ApiError.badRequest('No employee linked to this account');
  const profile = await employeeService.getProfile(empId);
  if (!profile) throw ApiError.notFound('Employee profile not found');
  new ApiResponse(200, profile, 'My profile fetched').send(res);
});
const getOne = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile, 'Employee profile fetched').send(res);
});
const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  delete payload.role_id;
  let referencedCompanyId = null;
  if (payload.department_id) {
    const rows = await query('SELECT company_id FROM departments WHERE department_id = ? LIMIT 1', [payload.department_id]);
    referencedCompanyId = rows[0]?.company_id ?? null;
    if (!referencedCompanyId) throw ApiError.badRequest('The selected department is not assigned to a company');
    await accessControlService.assertDepartmentScope(req.user, payload.department_id);
  }
  if (payload.office_id) {
    await accessControlService.assertBranchScope(req.user, payload.office_id);
    const rows = await query('SELECT company_id, status FROM offices WHERE office_id = ? LIMIT 1', [payload.office_id]);
    if (!rows.length || !rows[0].company_id) throw ApiError.badRequest('Select a branch assigned to a company');
    if (String(rows[0].status || 'Active').toLowerCase() !== 'active') throw ApiError.badRequest('Select an active branch');
    if (referencedCompanyId && Number(referencedCompanyId) !== Number(rows[0].company_id)) {
      throw ApiError.badRequest('The selected branch and department must belong to the same company');
    }
    referencedCompanyId = rows[0].company_id;
  }
  const companyId = isPlatformAdmin(req.user)
    ? Number(payload.company_id ?? referencedCompanyId)
    : resolveCompanyScope(req.user, payload.company_id);
  if (!Number.isInteger(companyId) || companyId < 1) {
    throw ApiError.badRequest('Select a company before creating the employee');
  }
  if (
    req.user.roleIds?.length
    && !isPlatformAdmin(req.user)
    && !hasScopeAccess(req.user, { company_id: companyId })
    && !payload.office_id
  ) {
    throw ApiError.badRequest('A branch is required for this organizational scope');
  }
  if (referencedCompanyId && Number(referencedCompanyId) !== companyId) {
    throw ApiError.badRequest('The selected branch or department does not belong to this company');
  }
  const companyRows = await query('SELECT company_id FROM companies WHERE company_id = ? AND status = ? LIMIT 1', [companyId, 'Active']);
  if (!companyRows.length) throw ApiError.badRequest('Select an active company');
  payload.company_id = companyId;
  if (payload.department_id) {
    const rows = await query('SELECT company_id FROM departments WHERE department_id = ? LIMIT 1', [payload.department_id]);
    if (!rows.length || Number(rows[0].company_id) !== Number(payload.company_id)) {
      throw ApiError.badRequest('The selected department does not belong to this company');
    }
  }
  if (payload.reporting_to) {
    await accessControlService.assertEmployeeScope(req.user, payload.reporting_to);
    const managers = await query(
      `SELECT COALESCE(manager.company_id, dept.company_id) AS company_id
         FROM employees manager
         LEFT JOIN departments dept ON dept.department_id = manager.department_id
        WHERE manager.employee_id = ? LIMIT 1`,
      [payload.reporting_to]
    );
    if (!managers.length || Number(managers[0].company_id) !== Number(payload.company_id)) {
      throw ApiError.badRequest('The reporting manager must belong to the employee company');
    }
  }
  const { contactInfo, bankDetails } = payload;
  delete payload.contactInfo;
  delete payload.bankDetails;
  if (payload.password) {
    payload.password_hash = await hashPassword(payload.password);
    delete payload.password;
  }
  let employee = await employeeService.createWithProcedure(payload);
  const employeeId = employee.employee_id;
  await accessControlService.ensureDefaultEmployeeAccess(employeeId);
  await employeeService.update(employeeId, payload);
  if (contactInfo && Object.keys(contactInfo).length) {
    await employeeService.upsertContactInfo(employeeId, contactInfo);
  }
  if (bankDetails && Object.keys(bankDetails).length) {
    await employeeService.upsertBankDetails(employeeId, bankDetails);
  }
  employee = await employeeService.getProfile(employeeId);
  if (payload.office_id) {
    await officeService.assignEmployee(req.user, employeeId, {
      branch_id: payload.office_id,
      department_id: payload.department_id ?? null,
    });
    employee = await employeeService.getProfile(employeeId);
  }
  new ApiResponse(201, employee, 'Employee created successfully').send(res);
});
const update = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const payload = { ...req.body };
  const existing = await employeeService.findById(req.params.id);
  const companyRows = await query(
    `SELECT COALESCE(e.company_id, d.company_id) AS company_id
       FROM employees e
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE e.employee_id = ? LIMIT 1`,
    [req.params.id]
  );
  delete payload.company_id;
  let targetCompanyId = Number(companyRows[0]?.company_id);
  if (payload.office_id) {
    const branches = await query('SELECT company_id FROM offices WHERE office_id = ? LIMIT 1', [payload.office_id]);
    if (!branches.length || !branches[0].company_id) throw ApiError.badRequest('Select a branch assigned to a company');
    targetCompanyId = Number(branches[0].company_id);
  }
  if (payload.reporting_to) {
    await accessControlService.assertEmployeeScope(req.user, payload.reporting_to);
    const managers = await query(
      `SELECT COALESCE(manager.company_id, dept.company_id) AS company_id
         FROM employees manager
         LEFT JOIN departments dept ON dept.department_id = manager.department_id
        WHERE manager.employee_id = ? LIMIT 1`,
      [payload.reporting_to]
    );
    if (!managers.length || Number(managers[0].company_id) !== targetCompanyId) {
      throw ApiError.badRequest('The reporting manager must belong to the employee company');
    }
  }
  const hasAssignmentChange = payload.office_id !== undefined
    || (payload.department_id !== undefined && existing.office_id);
  if (hasAssignmentChange) {
    const branchId = payload.office_id !== undefined ? payload.office_id : existing.office_id;
    if (!branchId) throw ApiError.badRequest('Select a branch to change the employee assignment');
    await accessControlService.assertBranchScope(req.user, branchId);
    await officeService.assignEmployee(req.user, req.params.id, {
      branch_id: branchId,
      department_id: payload.department_id !== undefined ? payload.department_id : existing.department_id,
    });
    delete payload.office_id;
    delete payload.department_id;
  } else if (payload.department_id) {
    await accessControlService.assertDepartmentScope(req.user, payload.department_id);
    const departments = await query(
      'SELECT company_id FROM departments WHERE department_id = ? LIMIT 1',
      [payload.department_id]
    );
    if (!departments.length || Number(departments[0].company_id) !== Number(existing.company_id)) {
      throw ApiError.badRequest('The selected department does not belong to this company');
    }
  }
  const employee = await employeeService.update(req.params.id, payload);
  new ApiResponse(200, employee, 'Employee updated successfully').send(res);
});
const getContactInfo = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile.contactInfo, 'Contact information fetched').send(res);
});
const updateContactInfo = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const result = await employeeService.upsertContactInfo(req.params.id, req.body);
  new ApiResponse(200, result, 'Contact information updated').send(res);
});
const getBankDetails = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile.bankDetails, 'Bank details fetched').send(res);
});
const updateBankDetails = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const result = await employeeService.upsertBankDetails(req.params.id, req.body);
  new ApiResponse(200, result, 'Bank details updated').send(res);
});
const orgChart = asyncHandler(async (req, res) => {
  const rows = await employeeService.orgChart();
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const scopedRows = await filterEmployeesByCompany(rows, companyId, req.user);
  new ApiResponse(200, scopedRows, 'Org chart data fetched').send(res);
});
const directory = asyncHandler(async (req, res) => {
  const rows = await employeeService.directory(req.query);
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const scopedRows = await filterEmployeesByCompany(rows, companyId, req.user);
  new ApiResponse(200, scopedRows, 'People directory fetched').send(res);
});
const myTeam = asyncHandler(async (req, res) => {
  const data = await employeeService.myTeam(req.user.employeeId);
  const companyId = resolveCompanyScope(req.user);
  if (companyId === null) return new ApiResponse(200, data, 'My team fetched').send(res);
  const teamRows = [data.manager, ...(data.teammates || [])].filter(Boolean);
  const allowed = await filterEmployeesByCompany(teamRows, companyId, req.user);
  const allowedIds = new Set(allowed.map((row) => Number(row.employee_id)));
  const manager = data.manager && allowedIds.has(Number(data.manager.employee_id)) ? data.manager : null;
  const teammates = (data.teammates || []).filter((employee) => allowedIds.has(Number(employee.employee_id)));
  new ApiResponse(200, { ...data, manager, teammates }, 'My team fetched').send(res);
});
const changeRole = asyncHandler(async (req, res) => {
  throw new ApiError(410, 'Use the scoped access-control role assignment endpoint');
});
const listRoles = asyncHandler(async (req, res) => {
  const roles = await employeeService.listRoles();
  new ApiResponse(200, roles, 'Roles fetched').send(res);
});
const listWithRoles = asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployeesWithRoles();
  const companyId = resolveCompanyScope(req.user, req.query.company_id);
  const rows = await filterEmployeesByCompany(employees, companyId, req.user);
  new ApiResponse(200, rows, 'Employees with roles fetched').send(res);
});

const assignBranch = asyncHandler(async (req, res) => {
  const result = await officeService.assignEmployee(req.user, req.params.id, req.body);
  new ApiResponse(200, result, 'Employee branch assignment updated').send(res);
});

const assignmentHistory = asyncHandler(async (req, res) => {
  const rows = await officeService.listEmployeeAssignments(req.user, req.params.id);
  new ApiResponse(200, rows, 'Employee branch assignment history fetched').send(res);
});
module.exports = {
  ...base,
  list,
  getMe,
  getOne,
  create,
  update,
  getContactInfo,
  updateContactInfo,
  getBankDetails,
  updateBankDetails,
  orgChart,
  directory,
  myTeam,
  changeRole,
  listRoles,
  listWithRoles,
  assignBranch,
  assignmentHistory
};
