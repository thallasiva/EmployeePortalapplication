const svc = require('../services/salaryAssignment.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { assertCompanyEmployee } = require('../middleware/rbac');
const listAll = asyncHandler(async (req, res) => {
  const { department_id, search } = req.query;
  new ApiResponse(200, await svc.listAll({ department_id, search, companyId: req.user.companyId }), 'Assignments fetched').send(res);
});
const getAssignment = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.employeeId);
  const data = await svc.getAssignment(req.params.employeeId, req.user.companyId);
  new ApiResponse(200, data, 'Assignment fetched').send(res);
});
const assign = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.employeeId);
  const data = await svc.assign(req.params.employeeId, req.body, req.user.companyId);
  new ApiResponse(200, data, 'Salary structure assigned').send(res);
});
const history = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.employeeId);
  new ApiResponse(200, await svc.history(req.params.employeeId, req.user.companyId), 'History fetched').send(res);
});
// Self-service: an employee's own salary revision history.
const myHistory = asyncHandler(async (req, res) => {
  new ApiResponse(200, await svc.history(req.user.employeeId, req.user.companyId), 'History fetched').send(res);
});
const computeBreakdown = asyncHandler(async (req, res) => {
  await assertCompanyEmployee(req.user, req.params.employeeId);
  const { ctc_annual } = req.body;
  const data = await svc.computePayslipBreakdown(
    req.params.employeeId,
    req.user.companyId,
    ctc_annual ? Number(ctc_annual) : null
  );
  new ApiResponse(200, data, 'Breakdown computed').send(res);
});
module.exports = { listAll, getAssignment, assign, history, myHistory, computeBreakdown };
