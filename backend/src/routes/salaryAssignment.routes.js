const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/salaryAssignment.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

router.use(authenticate);

const VIEW = requirePermission('salary_components', 'view');
const EDIT = requirePermission('salary_components', 'edit');

router.get ('/',                                    VIEW, ctrl.listAll);
router.get ('/:employeeId',                         VIEW, ctrl.getAssignment);
router.post('/:employeeId',                         EDIT, ctrl.assign);
router.get ('/:employeeId/history',                 VIEW, ctrl.history);
router.post('/:employeeId/compute-breakdown',       VIEW, ctrl.computeBreakdown);

module.exports = router;
