const path = require('path');
const fs   = require('fs');
const { query } = require('../config/db');
const ApiError  = require('../utils/ApiError');

const NOTICE_DAYS = 90;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)));
}

/* ── shared SELECT fragment ─────────────────────────────────────────────── */
const SELECT_FULL = `
  SELECT r.*,
         CONCAT(e.first_name,' ',e.last_name)    AS employee_name,
         e.emp_code, e.emp_job_title              AS job_title,
         d.department_name,
         CONCAT(rev.first_name,' ',rev.last_name) AS reviewed_by_name,
         CONCAT(mgr.first_name,' ',mgr.last_name) AS manager_reviewed_by_name
  FROM resignations r
  JOIN  employees   e   ON e.employee_id  = r.employee_id
  LEFT JOIN departments d   ON d.department_id = e.department_id
  LEFT JOIN employees   rev ON rev.employee_id  = r.reviewed_by
  LEFT JOIN employees   mgr ON mgr.employee_id  = r.manager_reviewed_by
`;

/* ── Employee ──────────────────────────────────────────────────────────── */

async function getMyResignations(employeeId) {
  return query(
    `${SELECT_FULL} WHERE r.employee_id = ? ORDER BY r.created_at DESC`,
    [employeeId]
  );
}

async function submitResignation(employeeId, body, file) {
  const { reason, alternate_email, alternate_mobile, start_date, end_date, remarks } = body;
  if (!reason?.trim())    throw ApiError.badRequest('Reason is required');
  if (!end_date)          throw ApiError.badRequest('End date is required');
  if (!alternate_email)   throw ApiError.badRequest('Alternate email is required');
  if (!alternate_mobile)  throw ApiError.badRequest('Alternate mobile is required');

  const [existing] = await query(
    `SELECT resignation_id FROM resignations
     WHERE employee_id = ? AND status IN ('pending','rm_approved','accepted') LIMIT 1`,
    [employeeId]
  );
  if (existing) throw ApiError.badRequest('You already have an active resignation request');

  const sub_date      = start_date || new Date().toISOString().split('T')[0];
  const tentative_lwd = addDays(sub_date, NOTICE_DAYS);
  const shortfall     = daysBetween(end_date, tentative_lwd);

  const result = await query(
    `INSERT INTO resignations
       (employee_id, start_date, end_date, tentative_lwd, shortfall_days,
        notice_period, reason, alternate_email, alternate_mobile, remarks,
        attachment_name, attachment_path)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      employeeId, sub_date, end_date, tentative_lwd, shortfall,
      NOTICE_DAYS, reason, alternate_email, alternate_mobile, remarks || null,
      file ? file.originalname : null,
      file ? file.filename     : null,
    ]
  );

  const [row] = await query(`${SELECT_FULL} WHERE r.resignation_id = ?`, [result.insertId]);
  return row;
}

async function withdrawResignation(employeeId, resignationId) {
  const [row] = await query(
    `SELECT * FROM resignations WHERE resignation_id = ? AND employee_id = ? AND status = 'pending'`,
    [resignationId, employeeId]
  );
  if (!row) throw ApiError.notFound('No pending resignation found');
  await query(`UPDATE resignations SET status='withdrawn' WHERE resignation_id=?`, [resignationId]);
  const [updated] = await query(`${SELECT_FULL} WHERE r.resignation_id=?`, [resignationId]);
  return updated;
}

async function getAttachmentFile(resignationId, employeeId, isAdmin) {
  const where  = isAdmin ? `r.resignation_id=?` : `r.resignation_id=? AND r.employee_id=?`;
  const params = isAdmin ? [resignationId] : [resignationId, employeeId];
  const [row]  = await query(`SELECT * FROM resignations WHERE ${where.replace('r.','')}`, params);
  if (!row || !row.attachment_path) throw ApiError.notFound('File not found');
  const { upload: uploadConfig } = require('../config/env');
  const filePath = path.resolve(process.cwd(), uploadConfig.dir, row.attachment_path);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found on disk');
  return { filePath, fileName: row.attachment_name || row.attachment_path };
}

/* ── Reporting Manager ─────────────────────────────────────────────────── */

async function getTeamResignations(managerId, { status } = {}) {
  let sql = `${SELECT_FULL} WHERE e.reporting_to = ?`;
  const params = [managerId];
  if (status && status !== 'all') { sql += ` AND r.status=?`; params.push(status); }
  sql += ` ORDER BY r.created_at DESC`;
  return query(sql, params);
}

async function reviewByManager(managerId, resignationId, { status, manager_remarks }) {
  if (!['rm_approved','rm_rejected'].includes(status))
    throw ApiError.badRequest('Invalid manager status. Use rm_approved or rm_rejected');

  // Verify this resignation belongs to one of manager's team members
  const [row] = await query(
    `SELECT r.resignation_id FROM resignations r
     JOIN employees e ON e.employee_id = r.employee_id
     WHERE r.resignation_id = ? AND e.reporting_to = ? AND r.status = 'pending'`,
    [resignationId, managerId]
  );
  if (!row) throw ApiError.notFound('Resignation not found or already reviewed');

  await query(
    `UPDATE resignations SET status=?, manager_remarks=?,
     manager_reviewed_by=?, manager_reviewed_at=NOW()
     WHERE resignation_id=?`,
    [status, manager_remarks || null, managerId, resignationId]
  );
  const [updated] = await query(`${SELECT_FULL} WHERE r.resignation_id=?`, [resignationId]);
  return updated;
}

/* ── Admin ─────────────────────────────────────────────────────────────── */

async function getAllResignations({ status, search } = {}) {
  let sql = `${SELECT_FULL} WHERE 1=1`;
  const params = [];
  if (status && status !== 'all') { sql += ` AND r.status=?`; params.push(status); }
  if (search) {
    sql += ` AND (CONCAT(e.first_name,' ',e.last_name) LIKE ? OR e.emp_code LIKE ? OR d.department_name LIKE ?)`;
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  sql += ` ORDER BY r.created_at DESC`;
  return query(sql, params);
}

async function reviewResignation(adminEmployeeId, resignationId, { status, admin_remarks }) {
  if (!['accepted','rejected'].includes(status))
    throw ApiError.badRequest('Invalid status. Use accepted or rejected');

  await query(
    `UPDATE resignations SET status=?, admin_remarks=?, reviewed_by=?, reviewed_at=NOW()
     WHERE resignation_id=?`,
    [status, admin_remarks || null, adminEmployeeId, resignationId]
  );
  const [row] = await query(`${SELECT_FULL} WHERE r.resignation_id=?`, [resignationId]);
  return row;
}

module.exports = {
  getMyResignations, submitResignation, withdrawResignation, getAttachmentFile,
  getTeamResignations, reviewByManager,
  getAllResignations, reviewResignation,
};
