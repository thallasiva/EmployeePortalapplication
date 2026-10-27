'use strict';
/**
 * Admin attendance utilities:
 *   GET  /api/attendance/admin/missing-checkout   – list employees still checked-in
 *   POST /api/attendance/admin/notify-missing-checkout – send email reminders
 */
const router      = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/ApiResponse');
const { query }    = require('../config/db');
const notifySvc    = require('../services/notify.service');

router.use(authenticate, authorizeRoles('Admin', 'HR Manager'));

// Who is still checked in without a check-out today?
router.get('/missing-checkout', asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = await query(`
    SELECT a.attendance_id, a.employee_id, a.attendance_date AS date,
           a.check_in AS check_in_time, a.is_on_break,
           CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
           e.emp_code, e.email AS work_email,
           d.department_name AS department
    FROM attendance a
    JOIN employees  e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    WHERE a.attendance_date = ?
      AND a.check_in IS NOT NULL
      AND a.check_out IS NULL
      AND a.status NOT IN ('LEAVE','HOLIDAY')
    ORDER BY a.check_in
  `, [date]);
  new ApiResponse(200, { date, count: rows.length, employees: rows }, 'Missing check-out list').send(res);
}));

// Send email reminders to missing-checkout employees
router.post('/notify-missing-checkout', asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const rows = await query(`
    SELECT a.attendance_id, a.employee_id, a.check_in AS check_in_time,
           CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
           e.email AS work_email
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    WHERE a.attendance_date = ?
      AND a.check_in IS NOT NULL
      AND a.check_out IS NULL
      AND a.missing_checkout_notified = 0
      AND a.status NOT IN ('LEAVE','HOLIDAY')
  `, [date]);

  let sent = 0, failed = 0;
  for (const row of rows) {
    try {
      await notifySvc.sendMissingCheckoutReminder(row);
      await query('UPDATE attendance SET missing_checkout_notified=1 WHERE attendance_id=?', [row.attendance_id]);
      sent++;
    } catch { failed++; }
  }
  new ApiResponse(200, { sent, failed, total: rows.length }, 'Missing check-out notifications sent').send(res);
}));

module.exports = router;
