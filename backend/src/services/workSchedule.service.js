const { callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');

async function listAll() {
  const results = await callProcedure('sp_list_work_schedules()');
  return (results[0] ?? []).map(r => ({
    ...r,
    work_days: typeof r.work_days === 'string' ? JSON.parse(r.work_days) : (r.work_days || null),
  }));
}

async function getByEmployee(employeeId) {
  const results = await callProcedure('sp_get_work_schedule(?)', [employeeId]);
  const row = (results[0] ?? [])[0] ?? null;
  if (!row) throw ApiError.notFound('Employee not found');
  return {
    ...row,
    work_days: typeof row.work_days === 'string' ? JSON.parse(row.work_days) : (row.work_days || null),
  };
}

async function upsert(employeeId, adminEmployeeId, { schedule_type, work_days, start_time, end_time, rotation_pattern }) {
  const workDaysJson = work_days ? JSON.stringify(work_days) : null;
  await callProcedure('sp_upsert_work_schedule(?, ?, ?, ?, ?, ?, ?)', [
    employeeId, adminEmployeeId, schedule_type || 'fixed',
    workDaysJson, start_time || null, end_time || null, rotation_pattern || null,
  ]);
  return getByEmployee(employeeId);
}

async function remove(employeeId) {
  await callProcedure('sp_delete_work_schedule(?)', [employeeId]);
  return { success: true };
}

module.exports = { listAll, getByEmployee, upsert, remove };
