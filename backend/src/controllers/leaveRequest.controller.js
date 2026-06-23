const leaveRequestService = require('../services/leaveRequest.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status, leave_type_id, department_id } = req.query;
  // Reporting Managers only see leave requests from employees who report to them.
  // Admins (and anyone else with leave:view) see everything.
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await leaveRequestService.list({
    employee_id, status, leave_type_id, department_id, reporting_to, limit, offset,
  });
  new ApiResponse(200, rows, 'Leave requests fetched', buildMeta({ page, limit, total })).send(res);
});

const myRequests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { status, leave_type_id } = req.query;
  const { rows, total } = await leaveRequestService.list({
    employee_id: req.user.employeeId, status, leave_type_id, limit, offset,
  });
  new ApiResponse(200, rows, 'Leave requests fetched', buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const record = await leaveRequestService.getDetails(req.params.id);
  if (!record) throw ApiError.notFound('Leave request not found');
  new ApiResponse(200, record, 'Leave request fetched').send(res);
});

const apply = asyncHandler(async (req, res) => {
  const record = await leaveRequestService.apply({ ...req.body, employee_id: req.user.employeeId });
  new ApiResponse(201, record, 'Leave request submitted').send(res);
});

const review = asyncHandler(async (req, res) => {
  const record = await leaveRequestService.review(req.params.id, {
    decision: req.body.decision,
    reviewed_by: req.user.employeeId,
    remarks: req.body.remarks,
  });
  new ApiResponse(200, record, `Leave request ${req.body.decision.toLowerCase()}`).send(res);
});

const cancel = asyncHandler(async (req, res) => {
  const record = await leaveRequestService.cancel(req.params.id, req.user.employeeId);
  new ApiResponse(200, record, 'Leave request cancelled').send(res);
});

const balances = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  const rows = await leaveRequestService.balances(employeeId, req.query.year);
  new ApiResponse(200, rows, 'Leave balances fetched').send(res);
});

/** GET /leave-requests/admin/balances?year= — all employees × all leave types matrix */
const allBalances = asyncHandler(async (req, res) => {
  const data = await leaveRequestService.allBalances(req.query.year);
  new ApiResponse(200, data, 'All leave balances fetched').send(res);
});

/** PUT /leave-requests/admin/adjust — upsert one employee's leave balance */
const adjustBalance = asyncHandler(async (req, res) => {
  const result = await leaveRequestService.adjustBalance(req.body);
  new ApiResponse(200, result, 'Leave balance updated').send(res);
});

/** POST /leave-requests/admin/initialize-year — create missing balance rows for a year */
const initializeYear = asyncHandler(async (req, res) => {
  const year = Number(req.body.year) || new Date().getFullYear();
  const result = await leaveRequestService.initializeBalancesForYear(year);
  new ApiResponse(200, result, `Leave balances initialized for ${year}`).send(res);
});

/** GET /leave-requests/admin/summary?year=&department_id=&status= */
const leaveSummary = asyncHandler(async (req, res) => {
  const { year, department_id, status } = req.query;
  const data = await leaveRequestService.leaveSummary(year, { department_id, status });
  new ApiResponse(200, data, 'Leave summary fetched').send(res);
});

module.exports = { list, myRequests, getOne, apply, review, cancel, balances, allBalances, adjustBalance, initializeYear, leaveSummary };
