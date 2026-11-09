const employeeService = require('../services/employee.service');
const { createCrudController } = require('./base.controller');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('../utils/hash');
const { query } = require('../config/db');
const { assertCompanyEmployee } = require('../middleware/rbac');
const base = createCrudController(employeeService, { entityName: 'Employee' });
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { department, status, search } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await employeeService.list({ department, status, search, reporting_to, limit, offset, companyId: req.user.companyId });
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
  // A company-scoped administrator cannot move a new employee into another
  // tenant by changing the request body. Platform admins can select a company.
  if (req.user.companyId) payload.company_id = req.user.companyId;
  if (!payload.company_id && payload.department_id) {
    const rows = await query('SELECT company_id FROM departments WHERE department_id = ? LIMIT 1', [payload.department_id]);
    payload.company_id = rows[0]?.company_id ?? null;
  }
  if (!payload.company_id) {
    const rows = await query('SELECT MIN(company_id) AS company_id FROM companies');
    payload.company_id = rows[0]?.company_id ?? null;
  }
  if (!payload.company_id) throw ApiError.badRequest('Assign this employee to a company before creating the profile');
  if (payload.department_id) {
    const rows = await query('SELECT company_id FROM departments WHERE department_id = ? LIMIT 1', [payload.department_id]);
    if (!rows.length || Number(rows[0].company_id) !== Number(payload.company_id)) {
      throw ApiError.badRequest('The selected department does not belong to this company');
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
  await employeeService.update(employeeId, payload);
  if (contactInfo && Object.keys(contactInfo).length) {
    await employeeService.upsertContactInfo(employeeId, contactInfo);
  }
  if (bankDetails && Object.keys(bankDetails).length) {
    await employeeService.upsertBankDetails(employeeId, bankDetails);
  }
  employee = await employeeService.getProfile(employeeId);
  new ApiResponse(201, employee, 'Employee created successfully').send(res);
});
const update = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.id);
  const payload = { ...req.body };
  // Company membership changes must use a dedicated transfer workflow.
  delete payload.company_id;
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
  new ApiResponse(200, rows, 'Org chart data fetched').send(res);
});
const directory = asyncHandler(async (req, res) => {
  const rows = await employeeService.directory(req.query);
  new ApiResponse(200, rows, 'People directory fetched').send(res);
});
const myTeam = asyncHandler(async (req, res) => {
  const data = await employeeService.myTeam(req.user.employeeId);
  new ApiResponse(200, data, 'My team fetched').send(res);
});
const changeRole = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.id);
  await assertCompanyEmployee(req.user, employeeId);
  const { roleId } = req.body;
  if (!roleId) throw ApiError.badRequest('roleId is required');
  await employeeService.changeRole(employeeId, Number(roleId));
  new ApiResponse(200, { employeeId, roleId }, 'Role updated successfully').send(res);
});
const listRoles = asyncHandler(async (req, res) => {
  const roles = await employeeService.listRoles();
  new ApiResponse(200, roles, 'Roles fetched').send(res);
});
const listWithRoles = asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployeesWithRoles();
  new ApiResponse(200, employees, 'Employees with roles fetched').send(res);
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
  listWithRoles
};
