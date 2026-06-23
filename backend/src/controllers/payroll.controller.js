const salaryStructureService = require('../services/salaryStructure.service');
const payslipService = require('../services/payslip.service');
const payrollRunService = require('../services/payrollRun.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hasPermission } = require('../middleware/rbac');

// --- Salary structures ---

const listSalaryStructures = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await salaryStructureService.list({ employee_id: req.query.employee_id, limit, offset, reqUser: req.user });
  new ApiResponse(200, rows, 'Salary structures fetched', buildMeta({ page, limit, total })).send(res);
});

const getSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryStructureService.getDetails(req.params.id, req.user);
  if (!record) throw ApiError.notFound('Salary structure not found');
  new ApiResponse(200, record, 'Salary structure fetched').send(res);
});

const getLatestSalaryStructure = asyncHandler(async (req, res) =>
{
  const employeeId = req.params.employeeId || req.user.employeeId;
  const record = await salaryStructureService.latestForEmployee(employeeId, req.user);
  if (!record) throw ApiError.notFound('No salary structure found for this employee');
  new ApiResponse(200, record, 'Latest salary structure fetched').send(res);
});

const createSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryStructureService.create(req.body);
  new ApiResponse(201, record, 'Salary structure created').send(res);
});

const updateSalaryStructure = asyncHandler(async (req, res) =>
{
  const exists = await salaryStructureService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Salary structure not found');
  const record = await salaryStructureService.update(req.params.id, req.body);
  new ApiResponse(200, record, 'Salary structure updated').send(res);
});

const removeSalaryStructure = asyncHandler(async (req, res) =>
{
  const exists = await salaryStructureService.existsById(req.params.id);
  if (!exists) throw ApiError.notFound('Salary structure not found');
  await salaryStructureService.remove(req.params.id);
  new ApiResponse(200, null, 'Salary structure deleted').send(res);
});

const importSalaryStructures = asyncHandler(async (req, res) =>
{
  const result = await salaryStructureService.bulkImport(req.body.items);
  new ApiResponse(200, result, 'Salary structures imported').send(res);
});

// --- Payslips ---

const listPayslips = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, month, year, status, department_id, payroll_run_id } = req.query;
  const { rows, total } = await payslipService.list({
    employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser: req.user,
  });
  new ApiResponse(200, rows, 'Payslips fetched', buildMeta({ page, limit, total })).send(res);
});

const myPayslips = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { month, year, status } = req.query;
  // Self-service: employee sees their own payslips unmasked
  const { rows, total } = await payslipService.list({
    employee_id: req.user.employeeId, month, year, status, limit, offset, reqUser: req.user,
  });
  new ApiResponse(200, rows, 'Payslips fetched', buildMeta({ page, limit, total })).send(res);
});

const getPayslip = asyncHandler(async (req, res) =>
{
  const record = await payslipService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Payslip not found');
  new ApiResponse(200, record, 'Payslip fetched').send(res);
});

const getPayslipFull = asyncHandler(async (req, res) =>
{
  const record = await payslipService.getFullDetails(req.params.id);
  if (!record) throw ApiError.notFound('Payslip not found');

  const isOwner = record.employee.employee_id === req.user.employeeId;
  if (!isOwner)
  {
    const allowed = await hasPermission(req.user, 'payroll', 'view');
    if (!allowed) throw ApiError.forbidden('You do not have access to this payslip');
  }

  new ApiResponse(200, record, 'Payslip fetched').send(res);
});

const generatePayslip = asyncHandler(async (req, res) =>
{
  const record = await payslipService.generate(req.body);
  new ApiResponse(200, record, 'Payslip generated').send(res);
});

/**
 * Self-service: generates (or refreshes) the logged-in employee's own
 * payslip for the given month/year, defaulting to the current month.
 * Idempotent — relies on the uq_payslip_period unique key.
 */
const generateMyPayslip = asyncHandler(async (req, res) =>
{
  const now = new Date();
  const month = req.body.month || now.getMonth() + 1;
  const year = req.body.year || now.getFullYear();

  const record = await payslipService.generate({
    employee_id: req.user.employeeId,
    month,
    year,
    payroll_run_id: null,
  });
  new ApiResponse(200, record, 'Payslip generated').send(res);
});

const generateAllPayslips = asyncHandler(async (req, res) =>
{
  const result = await payslipService.generateAllAndNotify({
    ...req.body,
    processed_by: req.user.employeeId,
  });
  new ApiResponse(200, result, 'Payslips generated and emailed').send(res);
});

const markPayslipPaid = asyncHandler(async (req, res) =>
{
  const record = await payslipService.markPaid(req.params.id);
  new ApiResponse(200, record, 'Payslip marked as paid').send(res);
});

// --- Payroll runs ---

const listPayrollRuns = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { rows, total } = await payrollRunService.list({ year: req.query.year, status: req.query.status, limit, offset });
  new ApiResponse(200, rows, 'Payroll runs fetched', buildMeta({ page, limit, total })).send(res);
});

const getPayrollRun = asyncHandler(async (req, res) =>
{
  const record = await payrollRunService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Payroll run not found');
  new ApiResponse(200, record, 'Payroll run fetched').send(res);
});

const runPayroll = asyncHandler(async (req, res) =>
{
  const record = await payrollRunService.run({ ...req.body, processed_by: req.user.employeeId });
  new ApiResponse(200, record, 'Payroll run completed').send(res);
});

module.exports = {
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
  generatePayslip,
  markPayslipPaid,
  listPayrollRuns,
  getPayrollRun,
  runPayroll,
  importSalaryStructures,
  generateMyPayslip,
  generateAllPayslips,
};
