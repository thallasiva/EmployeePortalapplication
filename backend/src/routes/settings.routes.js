'use strict';
const router = require('express').Router();
const c = require('../controllers/settings.controller');

/* SMTP */
router.get('/smtp',          c.getSmtp);
router.put('/smtp',          c.saveSmtp);
router.post('/smtp/test',    c.testSmtp);

/* Email Templates */
router.get('/email-templates',          c.listTemplates);
router.post('/email-templates',         c.createTemplate);
router.get('/email-templates/:id',      c.getTemplate);
router.put('/email-templates/:id',      c.updateTemplate);
router.delete('/email-templates/:id',   c.deleteTemplate);
router.post('/email-templates/:id/clone', c.cloneTemplate);

/* Email Logs */
router.get('/email-logs',          c.listLogs);
router.get('/email-logs/stats',    c.getLogStats);
router.post('/email-logs/:id/retry', c.retryLog);

/* Email Schedules */
router.get('/email-schedules',             c.listSchedules);
router.post('/email-schedules',            c.createSchedule);
router.put('/email-schedules/:id',         c.updateSchedule);
router.patch('/email-schedules/:id/toggle',c.toggleSchedule);
router.delete('/email-schedules/:id',      c.deleteSchedule);

/* Email Permissions */
router.get('/email-permissions',   c.getEmailPerms);
router.put('/email-permissions',   c.saveEmailPerms);

/* Menu Permissions */
router.get('/menu-permissions',    c.getMenuPerms);
router.put('/menu-permissions',    c.saveMenuPerms);

/* Form Builder */
router.get('/forms',          c.listForms);
router.post('/forms',         c.createForm);
router.get('/forms/:id',      c.getForm);
router.put('/forms/:id',      c.updateForm);
router.delete('/forms/:id',   c.deleteForm);

/* Dashboard Builder */
router.get('/dashboards',         c.listDashboards);
router.post('/dashboards',        c.createDashboard);
router.get('/dashboards/:id',     c.getDashboard);
router.put('/dashboards/:id',     c.updateDashboard);
router.delete('/dashboards/:id',  c.deleteDashboard);

/* Report Builder */
router.get('/reports',         c.listReports);
router.post('/reports',        c.createReport);
router.get('/reports/:id',     c.getReport);
router.put('/reports/:id',     c.updateReport);
router.delete('/reports/:id',  c.deleteReport);

/* Notifications */
router.get('/notifications',             c.listNotifications);
router.post('/notifications',            c.createNotification);
router.patch('/notifications/read-all',  c.markAllRead);
router.patch('/notifications/:id/read',  c.markRead);
router.delete('/notifications/:id',      c.deleteNotification);

module.exports = router;

/* Notification Preferences */
const asyncHandler = require('express-async-handler');
const ApiResponse  = require('../utils/ApiResponse');
const { getNotificationPreferences, saveNotificationPreferences } = require('../services/settings.service');

router.get('/notification-preferences', asyncHandler(async (req, res) => {
  const data = await getNotificationPreferences();
  new ApiResponse(200, data, 'OK').send(res);
}));
router.put('/notification-preferences', asyncHandler(async (req, res) => {
  const data = await saveNotificationPreferences(req.body);
  new ApiResponse(200, data, 'Saved').send(res);
}));
