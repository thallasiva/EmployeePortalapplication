const attendanceService = require('../services/attendance.service');
const regularizationService = require('../services/attendanceRegularization.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, department_id, from_date, to_date, status } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;

  const { rows, total } = await attendanceService.list({
    employee_id, department_id, from_date, to_date, status, reporting_to, limit, offset,
  });

  new ApiResponse(200, rows, 'Attendance records fetched', buildMeta({ page, limit, total })).send(res);
});

const today = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  const record = await attendanceService.getToday(employeeId);
  new ApiResponse(200, record, "Today's attendance fetched").send(res);
});

const monthly = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user.employeeId;
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const rows = await attendanceService.monthly(employeeId, month, year);
  new ApiResponse(200, rows, 'Monthly attendance fetched').send(res);
});

const checkIn = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.checkIn(employeeId, req.body);
  new ApiResponse(200, record, 'Checked in successfully').send(res);
});

const checkOut = asyncHandler(async (req, res) => {
  const employeeId = req.user.employeeId;
  const record = await attendanceService.checkOut(employeeId, req.body);
  new ApiResponse(200, record, 'Checked out successfully').send(res);
});

const dashboard = asyncHandler(async (req, res) => {
  const stats = await attendanceService.dashboard(req.query.date);
  new ApiResponse(200, stats, 'Attendance dashboard fetched').send(res);
});

const teamLeaveCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const rows = await attendanceService.teamLeaveCalendar(year, month);
  new ApiResponse(200, rows, 'Team leave calendar fetched').send(res);
});

// --- Regularization requests ---

const listRegularizations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { employee_id, status } = req.query;
  const reporting_to = req.user.roleName === 'Reporting Manager' ? req.user.employeeId : undefined;
  const { rows, total } = await regularizationService.list({ employee_id, status, reporting_to, limit, offset });
  new ApiResponse(200, rows, 'Regularization requests fetched', buildMeta({ page, limit, total })).send(res);
});

const createRegularization = asyncHandler(async (req, res) => {
  const record = await regularizationService.create(req.body);
  new ApiResponse(201, record, 'Regularization request submitted').send(res);
});

const reviewRegularization = asyncHandler(async (req, res) => {
  const record = await regularizationService.review(req.params.id, {
    decision: req.body.decision,
    reviewed_by: req.user.employeeId,
    remarks: req.body.remarks,
  });
  new ApiResponse(200, record, `Regularization request ${req.body.decision.toLowerCase()}`).send(res);
});

module.exports = {
  list,
  today,
  monthly,
  checkIn,
  checkOut,
  dashboard,
  teamLeaveCalendar,
  listRegularizations,
  createRegularization,
  reviewRegularization,
};
