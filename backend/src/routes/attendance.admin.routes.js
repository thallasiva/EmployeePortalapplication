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

router.use(authenticate, authorizeRoles('admin', 'hr', 'team_lead'));

// Who is still checked in without a check-out today?
router.get('/missing-checkout', asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = await query(`
    SELECT a.attendance_id, a.employee_id, a.date,
           a.check_in_time, a.is_on_break,
           CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
           e.emp_code, e.work_email,
           d.name AS department
    FROM attendance a
    JOIN employees  e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    WHERE a.date = ?
      AND a.check_in_time IS NOT NULL
      AND a.check_out_time IS NULL
      AND a.status NOT IN ('LEAVE','HOLIDAY')
    ORDER BY a.check_in_time
  `, [date]);
  new ApiResponse(200, { date, count: rows.length, employees: rows }, 'Missing check-out list').send(res);
}));

// Send email reminders to missing-checkout employees
router.post('/notify-missing-checkout', asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const rows = await query(`
    SELECT a.attendance_id, a.employee_id, a.check_in_time,
           CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
           e.work_email
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    WHERE a.date = ?
      AND a.check_in_time IS NOT NULL
      AND a.check_out_time IS NULL
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
