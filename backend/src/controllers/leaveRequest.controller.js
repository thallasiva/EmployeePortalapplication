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

module.exports = { list, myRequests, getOne, apply, review, cancel, balances };
