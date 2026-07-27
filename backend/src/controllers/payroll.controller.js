
const salaryStructureService = require('../services/salaryStructure.service');

const salaryComponentService = require('../services/salaryComponent.service');
const payslipService = require('../services/payslip.service');
const payrollRunService = require('../services/payrollRun.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { callProcedure } = require('../config/db');
const { getPagination, buildMeta } = require('../utils/pagination');
const { hasPermission } = require('../middleware/rbac');



const listSalaryStructures = asyncHandler(async (req, res) =>
{


  const structures = await salaryComponentService.listStructures();
  new ApiResponse(200, structures, 'Salary structures fetched', { total: structures.length }).send(res);
});

const getSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.getStructure(req.params.id);
  new ApiResponse(200, record, 'Salary structure fetched').send(res);
});

const getLatestSalaryStructure = asyncHandler(async (req, res) =>
{

  const employeeId = req.params.employeeId || req.user.employeeId;
  const results = await callProcedure('sp_get_employee_salary_assignment(?)', [employeeId]);
  const assignment = (results[0] ?? [])[0] ?? null;
  if (!assignment) throw ApiError.notFound('No salary structure assigned to this employee');
  const lines = results[1] ?? [];
  new ApiResponse(200, { ...assignment, lines }, 'Employee salary assignment fetched').send(res);
});

const createSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.upsertStructure(null, req.body);
  new ApiResponse(201, record, 'Salary structure created').send(res);
});

const updateSalaryStructure = asyncHandler(async (req, res) =>
{
  const record = await salaryComponentService.upsertStructure(req.params.id, req.body);
  new ApiResponse(200, record, 'Salary structure updated').send(res);
});

const removeSalaryStructure = asyncHandler(async (req, res) =>
{

  await callProcedure('sp_upsert_salary_structure(?,?,?,?)', [
  req.params.id, null, null, null]
  ).catch(() => null);
  new ApiResponse(200, null, 'Salary structure deleted').send(res);
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
    employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser: req.user
  });
  new ApiResponse(200, rows, 'Payslips fetched', buildMeta({ page, limit, total })).send(res);
});

const myPayslips = asyncHandler(async (req, res) =>
{
  const { page, limit, offset } = getPagination(req.query);
  const { month, year, status } = req.query;

  const { rows, total } = await payslipService.list({
    employee_id: req.user.employeeId, month, year, status, limit, offset, reqUser: req.user
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

const markPayslipPaid = asyncHandler(async (req, res) =>
{
  const record = await payslipService.markPaid(req.params.id);
  new ApiResponse(200, record, 'Payslip marked as paid').send(res);
});



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
  generateAllPayslips
};
