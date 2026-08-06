'use strict';
const asyncHandler = require('express-async-handler');
const svc = require('../services/settings.service');
const ApiResponse = require('../utils/ApiResponse');

/* ── SMTP ── */
const getSmtp    = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getSmtp(), 'OK').send(res));
const saveSmtp   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.saveSmtp(req.body), 'Saved').send(res));
const testSmtp   = asyncHandler(async (req, res) => new ApiResponse(200, { success: true, message: 'SMTP connection successful' }, 'Test passed').send(res));

/* ── TEMPLATES ── */
const listTemplates   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listTemplates(req.query), 'OK').send(res));
const getTemplate     = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getTemplate(req.params.id), 'OK').send(res));
const createTemplate  = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createTemplate(req.body), 'Created').send(res));
const updateTemplate  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.updateTemplate(req.params.id, req.body), 'Updated').send(res));
const deleteTemplate  = asyncHandler(async (req, res) => { await svc.deleteTemplate(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });
const cloneTemplate   = asyncHandler(async (req, res) => new ApiResponse(201, await svc.cloneTemplate(req.params.id), 'Cloned').send(res));

/* ── LOGS ── */
const listLogs   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listLogs(req.query), 'OK').send(res));
const retryLog   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.retryLog(req.params.id), 'Retried').send(res));
const getLogStats = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getLogStats(), 'OK').send(res));

/* ── SCHEDULES ── */
const listSchedules    = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listSchedules(), 'OK').send(res));
const createSchedule   = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createSchedule(req.body), 'Created').send(res));
const updateSchedule   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.updateSchedule(req.params.id, req.body), 'Updated').send(res));
const toggleSchedule   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.toggleSchedule(req.params.id), 'Toggled').send(res));
const deleteSchedule   = asyncHandler(async (req, res) => { await svc.deleteSchedule(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });

/* ── EMAIL PERMISSIONS ── */
const getEmailPerms  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getEmailPermissions(), 'OK').send(res));
const saveEmailPerms = asyncHandler(async (req, res) => new ApiResponse(200, await svc.saveEmailPermissions(req.body), 'Saved').send(res));

/* ── MENU PERMISSIONS ── */
const getMenuPerms  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getMenuPermissions(), 'OK').send(res));
const saveMenuPerms = asyncHandler(async (req, res) => new ApiResponse(200, await svc.saveMenuPermissions(req.body), 'Saved').send(res));

/* ── FORMS ── */
const listForms   = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listForms(), 'OK').send(res));
const getForm     = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getForm(req.params.id), 'OK').send(res));
const createForm  = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createForm(req.body), 'Created').send(res));
const updateForm  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.updateForm(req.params.id, req.body), 'Updated').send(res));
const deleteForm  = asyncHandler(async (req, res) => { await svc.deleteForm(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });

/* ── DASHBOARDS ── */
const listDashboards  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listDashboards(), 'OK').send(res));
const getDashboard    = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getDashboard(req.params.id), 'OK').send(res));
const createDashboard = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createDashboard(req.body), 'Created').send(res));
const updateDashboard = asyncHandler(async (req, res) => new ApiResponse(200, await svc.updateDashboard(req.params.id, req.body), 'Updated').send(res));
const deleteDashboard = asyncHandler(async (req, res) => { await svc.deleteDashboard(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });

/* ── REPORTS ── */
const listReports  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listReports(), 'OK').send(res));
const getReport    = asyncHandler(async (req, res) => new ApiResponse(200, await svc.getReport(req.params.id), 'OK').send(res));
const createReport = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createReport(req.body), 'Created').send(res));
const updateReport = asyncHandler(async (req, res) => new ApiResponse(200, await svc.updateReport(req.params.id, req.body), 'Updated').send(res));
const deleteReport = asyncHandler(async (req, res) => { await svc.deleteReport(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });

/* ── NOTIFICATIONS ── */
const listNotifications  = asyncHandler(async (req, res) => new ApiResponse(200, await svc.listNotifications(req.query), 'OK').send(res));
const markRead           = asyncHandler(async (req, res) => { await svc.markRead(req.params.id); new ApiResponse(200, null, 'Marked read').send(res); });
const markAllRead        = asyncHandler(async (req, res) => { await svc.markAllRead(req.query.employee_id); new ApiResponse(200, null, 'All marked read').send(res); });
const deleteNotification = asyncHandler(async (req, res) => { await svc.deleteNotification(req.params.id); new ApiResponse(200, null, 'Deleted').send(res); });
const createNotification = asyncHandler(async (req, res) => new ApiResponse(201, await svc.createNotification(req.body), 'Created').send(res));

module.exports = {
  getSmtp, saveSmtp, testSmtp,
  listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, cloneTemplate,
  listLogs, retryLog, getLogStats,
  listSchedules, createSchedule, updateSchedule, toggleSchedule, deleteSchedule,
  getEmailPerms, saveEmailPerms,
  getMenuPerms, saveMenuPerms,
  listForms, getForm, createForm, updateForm, deleteForm,
  listDashboards, getDashboard, createDashboard, updateDashboard, deleteDashboard,
  listReports, getReport, createReport, updateReport, deleteReport,
  listNotifications, markRead, markAllRead, deleteNotification, createNotification,
};
