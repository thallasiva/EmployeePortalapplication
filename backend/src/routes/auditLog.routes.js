'use strict';
const router  = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/ApiResponse');
const { query }    = require('../config/db');
// Ensure audit_logs table exists (schema already creates it, but safe guard)
async function ensureTable() {
  await query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT DEFAULT NULL,
    action     VARCHAR(60) NOT NULL,
    entity     VARCHAR(60) NOT NULL,
    entity_id  VARCHAR(40) DEFAULT NULL,
    details    JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
}
router.get(
  '/',
  authenticate,
  authorizeRoles('Admin', 'HR Manager'),
  asyncHandler(async (req, res) => {
    await ensureTable();
    const { search = '', module: mod, result, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 15));
    const offset = (pageNum - 1) * pageSize;
    // Generic audit_logs plus the salary/payroll access trail written by middleware/auditLog.js
    // (nothing else writes audit_logs, so the page was always empty without it).
    const source = `
      SELECT CONCAT('a', al.id) AS id, al.created_at, al.user_id, al.action,
             al.entity AS module, '—' AS ip, 'Success' AS result
        FROM audit_logs al
      UNION ALL
      SELECT CONCAT('s', sal.id), sal.created_at, sal.user_id, sal.action,
             'Payroll', COALESCE(sal.ip_address, '—'),
             CASE sal.status WHEN 'OK' THEN 'Success' WHEN 'DENIED' THEN 'Denied' ELSE 'Failed' END
        FROM salary_audit_log sal`;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (x.action LIKE ? OR x.module LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (mod && mod !== 'All Modules') {
      where += ' AND x.module = ?';
      params.push(mod);
    }
    if (result && result !== 'All Results') {
      where += ' AND x.result = ?';
      params.push(result);
    }
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM (${source}) x LEFT JOIN users u ON u.user_id = x.user_id ${where}`,
      params
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await query(`
      SELECT
        x.id,
        DATE_FORMAT(x.created_at, '%d %b %Y, %h:%i %p') AS dt,
        COALESCE(CONCAT(e.first_name, ' ', e.last_name), u.email, 'System') AS user,
        COALESCE(u.email, '') AS email,
        x.action, x.module, x.ip, x.result
      FROM (${source}) x
      LEFT JOIN users     u ON u.user_id     = x.user_id
      LEFT JOIN employees e ON e.employee_id = u.employee_id
      ${where}
      ORDER BY x.created_at DESC
      LIMIT ? OFFSET ?`, [...params, pageSize, offset]);
    new ApiResponse(200, { rows, total }, 'OK').send(res);
  })
);
module.exports = router;
