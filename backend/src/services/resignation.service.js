const path = require('path');
const fs   = require('fs');
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');
const notify   = require('./mailNotify.service');

const NOTICE_DAYS = 90;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function daysBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)));
}

/* ── Employee ──────────────────────────────────────────────────────────── */

async function getMyResignations(employeeId) {
  const results = await callProcedure('sp_get_my_resignations(?)', [employeeId]);
  return results[0] ?? [];
}

async function submitResignation(employeeId, body, file) {
  const { reason, alternate_email, alternate_mobile, start_date, end_date, remarks } = body;
  if (!reason?.trim())   throw ApiError.badRequest('Reason is required');
  if (!end_date)         throw ApiError.badRequest('End date is required');
  if (!alternate_email)  throw ApiError.badRequest('Alternate email is required');
  if (!alternate_mobile) throw ApiError.badRequest('Alternate mobile is required');

  const sub_date      = start_date || new Date().toISOString().split('T')[0];
  const tentative_lwd = addDays(sub_date, NOTICE_DAYS);
  const shortfall     = daysBetween(end_date, tentative_lwd);

  await callProcedure(
    'sp_submit_resignation(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @resignation_id, @msg)',
    [
      employeeId, reason, sub_date, end_date, tentative_lwd, shortfall,
      NOTICE_DAYS, alternate_email, alternate_mobile, remarks || null,
      file ? file.originalname : null,
      file ? file.filename     : null,
    ]
  );
  const out = await readOuts('resignation_id', 'msg');
  if (!out[0]?.resignation_id) throw ApiError.badRequest(out[0]?.msg || 'Unable to submit resignation');

  const rowResults = await callProcedure('sp_get_resignation_by_id(?)', [out[0].resignation_id]);
  const row = (rowResults[0] ?? [])[0] ?? null;

  // Notify manager (fire-and-forget)
  if (row) {
    notify.resignationSubmitted({
      managerEmail:  row.manager_email || row.reporting_to_email || null,
      managerName:   row.manager_name  || row.reporting_to_name  || 'Manager',
      employeeName:  row.employee_name || row.emp_name           || `Employee #${employeeId}`,
      empCode:       row.emp_code      || '',
      submitDate:    row.submission_date || sub_date,
      endDate:       row.end_date || end_date,
      reason,
    });
  }
  return row;
}

async function withdrawResignation(employeeId, resignationId) {
  await callProcedure('sp_withdraw_resignation(?, ?, @ok)', [employeeId, resignationId]);
  const out = await readOuts('ok');
  if (!out[0]?.ok) throw ApiError.notFound('No pending resignation found');
  const results = await callProcedure('sp_get_resignation_by_id(?)', [resignationId]);
  return (results[0] ?? [])[0] ?? null;
}

async function getAttachmentFile(resignationId, employeeId, isAdmin) {
  const results = await callProcedure('sp_get_resignation_by_id(?)', [resignationId]);
  const row = (results[0] ?? [])[0] ?? null;
  if (!row || !row.attachment_path) throw ApiError.notFound('File not found');
  if (!isAdmin && row.employee_id !== employeeId) throw ApiError.forbidden('Access denied');
  const { upload: uploadConfig } = require('../config/env');
  const filePath = path.resolve(process.cwd(), uploadConfig.dir, row.attachment_path);
  if (!fs.existsSync(filePath)) throw ApiError.notFound('File not found on disk');
  return { filePath, fileName: row.attachment_name || row.attachment_path };
}

/* ── Reporting Manager ─────────────────────────────────────────────────── */

async function getTeamResignations(managerId, { status } = {}) {
  const results = await callProcedure('sp_get_team_resignations(?, ?)', [
    managerId, (status && status !== 'all') ? status : null,
  ]);
  return results[0] ?? [];
}

async function reviewByManager(managerId, resignationId, { status, manager_remarks }) {
  if (!['rm_approved', 'rm_rejected'].includes(status))
    throw ApiError.badRequest('Invalid manager status. Use rm_approved or rm_rejected');

  await callProcedure('sp_manager_review_resignation(?, ?, ?, ?, @ok)', [
    managerId, resignationId, status, manager_remarks || null,
  ]);
  const out = await readOuts('ok');
  if (!out[0]?.ok) throw ApiError.notFound('Resignation not found or already reviewed');

  const results = await callProcedure('sp_get_resignation_by_id(?)', [resignationId]);
  return (results[0] ?? [])[0] ?? null;
}

/* ── Admin ─────────────────────────────────────────────────────────────── */

async function getAllResignations({ status, search } = {}) {
  const results = await callProcedure('sp_get_all_resignations(?, ?)', [
    (status && status !== 'all') ? status : null,
    search || null,
  ]);
  return results[0] ?? [];
}

async function reviewResignation(adminEmployeeId, resignationId, { status, admin_remarks }) {
  if (!['accepted', 'rejected'].includes(status))
    throw ApiError.badRequest('Invalid status. Use accepted or rejected');

  await callProcedure('sp_admin_review_resignation(?, ?, ?, ?)', [
    adminEmployeeId, resignationId, status, admin_remarks || null,
  ]);
  const results = await callProcedure('sp_get_resignation_by_id(?)', [resignationId]);
  const row = (results[0] ?? [])[0] ?? null;

  // Notify employee (fire-and-forget)
  if (row) {
    const empEmail    = row.employee_email || row.alternate_email || null;
    const empName     = row.employee_name  || row.emp_name        || 'Employee';
    const reviewerName = row.admin_name    || row.reviewed_by_name || 'HR Admin';
    if (status === 'accepted') {
      notify.resignationApproved({ employeeEmail: empEmail, employeeName: empName, lastWorkingDay: row.tentative_lwd || row.end_date, reviewerName });
    } else {
      notify.resignationRejected({ employeeEmail: empEmail, employeeName: empName, reviewerName, remarks: admin_remarks });
    }
  }
  return row;
}

module.exports = {
  getMyResignations, submitResignation, withdrawResignation, getAttachmentFile,
  getTeamResignations, reviewByManager,
  getAllResignations, reviewResignation,
};
