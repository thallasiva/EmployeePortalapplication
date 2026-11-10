const express = require('express');
const controller = require('../controllers/attendance.controller');
const validate = require('../middleware/validate');
const {
  checkInSchema,
  checkOutSchema,
  createRegularizationSchema,
  reviewRegularizationSchema
} = require('../validators/attendance.validator');
const { authenticate } = require('../middleware/auth');
const { requirePermission, requireCompanyModule } = require('../middleware/rbac');
const Joi = require('joi');
const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const validateOvertime = require('../middleware/validate');
const router = express.Router();
router.use(authenticate);
router.use(requireCompanyModule('attendance'));
router.get('/location-policy', asyncHandler(async (req, res) => {
  const [policy] = await query(`SELECT o.geo_fence_enabled, o.geo_radius_meters, o.office_name
    FROM employees e LEFT JOIN offices o ON o.office_id = e.office_id AND o.status = 'Active'
    WHERE e.employee_id = ? AND e.company_id = ? LIMIT 1`, [req.user.employeeId, req.user.companyId]);
  new ApiResponse(200, policy || { geo_fence_enabled: 0 }, 'Attendance location policy fetched').send(res);
}));
const overtimeCreateSchema = Joi.object({
  work_date: Joi.date().iso().required(),
  overtime_minutes: Joi.number().integer().min(1).max(1440).required(),
  reason: Joi.string().trim().min(3).max(255).required(),
});
const overtimeReviewSchema = Joi.object({
  decision: Joi.string().valid('Approved', 'Rejected').required(),
  remarks: Joi.string().trim().max(255).allow('', null),
});
router.get('/overtime', requirePermission('attendance', 'view'), asyncHandler(async (req, res) => {
  const isAdmin = ['Admin', 'HR Manager'].includes(req.user.roleName);
  const rows = await query(`SELECT o.*, e.emp_code,
      TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS employee_name, d.department_name
    FROM overtime_requests o JOIN employees e ON e.employee_id = o.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    WHERE o.company_id = ? AND (? = 1 OR o.employee_id = ?)
    ORDER BY o.work_date DESC, o.created_at DESC LIMIT 500`,
  [req.user.companyId, isAdmin ? 1 : 0, req.user.employeeId]);
  new ApiResponse(200, rows, 'Overtime requests fetched').send(res);
}));
router.post('/overtime', validateOvertime(overtimeCreateSchema), asyncHandler(async (req, res) => {
  if (!req.user.companyId || !req.user.employeeId) throw ApiError.forbidden('Employee company context is required');
  const result = await query(`INSERT INTO overtime_requests
    (employee_id, company_id, work_date, overtime_minutes, reason)
    VALUES (?, ?, ?, ?, ?)`, [req.user.employeeId, req.user.companyId, req.body.work_date, req.body.overtime_minutes, req.body.reason]);
  const [record] = await query(`SELECT o.*, e.emp_code, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) employee_name, d.department_name
    FROM overtime_requests o JOIN employees e ON e.employee_id=o.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id WHERE o.overtime_request_id=?`, [result.insertId]);
  new ApiResponse(201, record, 'Overtime request submitted').send(res);
}));
router.put('/overtime/:id/review', requirePermission('attendance', 'edit'), validateOvertime(overtimeReviewSchema), asyncHandler(async (req, res) => {
  const [existing] = await query('SELECT employee_id, status FROM overtime_requests WHERE overtime_request_id = ? AND company_id = ? LIMIT 1', [req.params.id, req.user.companyId]);
  if (!existing) throw ApiError.notFound('Overtime request not found');
  if (Number(existing.employee_id) === Number(req.user.employeeId)) throw ApiError.forbidden('You cannot review your own overtime request');
  if (existing.status !== 'Pending') throw ApiError.conflict('Overtime request already reviewed');
  await query(`UPDATE overtime_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), remarks = ?
    WHERE overtime_request_id = ? AND company_id = ? AND status = 'Pending'`,
  [req.body.decision, req.user.employeeId || null, req.body.remarks || null, req.params.id, req.user.companyId]);
  const [record] = await query(`SELECT o.*, e.emp_code, TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) employee_name, d.department_name
    FROM overtime_requests o JOIN employees e ON e.employee_id=o.employee_id
    LEFT JOIN departments d ON d.department_id=e.department_id WHERE o.overtime_request_id=?`, [req.params.id]);
  new ApiResponse(200, record, 'Overtime request reviewed').send(res);
}));
router.post('/check-in', validate(checkInSchema), controller.checkIn);
router.post('/check-out', validate(checkOutSchema), controller.checkOut);
router.post('/break-start', controller.breakStart);
router.post('/break-end',   controller.breakEnd);
router.get('/me/today', controller.today);
router.get('/me/monthly', controller.monthly);
router.get('/me/swipes', controller.swipes);
router.get('/', requirePermission('attendance', 'view'), controller.list);
router.get('/analytics', requirePermission('attendance', 'view'), controller.analytics);
router.get('/dashboard', requirePermission('attendance', 'view'), controller.dashboard);
router.get('/team-leave-calendar', requirePermission('attendance', 'view'), controller.teamLeaveCalendar);
router.get('/employees/:employeeId/today', requirePermission('attendance', 'view'), controller.today);
router.get('/employees/:employeeId/monthly', requirePermission('attendance', 'view'), controller.monthly);
router.get('/employees/:employeeId/swipes', requirePermission('attendance', 'view'), controller.swipes);
router.get('/regularizations', requirePermission('attendance', 'view'), controller.listRegularizations);
router.post('/regularizations', validate(createRegularizationSchema), controller.createRegularization);
router.put(
  '/regularizations/:id/review',
  requirePermission('attendance', 'edit'),
  validate(reviewRegularizationSchema),
  controller.reviewRegularization
);
module.exports = router;
