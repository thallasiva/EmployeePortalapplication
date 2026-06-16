const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const stats = asyncHandler(async (req, res) => {
  const data = await dashboardService.stats();
  new ApiResponse(200, data, 'Dashboard stats fetched').send(res);
});

const attendanceDashboard = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const data = await dashboardService.attendanceDashboard(date);
  new ApiResponse(200, data, 'Attendance dashboard fetched').send(res);
});

const teamLeaveCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year || now.getFullYear());
  const month = Number(req.query.month || now.getMonth() + 1);
  const data = await dashboardService.teamLeaveCalendar(year, month);
  new ApiResponse(200, data, 'Team leave calendar fetched').send(res);
});

const events = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month || now.getMonth() + 1);
  const data = await dashboardService.birthdaysAndAnniversaries(month);
  new ApiResponse(200, data, 'Birthdays and anniversaries fetched').send(res);
});

const recentActivities = asyncHandler(async (req, res) => {
  const data = await dashboardService.recentActivities(req.query.limit);
  new ApiResponse(200, data, 'Recent activities fetched').send(res);
});

module.exports = { stats, attendanceDashboard, teamLeaveCalendar, events, recentActivities };
