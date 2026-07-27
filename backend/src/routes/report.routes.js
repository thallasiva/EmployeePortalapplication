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


router.get('/download/emp-data', controller.downloadEmpData);
router.get('/download/leave-balance', controller.downloadLeaveBalance);
router.get('/download/leave-summary', controller.downloadLeaveSummary);
router.get('/download/pf-statement', controller.downloadPfStatement);
router.get('/download/profession-tax', controller.downloadProfessionTax);
router.get('/download/ecr-file', controller.downloadEcrFile);

module.exports = router;
