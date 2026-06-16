const express = require('express');
const controller = require('../controllers/attendance.controller');
const validate = require('../middleware/validate');
const {
  checkInSchema,
  checkOutSchema,
  createRegularizationSchema,
  reviewRegularizationSchema,
} = require('../validators/attendance.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

// Self-service check-in/out
router.post('/check-in', validate(checkInSchema), controller.checkIn);
router.post('/check-out', validate(checkOutSchema), controller.checkOut);
router.get('/me/today', controller.today);
router.get('/me/monthly', controller.monthly);

// Admin / manager views
router.get('/', requirePermission('attendance', 'view'), controller.list);
router.get('/dashboard', requirePermission('attendance', 'view'), controller.dashboard);
router.get('/team-leave-calendar', requirePermission('attendance', 'view'), controller.teamLeaveCalendar);
router.get('/employees/:employeeId/today', requirePermission('attendance', 'view'), controller.today);
router.get('/employees/:employeeId/monthly', requirePermission('attendance', 'view'), controller.monthly);

// Regularization requests
router.get('/regularizations', requirePermission('attendance', 'view'), controller.listRegularizations);
router.post('/regularizations', validate(createRegularizationSchema), controller.createRegularization);
router.put(
  '/regularizations/:id/review',
  requirePermission('attendance', 'edit'),
  validate(reviewRegularizationSchema),
  controller.reviewRegularization
);

module.exports = router;
