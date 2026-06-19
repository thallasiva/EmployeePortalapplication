const ts = require('../services/timesheet.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ─── Employee Tasks ──────────────────────────────────────────────────────────

const createTask = asyncHandler(async (req, res) => {
  const task = await ts.createTask({ ...req.body, employee_id: req.user.employeeId });
  new ApiResponse(201, task, 'Task created').send(res);
});

const listMyTasks = asyncHandler(async (req, res) => {
  const rows = await ts.listMyTasks(req.user.employeeId);
  new ApiResponse(200, rows, 'Tasks fetched').send(res);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await ts.updateTask(req.params.taskId, req.user.employeeId, req.body);
  new ApiResponse(200, task, 'Task updated').send(res);
});

const deleteTask = asyncHandler(async (req, res) => {
  await ts.deleteTask(req.params.taskId, req.user.employeeId);
  new ApiResponse(200, null, 'Task deleted').send(res);
});

// ─── Employee Timesheets ─────────────────────────────────────────────────────

const getMyTimesheets = asyncHandler(async (req, res) => {
  const rows = await ts.getMyTimesheets(req.user.employeeId);
  new ApiResponse(200, rows, 'Timesheets fetched').send(res);
});

const getTimesheetDetail = asyncHandler(async (req, res) => {
  const header = await ts.getTimesheetById(req.params.timesheetId);
  if (!header) throw ApiError.notFound('Timesheet not found');
  const entries = await ts.getTimesheetEntries(req.params.timesheetId);
  new ApiResponse(200, { ...header, entries }, 'Timesheet detail fetched').send(res);
});

const saveEntries = asyncHandler(async (req, res) => {
  const { weekDate, entries } = req.body;
  if (!weekDate) throw ApiError.badRequest('weekDate is required');
  const timesheet = await ts.saveEntries(req.user.employeeId, weekDate, entries || []);
  new ApiResponse(200, timesheet, 'Entries saved').send(res);
});

const submitTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await ts.submitTimesheet(req.user.employeeId, req.params.timesheetId);
  new ApiResponse(200, timesheet, 'Timesheet submitted').send(res);
});

const getDashboardCounts = asyncHandler(async (req, res) => {
  const counts = await ts.employeeDashboardCounts(req.user.employeeId);
  new ApiResponse(200, counts, 'Dashboard counts fetched').send(res);
});

// ─── Extra Work ──────────────────────────────────────────────────────────────

const createExtraWork = asyncHandler(async (req, res) => {
  const req_ = { ...req.body, employee_id: req.user.employeeId };
  const row = await ts.createExtraWorkRequest(req_);
  new ApiResponse(201, row, 'Extra work request submitted').send(res);
});

const myExtraWork = asyncHandler(async (req, res) => {
  const rows = await ts.listExtraWorkRequests(req.user.employeeId);
  new ApiResponse(200, rows, 'Extra work requests fetched').send(res);
});

// ─── Manager ─────────────────────────────────────────────────────────────────

const managerTimesheets = asyncHandler(async (req, res) => {
  const rows = await ts.listManagerTimesheets(req.user.employeeId, req.query);
  new ApiResponse(200, rows, 'Team timesheets fetched').send(res);
});

const reviewTimesheet = asyncHandler(async (req, res) => {
  const result = await ts.reviewTimesheet(req.params.timesheetId, {
    decision: req.body.decision,
    reviewed_by: req.user.employeeId,
    comments: req.body.comments,
  });
  new ApiResponse(200, result, `Timesheet ${req.body.decision}`).send(res);
});

const managerExtraWork = asyncHandler(async (req, res) => {
  const rows = await ts.listManagerExtraWork(req.user.employeeId);
  new ApiResponse(200, rows, 'Extra work requests fetched').send(res);
});

const reviewExtraWork = asyncHandler(async (req, res) => {
  const result = await ts.reviewExtraWork(req.params.extraWorkId, {
    decision: req.body.decision,
    reviewed_by: req.user.employeeId,
    manager_notes: req.body.manager_notes,
  });
  new ApiResponse(200, result, `Extra work request ${req.body.decision}`).send(res);
});

const managerDashboardCounts = asyncHandler(async (req, res) => {
  const counts = await ts.managerDashboardCounts(req.user.employeeId);
  new ApiResponse(200, counts, 'Dashboard counts fetched').send(res);
});

const managerFullDashboard = asyncHandler(async (req, res) => {
  const data = await ts.managerFullDashboard(req.user.employeeId);
  new ApiResponse(200, data, 'Manager dashboard fetched').send(res);
});

// ─── Admin ───────────────────────────────────────────────────────────────────

const adminTimesheets = asyncHandler(async (req, res) => {
  const rows = await ts.listAllTimesheets(req.query);
  new ApiResponse(200, rows, 'All timesheets fetched').send(res);
});

const adminDashboardCounts = asyncHandler(async (req, res) => {
  const counts = await ts.adminDashboardCounts();
  new ApiResponse(200, counts, 'Admin dashboard counts fetched').send(res);
});

module.exports = {
  createTask, listMyTasks, updateTask, deleteTask,
  getMyTimesheets, getTimesheetDetail, saveEntries, submitTimesheet, getDashboardCounts,
  createExtraWork, myExtraWork,
  managerTimesheets, reviewTimesheet, managerExtraWork, reviewExtraWork,
  managerDashboardCounts, managerFullDashboard,
  adminTimesheets, adminDashboardCounts,
};
