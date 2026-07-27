const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const c = require('../controllers/timesheet.controller');


router.use(authenticate);


router.get('/my-tasks', c.listMyTasks);
router.post('/my-tasks', c.createTask);
router.put('/my-tasks/:taskId', c.updateTask);
router.delete('/my-tasks/:taskId', c.deleteTask);


router.get('/my', c.getMyTimesheets);
router.get('/my/dashboard-counts', c.getDashboardCounts);
router.post('/my/save-entries', c.saveEntries);
router.post('/my/:timesheetId/submit', c.submitTimesheet);
router.get('/my/:timesheetId', c.getTimesheetDetail);


router.get('/extra-work/my', c.myExtraWork);
router.post('/extra-work', c.createExtraWork);


const TEAM_OVERVIEW_ROLES = ['Reporting Manager', 'Recruiter Team Lead', 'HR Manager', 'Admin'];

router.get('/manager/full-dashboard', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.managerFullDashboard);
router.get('/manager/team', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.managerTimesheets);
router.get('/manager/dashboard-counts', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.managerDashboardCounts);
router.post('/manager/:timesheetId/review', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.reviewTimesheet);
router.get('/manager/extra-work', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.managerExtraWork);
router.post('/manager/extra-work/:extraWorkId/review', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.reviewExtraWork);


router.get('/:timesheetId', authorizeRoles(...TEAM_OVERVIEW_ROLES), c.getTimesheetDetail);


router.get('/admin/all', authorizeRoles('Admin'), c.adminTimesheets);
router.get('/admin/dashboard-counts', authorizeRoles('Admin'), c.adminDashboardCounts);

module.exports = router;
