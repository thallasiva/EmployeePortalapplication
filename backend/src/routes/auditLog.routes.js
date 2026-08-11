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
  authorizeRoles('admin', 'hr'),
  asyncHandler(async (req, res) => {
    await ensureTable();

    const { search = '', module: mod, result, page = 1, limit = 15 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (al.action LIKE ? OR al.entity LIKE ? OR u.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (mod && mod !== 'All Modules') {
      where += ' AND al.entity = ?';
      params.push(mod);
    }

    const countSql = `SELECT COUNT(*) AS total FROM audit_logs al
      LEFT JOIN users u ON u.user_id = al.user_id ${where}`;
    const [countRows] = await query(countSql, params);
    const total = countRows[0]?.total ?? 0;

    const dataSql = `
      SELECT
        al.id,
        DATE_FORMAT(al.created_at, '%d %b %Y, %h:%i %p') AS dt,
        COALESCE(CONCAT(e.first_name, ' ', e.last_name), u.email, 'System') AS user,
        COALESCE(u.email, '')  AS email,
        al.action,
        al.entity              AS module,
        '—'                    AS ip,
        'Success'              AS result
      FROM audit_logs al
      LEFT JOIN users     u ON u.user_id      = al.user_id
      LEFT JOIN employees e ON e.employee_id  = u.employee_id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?`;

    const [rows] = await query(dataSql, [...params, Number(limit), offset]);

    new ApiResponse(200, { rows, total }, 'OK').send(res);
  })
);

module.exports = router;
