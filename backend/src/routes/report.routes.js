const express = require('express');
const controller = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('reports', 'view'));

router.get('/employees', controller.employeeSummary);
router.get('/attendance', controller.attendanceReport);
router.get('/leave', controller.leaveReport);
router.get('/payroll', controller.payrollReport);
router.get('/helpdesk', controller.helpdeskReport);
router.get('/hiring', controller.hiringReport);
router.get('/reviews', controller.reviewReport);

module.exports = router;
