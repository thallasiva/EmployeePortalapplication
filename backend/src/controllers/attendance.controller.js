const attendanceService = require('../services/attendance.service');
const regularizationService = require('../services/attendanceRegularization.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const { assertManagesEmployee } = require('../middleware/rbac');
const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, department_id, from_date, to_date, status } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await attendanceService.list({
    employee_id, department_id, from_date, to_date, status, reporting_to, limit, offset, companyId: req.user.companyId
  });
  new ApiResponse(200, rows, 'Attendance records fetched', buildMeta({ page, limit, total })).send(res);
});
const today = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  await assertManagesEmployee(req.user, employeeId);
  const record = await attendanceService.getToday(employeeId);
  new ApiResponse(200, record, "Today's attendance fetched").send(res);
});
const monthly = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  await assertManagesEmployee(req.user, employeeId);
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const rows = await attendanceService.monthly(employeeId, month, year);
  new ApiResponse(200, rows, 'Monthly attendance fetched').send(res);
});
const swipes = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  await assertManagesEmployee(req.user, employeeId);
  if (!req.query.date) throw new Error('Attendance date is required');
  const rows = await attendanceService.swipes(employeeId, req.query.date);
  new ApiResponse(200, rows, 'Daily swipes fetched').send(res);
});
const checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.checkIn(employeeId, req.body);
  new ApiResponse(200, record, 'Checked in successfully').send(res);
});
const breakStart = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.breakStart(employeeId, req.body);
  new ApiResponse(200, record, 'Break started').send(res);
});
const breakEnd = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.breakEnd(employeeId, req.body);
  new ApiResponse(200, record, 'Break ended').send(res);
});
const checkOut = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.checkOut(employeeId, req.body);
  new ApiResponse(200, record, 'Checked out successfully').send(res);
});
const dashboard = asyncHandler(async (req, res) => {
  const stats = await attendanceService.dashboard(req.query.date, req.user.companyId);
  new ApiResponse(200, stats, 'Attendance dashboard fetched').send(res);
});
const analytics = asyncHandler(async (req, res) => {
  const { from_date: fromDate, to_date: toDate } = req.query;
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
  };
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    throw ApiError.badRequest('Valid from_date and to_date values are required');
  }
  const dayCount = (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000;
  if (dayCount < 0 || dayCount > 6) {
    throw ApiError.badRequest('Attendance analytics supports a maximum seven-day range');
  }
  const data = await attendanceService.analytics(fromDate, toDate, req.user.companyId);
  new ApiResponse(200, data, 'Attendance analytics fetched').send(res);
});
const teamLeaveCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const rows = await attendanceService.teamLeaveCalendar(year, month, req.user.companyId);
  new ApiResponse(200, rows, 'Team leave calendar fetched').send(res);
});
const listRegularizations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await regularizationService.list({ employee_id, status, reporting_to, limit, offset, companyId: req.user.companyId });
  new ApiResponse(200, rows, 'Regularization requests fetched', buildMeta({ page, limit, total })).send(res);
});
const createRegularization = asyncHandler(async (req, res) => {
  // The employee identity must come from the authenticated session, never the
  // request body, so a user cannot create requests for another employee.
  const record = await regularizationService.create({ ...req.body, employee_id: req.user.employeeId });
  new ApiResponse(201, record, 'Regularization request submitted').send(res);
});
const reviewRegularization = asyncHandler(async (req, res) => {
  const request = await regularizationService.getDetails(req.params.id);
  if (!request) throw ApiError.notFound('Regularization request not found');
  if (Number(request.employee_id) === Number(req.user.employeeId)) {
    throw ApiError.forbidden('You cannot review your own attendance regularization');
  }
  await assertManagesEmployee(req.user, request.employee_id);
  const record = await regularizationService.review(req.params.id, {
    decision: req.body.decision,
    reviewed_by: req.user.employeeId,
    remarks: req.body.remarks
  });
  new ApiResponse(200, record, `Regularization request ${req.body.decision.toLowerCase()}`).send(res);
});
module.exports = {
  list,
  today,
  monthly,
  swipes,
  breakStart,
  breakEnd,
  checkIn,
  checkOut,
  dashboard,
  analytics,
  teamLeaveCalendar,
  listRegularizations,
  createRegularization,
  reviewRegularization
};
