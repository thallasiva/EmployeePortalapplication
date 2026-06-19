const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const c = require('../controllers/timesheet.controller');

// All routes require authentication
router.use(authenticate);

// ─── Employee: My Tasks ──────────────────────────────────────────────────────
router.get('/my-tasks', c.listMyTasks);
router.post('/my-tasks', c.createTask);
router.put('/my-tasks/:taskId', c.updateTask);
router.delete('/my-tasks/:taskId', c.deleteTask);

// ─── Employee: Timesheets ─────────────────────────────────────────────────────
router.get('/my', c.getMyTimesheets);
router.get('/my/dashboard-counts', c.getDashboardCounts);
router.post('/my/save-entries', c.saveEntries);
router.post('/my/:timesheetId/submit', c.submitTimesheet);
router.get('/my/:timesheetId', c.getTimesheetDetail);

// ─── Employee: Extra Work ─────────────────────────────────────────────────────
router.get('/extra-work/my', c.myExtraWork);
router.post('/extra-work', c.createExtraWork);

// ─── Manager ─────────────────────────────────────────────────────────────────
router.get('/manager/full-dashboard', authorizeRoles('Reporting Manager', 'Admin'), c.managerFullDashboard);
router.get('/manager/team', authorizeRoles('Reporting Manager', 'Admin'), c.managerTimesheets);
router.get('/manager/dashboard-counts', authorizeRoles('Reporting Manager', 'Admin'), c.managerDashboardCounts);
router.post('/manager/:timesheetId/review', authorizeRoles('Reporting Manager', 'Admin'), c.reviewTimesheet);
router.get('/manager/extra-work', authorizeRoles('Reporting Manager', 'Admin'), c.managerExtraWork);
router.post('/manager/extra-work/:extraWorkId/review', authorizeRoles('Reporting Manager', 'Admin'), c.reviewExtraWork);

// Manager/Admin: view any timesheet detail
router.get('/:timesheetId', authorizeRoles('Reporting Manager', 'Admin'), c.getTimesheetDetail);

// ─── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin/all', authorizeRoles('Admin'), c.adminTimesheets);
router.get('/admin/dashboard-counts', authorizeRoles('Admin'), c.adminDashboardCounts);

module.exports = router;
