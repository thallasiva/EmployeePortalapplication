const salaryComponentService = require('../services/salaryComponent.service');
const payslipService = require('../services/payslip.service');
const payrollRunService = require('../services/payrollRun.service');
const payrollAttendanceService = require('../services/payrollAttendance.service');
const payrollDashboardService = require('../services/payrollDashboard.service');
const payrollPolicyService = require('../services/payrollPolicy.service');
const payrollPayGroupService = require('../services/payrollPayGroup.service');
const payrollPeriodService = require('../services/payrollPeriod.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { callProcedure } = require('../config/db');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hasPermission, assertCompanyEmployee } = require('../middleware/rbac');
const listSalaryStructures = asyncHandler(async (req, res) =>
{
  const structures = await salaryComponentService.listStructures(req.user.companyId);
  new ApiResponse(200, structures, 'Salary structures fetched', { total: structures.length }).send(res);
});
const getSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.getStructure(req.params.id, req.user.companyId);
  new ApiResponse(200, record, 'Salary structure fetched').send(res);
});
const getLatestSalaryStructure = asyncHandler(async (req, res) =>
{
  const employeeId = req.params.employeeId || req.user.employeeId;
  await assertCompanyEmployee(req.user, employeeId);
  const results = await callProcedure('sp_get_employee_salary_assignment(?)', [employeeId]);
  const assignment = (results[0] ?? [])[0] ?? null;
  if (!assignment) throw ApiError.notFound('No salary structure assigned to this employee');
  const lines = results[1] ?? [];
  new ApiResponse(200, { ...assignment, lines }, 'Employee salary assignment fetched').send(res);
});
const createSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.upsertStructure(null, req.body, req.user.companyId);
  new ApiResponse(201, record, 'Salary structure created').send(res);
});
const updateSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.upsertStructure(req.params.id, req.body, req.user.companyId);
  new ApiResponse(200, record, 'Salary structure updated').send(res);
});
const removeSalaryStructure = asyncHandler(async (req, res) =>
{
  await salaryComponentService.deactivateStructure(req.params.id, req.user.companyId);
  new ApiResponse(200, null, 'Salary structure deactivated').send(res);
});
const importSalaryStructures = asyncHandler(async (req, res) =>
{
  throw ApiError.badRequest(
    'Bulk import is not supported in the new salary structure system. ' +
    'Use the Salary Structures editor to create templates and assign them via Employee Salary Assignment.'
  );
});
const listPayslips = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, month, year, status, department_id, payroll_run_id } = req.query;
  const { rows, total } = await payslipService.list({
    employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser: req.user, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Payslips fetched', buildMeta({ page, limit, total })).send(res);
});
const myPayslips = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { month, year, status } = req.query;
  const { rows, total } = await payslipService.list({
    employee_id: req.user.employeeId, month, year, status, limit, offset, reqUser: req.user, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Payslips fetched', buildMeta({ page, limit, total })).send(res);
});
const getPayslip = asyncHandler(async (req, res) =>
{
  const record = await payslipService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Payslip not found');
  if (record.employee_id) await assertCompanyEmployee(req.user, record.employee_id);
  new ApiResponse(200, record, 'Payslip fetched').send(res);
});
const getPayslipFull = asyncHandler(async (req, res) =>
{
  const record = await payslipService.getFullDetails(req.params.id);
  if (!record) throw ApiError.notFound('Payslip not found');
  const isOwner = record.employee.employee_id === req.user.employeeId;
  await assertCompanyEmployee(req.user, record.employee.employee_id);
  if (!isOwner)
  {
    const allowed = await hasPermission(req.user, 'payroll', 'view');
    if (!allowed) throw ApiError.forbidden('You do not have access to this payslip');
  }
  new ApiResponse(200, record, 'Payslip fetched').send(res);
});
const generatePayslip = asyncHandler(async (req, res) =>
{
  await assertCompanyEmployee(req.user, req.body.employee_id);
  const record = await payslipService.generate(req.body);
  new ApiResponse(200, record, 'Payslip generated').send(res);
});
const generateMyPayslip = asyncHandler(async (req, res) =>
{
  const now = new Date();
  const month = req.body.month || now.getMonth() + 1;
  const year = req.body.year || now.getFullYear();
  const record = await payslipService.generate({
    employee_id: req.user.employeeId,
    month,
    year,
    payroll_run_id: null
  });
  new ApiResponse(200, record, 'Payslip generated').send(res);
});
const generateAllPayslips = asyncHandler(async (req, res) =>
{
  const result = await payslipService.generateAllAndNotify({
    ...req.body,
    processed_by: req.user.employeeId
  });
  new ApiResponse(200, result, 'Payslips generated and emailed').send(res);
});
const listPayrollRuns = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await payrollRunService.list({ year: req.query.year, status: req.query.status, limit, offset, companyId: req.user.companyId });
  new ApiResponse(200, rows, 'Payroll runs fetched', buildMeta({ page, limit, total })).send(res);
});
const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const data = await payrollDashboardService.overview({
    month: req.query.month || now.getMonth() + 1,
    year: req.query.year || now.getFullYear(),
    companyId: req.user.companyId,
  });
  new ApiResponse(200, data, 'Payroll dashboard fetched').send(res);
});
const getPayrollPolicy = asyncHandler(async (req, res) => {
  const data = await payrollPolicyService.get({ companyId: req.user.companyId, asOf: req.query.as_of });
  new ApiResponse(200, data, 'Payroll policy fetched').send(res);
});
const savePayrollPolicy = asyncHandler(async (req, res) => {
  const data = await payrollPolicyService.save({ companyId: req.user.companyId, userId: req.user.employeeId, payload: req.body });
  new ApiResponse(200, data, 'Payroll policy saved').send(res);
});
const listPayrollPayGroups = asyncHandler(async (req, res) => {
  const rows = await payrollPayGroupService.list(req.user.companyId);
  new ApiResponse(200, rows, 'Payroll pay groups fetched').send(res);
});
const listPayrollGroupAssignments = asyncHandler(async (req, res) => {
  const rows = await payrollPayGroupService.listAssignments(req.user.companyId, req.query.as_of);
  new ApiResponse(200, rows, 'Pay group assignments fetched').send(res);
});
const assignPayrollGroup = asyncHandler(async (req, res) => {
  const row = await payrollPayGroupService.assignEmployee(req.user.companyId, req.user.employeeId, req.body);
  new ApiResponse(200, row, 'Employee pay group assignment saved').send(res);
});
const createPayrollPayGroup = asyncHandler(async (req, res) => {
  const row = await payrollPayGroupService.create(req.user.companyId, req.user.employeeId, req.body);
  new ApiResponse(201, row, 'Payroll pay group created').send(res);
});
const updatePayrollPayGroup = asyncHandler(async (req, res) => {
  const row = await payrollPayGroupService.update(req.user.companyId, req.params.id, req.body);
  new ApiResponse(200, row, 'Payroll pay group updated').send(res);
});
const deactivatePayrollPayGroup = asyncHandler(async (req, res) => {
  await payrollPayGroupService.deactivate(req.user.companyId, req.params.id);
  new ApiResponse(200, null, 'Payroll pay group deactivated').send(res);
});
const getPayrollRun = asyncHandler(async (req, res) =>
{
  const record = await payrollRunService.getDetails(req.params.id, req.user.companyId);
  if (!record) throw ApiError.notFound('Payroll run not found');
  new ApiResponse(200, record, 'Payroll run fetched').send(res);
});
// Payroll is calculated from each employee's attendance for the month.
const runPayroll = asyncHandler(async (req, res) =>
{
  const { month, year } = req.body;
  const result = await payrollAttendanceService.processPayroll({ month: Number(month), year: Number(year), processedBy: req.user.employeeId, companyId: req.user.companyId });
  const record = await payrollRunService.getDetails(result.payroll_run_id, req.user.companyId);
  new ApiResponse(200, { ...record, processing: result },
    `Payroll processed for ${result.processed} employee(s)${result.on_hold ? `, ${result.on_hold} on hold` : ''}${result.skipped.length ? `, ${result.skipped.length} skipped (no salary)` : ''}`).send(res);
});
const attendanceSummary = asyncHandler(async (req, res) => {
  const data = await payrollAttendanceService.getMonthSummary({
    month: req.query.month, year: req.query.year,
    includeDays: req.query.days !== '0',
    companyId: req.user.companyId,
  });
  new ApiResponse(200, data, 'Attendance and salary summary fetched').send(res);
});
const saveAttendanceAdjustment = asyncHandler(async (req, res) => {
  const { month, year, lop_adjustment, hold_salary, reason } = req.body;
  await assertCompanyEmployee(req.user, req.params.employeeId);
  const record = await payrollAttendanceService.saveAdjustment({
    employeeId: Number(req.params.employeeId), month: Number(month), year: Number(year),
    lopAdjustment: lop_adjustment, holdSalary: hold_salary, reason, userId: req.user.employeeId, companyId: req.user.companyId,
  });
  const [row] = (await payrollAttendanceService.getMonthSummary({
    month,
    year,
    employeeIds: [Number(req.params.employeeId)],
    companyId: req.user.companyId,
  })).employees;
  new ApiResponse(200, { adjustment: record, employee: row || null }, 'Adjustment saved').send(res);
});
const submitPayrollReview = asyncHandler(async (req, res) =>
  new ApiResponse(200, await payrollRunService.submitForReview(req.params.id, req.user.employeeId, req.user.companyId), 'Payroll submitted for review').send(res));
const reviewPayroll = asyncHandler(async (req, res) =>
  new ApiResponse(200, await payrollRunService.review(req.params.id, req.user.employeeId, req.body, req.user.companyId), 'Payroll review recorded').send(res));
const listPayrollInputs = asyncHandler(async (req, res) => new ApiResponse(200, await payrollRunService.listInputs({ ...req.query, companyId: req.user.companyId }), 'Payroll inputs fetched').send(res));
const createPayrollInput = asyncHandler(async (req, res) => new ApiResponse(201, await payrollRunService.createInput({ ...req.body, createdBy: req.user.employeeId, companyId: req.user.companyId }), 'Payroll input submitted for review').send(res));
const reviewPayrollInput = asyncHandler(async (req, res) => new ApiResponse(200, await payrollRunService.reviewInput(req.params.id, req.user.employeeId, req.body, req.user.companyId), 'Payroll input reviewed').send(res));
const payrollPeriod = asyncHandler(async (req, res) => new ApiResponse(200, await payrollPeriodService.get({ companyId: req.user.companyId, year: req.params.year, month: req.params.month }), 'Payroll period fetched').send(res));
const lockPayrollInputs = asyncHandler(async (req, res) => {
  const snapshot = await payrollAttendanceService.getMonthSummary({ month: req.params.month, year: req.params.year, includeDays: false, companyId: req.user.companyId });
  const period = await payrollPeriodService.lockInputs({ companyId: req.user.companyId, year: req.params.year, month: req.params.month, userId: req.user.employeeId, reason: req.body.reason, snapshot });
  new ApiResponse(200, period, 'Payroll inputs locked and calculation snapshot saved').send(res);
});
const closePayrollPeriod = asyncHandler(async (req, res) => new ApiResponse(200, await payrollPeriodService.close({ companyId: req.user.companyId, year: req.params.year, month: req.params.month, userId: req.user.employeeId, reason: req.body.reason }), 'Payroll period closed').send(res));
const reopenPayrollPeriod = asyncHandler(async (req, res) => new ApiResponse(200, await payrollPeriodService.reopen({ companyId: req.user.companyId, year: req.params.year, month: req.params.month, userId: req.user.employeeId, reason: req.body.reason }), 'Payroll period reopened').send(res));
module.exports = {
  attendanceSummary,
  saveAttendanceAdjustment,
  listSalaryStructures,
  getSalaryStructure,
  getLatestSalaryStructure,
  createSalaryStructure,
  updateSalaryStructure,
  removeSalaryStructure,
  listPayslips,
  myPayslips,
  getPayslip,
  getPayslipFull,
  dashboard,
  getPayrollPolicy,
  savePayrollPolicy,
  listPayrollPayGroups,
  listPayrollGroupAssignments, assignPayrollGroup,
  createPayrollPayGroup,
  updatePayrollPayGroup,
  deactivatePayrollPayGroup,
  payrollPeriod, lockPayrollInputs, closePayrollPeriod, reopenPayrollPeriod,
  generatePayslip,
  listPayrollRuns,
  getPayrollRun,
  runPayroll, submitPayrollReview, reviewPayroll, listPayrollInputs, createPayrollInput, reviewPayrollInput,
  importSalaryStructures,
  generateMyPayslip,
  generateAllPayslips
};
// ─── append lock handlers then re-export ───
// (Node caches module.exports; we patch the exported object directly)
const _payrollRunSvc = require('../services/payrollRun.service');
const _lockRun   = asyncHandler(async (req, res) => {
  const run = await _payrollRunSvc.lockRun(req.params.id, req.user.userId, req.body.note, req.user.companyId);
  new ApiResponse(200, run, 'Payroll run locked').send(res);
});
const _unlockRun = asyncHandler(async (req, res) => {
  const run = await _payrollRunSvc.unlockRun(req.params.id, req.user.userId, req.user.companyId);
  new ApiResponse(200, run, 'Payroll run unlocked').send(res);
});
module.exports.lockPayrollRun   = _lockRun;
module.exports.unlockPayrollRun = _unlockRun;
