const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const employeeSummary = asyncHandler(async (req, res) => {
  const data = await reportService.employeeSummary();
  new ApiResponse(200, data, 'Employee report fetched').send(res);
});

const attendanceReport = asyncHandler(async (req, res) => {
  const { from_date, to_date, department_id } = req.query;
  const data = await reportService.attendanceReport({ from_date, to_date, department_id });
  new ApiResponse(200, data, 'Attendance report fetched').send(res);
});

const leaveReport = asyncHandler(async (req, res) => {
  const { year, department_id, status } = req.query;
  const data = await reportService.leaveReport({ year, department_id, status });
  new ApiResponse(200, data, 'Leave report fetched').send(res);
});

const payrollReport = asyncHandler(async (req, res) => {
  const { month, year, department_id } = req.query;
  const data = await reportService.payrollReport({ month, year, department_id });
  new ApiResponse(200, data, 'Payroll report fetched').send(res);
});

const helpdeskReport = asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const data = await reportService.helpdeskReport({ from_date, to_date });
  new ApiResponse(200, data, 'Helpdesk report fetched').send(res);
});

const hiringReport = asyncHandler(async (req, res) => {
  const data = await reportService.hiringReport();
  new ApiResponse(200, data, 'Hiring report fetched').send(res);
});

const reviewReport = asyncHandler(async (req, res) => {
  const { review_type_id, status } = req.query;
  const data = await reportService.reviewReport({ review_type_id, status });
  new ApiResponse(200, data, 'Review report fetched').send(res);
});

module.exports = {
  employeeSummary,
  attendanceReport,
  leaveReport,
  payrollReport,
  helpdeskReport,
  hiringReport,
  reviewReport,
};
