const employeeService = require('../services/employee.service');
const { createCrudController } = require('./base.controller');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hashPassword } = require('../utils/hash');

const base = createCrudController(employeeService, { entityName: 'Employee' });

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { department, status, search } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await employeeService.list({ department, status, search, reporting_to, limit, offset });
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
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile, 'Employee profile fetched').send(res);
});

const create = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  const { contactInfo, bankDetails } = payload;
  delete payload.contactInfo;
  delete payload.bankDetails;

  if (payload.password) {
    payload.password_hash = await hashPassword(payload.password);
    delete payload.password;
  }

  let employee = await employeeService.createWithProcedure(payload);
  const employeeId = employee.employee_id;

  // sp_create_employee only covers the core fields; persist the extended
  // statutory/identity fields via a follow-up update against FILLABLE.
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

const getContactInfo = asyncHandler(async (req, res) => {
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile.contactInfo, 'Contact information fetched').send(res);
});

const updateContactInfo = asyncHandler(async (req, res) => {
  const result = await employeeService.upsertContactInfo(req.params.id, req.body);
  new ApiResponse(200, result, 'Contact information updated').send(res);
});

const getBankDetails = asyncHandler(async (req, res) => {
  const profile = await employeeService.getProfile(req.params.id);
  if (!profile) throw ApiError.notFound('Employee not found');
  new ApiResponse(200, profile.bankDetails, 'Bank details fetched').send(res);
});

const updateBankDetails = asyncHandler(async (req, res) => {
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

module.exports = {
  ...base,
  list,
  getMe,
  getOne,
  create,
  getContactInfo,
  updateContactInfo,
  getBankDetails,
  updateBankDetails,
  orgChart,
  directory,
  myTeam,
};
