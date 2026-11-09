'use strict';
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

function requireCompany(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
  return company;
}

function decodeSchedule(row) {
  if (!row) return row;
  return {
    ...row,
    work_days: typeof row.work_days === 'string' ? JSON.parse(row.work_days) : (row.work_days || null),
  };
}

async function listAll(companyId) {
  const company = requireCompany(companyId);
  const rows = await query(
    `SELECT e.employee_id, s.schedule_id, s.schedule_type, s.work_days, s.start_time, s.end_time,
            s.rotation_pattern, s.updated_by, s.created_at, s.updated_at,
            e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
            e.department_id
       FROM employees e
       LEFT JOIN employee_work_schedules s ON s.employee_id = e.employee_id
      WHERE e.company_id = ? AND e.employee_status = 'Active'
      ORDER BY e.first_name, e.last_name`,
    [company]
  );
  return rows.map(decodeSchedule);
}

async function getByEmployee(employeeId, companyId) {
  const company = requireCompany(companyId);
  const rows = await query(
    `SELECT s.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name
       FROM employees e
       LEFT JOIN employee_work_schedules s ON s.employee_id = e.employee_id
      WHERE e.employee_id = ? AND e.company_id = ? LIMIT 1`,
    [employeeId, company]
  );
  if (!rows.length) throw ApiError.notFound('Employee not found');
  if (!rows[0].schedule_id) return { employee_id: Number(employeeId), employee_name: rows[0].employee_name, work_days: null };
  return decodeSchedule(rows[0]);
}

async function upsert(employeeId, adminEmployeeId, companyId, {
  schedule_type, work_days, start_time, end_time, rotation_pattern,
}) {
  const company = requireCompany(companyId);
  const employee = await query(
    'SELECT employee_id FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
    [employeeId, company]
  );
  if (!employee.length) throw ApiError.notFound('Employee not found');
  if (!['fixed', 'rotational'].includes(schedule_type || 'fixed')) {
    throw ApiError.badRequest('Schedule type must be fixed or rotational');
  }
  if (work_days != null && (!Array.isArray(work_days) || work_days.some((day) => !['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(day)))) {
    throw ApiError.badRequest('Work days must be valid day abbreviations');
  }
  await query(
    `INSERT INTO employee_work_schedules
      (employee_id, schedule_type, work_days, start_time, end_time, rotation_pattern, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE schedule_type = VALUES(schedule_type), work_days = VALUES(work_days),
       start_time = VALUES(start_time), end_time = VALUES(end_time),
       rotation_pattern = VALUES(rotation_pattern), updated_by = VALUES(updated_by)`,
    [
      employeeId, schedule_type || 'fixed', work_days ? JSON.stringify(work_days) : null,
      start_time || null, end_time || null, rotation_pattern || null, adminEmployeeId || null,
    ]
  );
  return getByEmployee(employeeId, company);
}

async function remove(employeeId, companyId) {
  const company = requireCompany(companyId);
  const result = await query(
    `DELETE s FROM employee_work_schedules s
      JOIN employees e ON e.employee_id = s.employee_id
     WHERE s.employee_id = ? AND e.company_id = ?`,
    [employeeId, company]
  );
  if (!result.affectedRows) throw ApiError.notFound('Employee schedule not found');
  return { success: true };
}

module.exports = { listAll, getByEmployee, upsert, remove };
