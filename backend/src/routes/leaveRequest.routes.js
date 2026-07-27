const express = require('express');
const controller = require('../controllers/leaveRequest.controller');
const validate = require('../middleware/validate');
const { applyLeaveSchema, reviewLeaveSchema } = require('../validators/leaveRequest.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);


router.get('/me', controller.myRequests);
router.get('/me/balances', controller.balances);
router.post('/', validate(applyLeaveSchema), controller.apply);
router.put('/:id/cancel', controller.cancel);


router.get('/admin/balances', requirePermission('leave', 'view'), controller.allBalances);
router.get('/admin/summary', requirePermission('leave', 'view'), controller.leaveSummary);
router.put('/admin/adjust', requirePermission('leave', 'edit'), controller.adjustBalance);
router.post('/admin/initialize-year', requirePermission('leave', 'edit'), controller.initializeYear);
router.post('/admin/accrue-earned-leave', requirePermission('leave', 'edit'), controller.accrueEarnedLeave);

router.get('/', requirePermission('leave', 'view'), controller.list);
router.get('/:id', requirePermission('leave', 'view'), controller.getOne);
router.get('/employees/:employeeId/balances', requirePermission('leave', 'view'), controller.balances);
router.put('/:id/review', requirePermission('leave', 'edit'), validate(reviewLeaveSchema), controller.review);

module.exports = router;
