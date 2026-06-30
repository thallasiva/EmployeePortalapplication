/**
 * TimesheetService
 * Handles employee_tasks, weekly_timesheets, timesheet_entries, extra_work_requests
 * All SQL routed through stored procedures via callProcedure().
 */
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');

// ─── helpers ────────────────────────────────────────────────────────────────

function isoWeekBounds(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDay() || 7;
  const mon = new Date(d); mon.setUTCDate(d.getUTCDate() - day + 1);
  const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
  return { weekStart: mon.toISOString().slice(0, 10), weekEnd: sun.toISOString().slice(0, 10) };
}

function toDateStr(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

// ─── Employee Tasks ──────────────────────────────────────────────────────────

async function createTask({
  employee_id, task_name, project_name = '', description = '',
  start_date = null, end_date = null, start_time = null, end_time = null,
  duration_hours = null,
}) {
  await callProcedure(
    'sp_create_task(?, ?, ?, ?, ?, ?, ?, ?, ?, @task_id)',
    [employee_id, task_name, project_name || '', description || '',
     start_date || null, end_date || null, start_time || null, end_time || null,
     duration_hours != null ? parseFloat(duration_hours) : null]
  );
  const out = await readOuts('task_id');
  return getTaskById(out[0].task_id);
}

async function getTaskById(task_id) {
  const results = await callProcedure('sp_get_task(?)', [task_id]);
  return (results[0] ?? results)[0] ?? null;
}

async function listMyTasks(employee_id) {
  const results = await callProcedure('sp_list_my_tasks(?)', [employee_id]);
  return results[0] ?? results;
}

async function updateTask(task_id, employee_id, fields) {
  const allowed = ['task_name', 'project_name', 'description', 'status',
                   'start_date', 'end_date', 'start_time', 'end_time', 'duration_hours'];
  await callProcedure('sp_update_task(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    task_id,
    employee_id,
    allowed.includes('task_name')      && 'task_name'      in fields ? (fields.task_name      === '' ? null : fields.task_name)      : null,
    allowed.includes('project_name')   && 'project_name'   in fields ? (fields.project_name   === '' ? null : fields.project_name)   : null,
    allowed.includes('description')    && 'description'    in fields ? (fields.description    === '' ? null : fields.description)    : null,
    allowed.includes('status')         && 'status'         in fields ? (fields.status         === '' ? null : fields.status)         : null,
    allowed.includes('start_date')     && 'start_date'     in fields ? (fields.start_date     === '' ? null : fields.start_date)     : null,
    allowed.includes('end_date')       && 'end_date'       in fields ? (fields.end_date       === '' ? null : fields.end_date)       : null,
    allowed.includes('start_time')     && 'start_time'     in fields ? (fields.start_time     === '' ? null : fields.start_time)     : null,
    allowed.includes('end_time')       && 'end_time'       in fields ? (fields.end_time       === '' ? null : fields.end_time)       : null,
    allowed.includes('duration_hours') && 'duration_hours' in fields ? (fields.duration_hours === '' ? null : fields.duration_hours) : null,
  ]);
  return getTaskById(task_id);
}

async function deleteTask(task_id, employee_id) {
  await callProcedure('sp_delete_task(?, ?, @affected)', [task_id, employee_id]);
  const out = await readOuts('affected');
  if (!out[0]?.affected) throw ApiError.notFound('Task not found');
}

// ─── Weekly Timesheets ───────────────────────────────────────────────────────

async function getOrCreateWeeklyTimesheet(employee_id, weekStart, weekEnd) {
  await callProcedure('sp_get_weekly_timesheet(?, ?, ?, @ts_id)', [employee_id, weekStart, weekEnd]);
  const out = await readOuts('ts_id');
  const results = await callProcedure('sp_get_timesheet(?)', [out[0].ts_id]);
  return (results[0] ?? [])[0] ?? null;
}

async function getMyTimesheets(employee_id) {
  const results = await callProcedure('sp_get_my_timesheets(?)', [employee_id]);
  return results[0] ?? [];
}

async function getTimesheetById(timesheet_id) {
  const results = await callProcedure('sp_get_timesheet(?)', [timesheet_id]);
  return (results[0] ?? [])[0] ?? null;
}

async function getTimesheetEntries(timesheet_id) {
  const results = await callProcedure('sp_get_timesheet_entries(?)', [timesheet_id]);
  return results[0] ?? [];
}

// ─── Save/update entries for a week ─────────────────────────────────────────
async function saveEntries(employee_id, weekDateStr, entries) {
  const { weekStart, weekEnd } = isoWeekBounds(weekDateStr);

  const sanitised = entries.map(e => ({
    task_id:        e.task_id || null,
    project_name:   e.project_name || '',
    task_name:      e.task_name || '',
    activity_desc:  e.activity_desc || '',
    work_date:      toDateStr(e.work_date),
    start_time:     e.start_time || null,
    end_time:       e.end_time || null,
    duration_hours: parseFloat(e.duration_hours) || 0,
  }));

  await callProcedure(
    'sp_save_timesheet_entries(?, ?, ?, ?, @ts_id, @ok, @msg)',
    [employee_id, weekStart, weekEnd, JSON.stringify(sanitised)]
  );
  const out = await readOuts('ts_id', 'ok', 'msg');
  const { ts_id, ok, msg } = out[0];
  if (!ok) throw ApiError.badRequest(msg || 'Failed to save timesheet entries');
  return getTimesheetById(ts_id);
}

// ─── Submit a week's timesheet ───────────────────────────────────────────────
async function submitTimesheet(employee_id, timesheet_id) {
  await callProcedure('sp_submit_timesheet(?, ?, @ok, @msg)', [employee_id, timesheet_id]);
  const out = await readOuts('ok', 'msg');
  if (!out[0]?.ok) throw ApiError.badRequest(out[0]?.msg || 'Cannot submit timesheet');
  return getTimesheetById(timesheet_id);
}

// ─── Manager: list timesheets for their direct reports ───────────────────────
async function listManagerTimesheets(manager_employee_id, { status } = {}) {
  const results = await callProcedure('sp_list_manager_timesheets(?, ?)', [manager_employee_id, status ?? null]);
  return results[0] ?? [];
}

// ─── Admin: list all timesheets ──────────────────────────────────────────────
async function listAllTimesheets({ status, employee_id } = {}) {
  const results = await callProcedure('sp_list_all_timesheets(?, ?)', [status ?? null, employee_id ?? null]);
  return results[0] ?? [];
}

// ─── Manager: approve / reject ───────────────────────────────────────────────
async function reviewTimesheet(timesheet_id, { decision, reviewed_by, comments = '' }) {
  await callProcedure('sp_review_timesheet(?, ?, ?, ?, @ok, @msg)', [
    timesheet_id, decision, reviewed_by, comments,
  ]);
  const out = await readOuts('ok', 'msg');
  if (!out[0]?.ok) {
    const msg = out[0]?.msg ?? 'Cannot review timesheet';
    if (msg.includes('not found')) throw ApiError.notFound(msg);
    throw ApiError.badRequest(msg);
  }
  return getTimesheetById(timesheet_id);
}

// ─── Extra Work Requests ─────────────────────────────────────────────────────

async function createExtraWorkRequest({ employee_id, timesheet_id, work_date, task_name, extra_hours, reason }) {
  // SP inserts the row, sets @id OUT param, then returns a SELECT of the new row
  const results = await callProcedure('sp_create_extra_work_request(?, ?, ?, ?, ?, ?, @id)', [
    employee_id, timesheet_id || null, toDateStr(work_date), task_name, extra_hours, reason,
  ]);
  return (results[0] ?? [])[0] ?? null;
}

async function listExtraWorkRequests(employee_id) {
  const results = await callProcedure('sp_list_extra_work_requests(?)', [employee_id]);
  return results[0] ?? [];
}

async function listManagerExtraWork(manager_employee_id) {
  const results = await callProcedure('sp_list_manager_extra_work(?)', [manager_employee_id]);
  return results[0] ?? [];
}

async function reviewExtraWork(extra_work_id, { decision, reviewed_by, manager_notes = '' }) {
  // SP sets OUT params @ok/@msg AND returns a SELECT of the updated row
  const results = await callProcedure('sp_review_extra_work(?, ?, ?, ?, @ok, @msg)', [
    extra_work_id, decision, reviewed_by, manager_notes,
  ]);
  const out = await readOuts('ok', 'msg');
  if (!out[0]?.ok) {
    const msg = out[0]?.msg ?? 'Cannot review';
    if (msg.includes('not found')) throw ApiError.notFound(msg);
    throw ApiError.badRequest(msg);
  }
  return (results[0] ?? [])[0] ?? null;
}

// ─── Dashboard Counts ────────────────────────────────────────────────────────

async function employeeDashboardCounts(employee_id) {
  const results = await callProcedure('sp_employee_timesheet_counts(?)', [employee_id]);
  const row      = (results[0] ?? [])[0] ?? {};
  const taskCount = (results[1] ?? [])[0] ?? {};
  return {
    draftTasks:     Number(taskCount.cnt   || 0),
    submittedWeeks: Number(row.draft  || 0) + Number(row.pending || 0) + Number(row.approved || 0) + Number(row.rejected || 0),
    pendingApproval: Number(row.pending  || 0),
    approvedWeeks:   Number(row.approved || 0),
    rejectedWeeks:   Number(row.rejected || 0),
  };
}

async function managerDashboardCounts(manager_employee_id) {
  const results = await callProcedure('sp_manager_timesheet_counts(?)', [manager_employee_id]);
  const row = (results[0] ?? [])[0] ?? {};
  return {
    pendingApprovals:   Number(row.pending  || 0),
    approvedTimesheets: Number(row.approved || 0),
    rejectedTimesheets: Number(row.rejected || 0),
  };
}

async function adminDashboardCounts() {
  const results = await callProcedure('sp_admin_timesheet_counts()');
  const ts  = (results[0] ?? [])[0] ?? {};
  const emp = (results[1] ?? [])[0] ?? {};
  const mgr = (results[2] ?? [])[0] ?? {};
  return {
    totalEmployees:     Number(emp.cnt      || 0),
    totalManagers:      Number(mgr.cnt      || 0),
    pendingTimesheets:  Number(ts.pending   || 0),
    approvedTimesheets: Number(ts.approved  || 0),
    rejectedTimesheets: Number(ts.rejected  || 0),
  };
}

// ─── Manager Full Dashboard ──────────────────────────────────────────────────
async function managerFullDashboard(manager_employee_id) {
  const results = await callProcedure('sp_manager_full_dashboard(?)', [manager_employee_id]);
  const teamMembers      = results[0] ?? [];
  const attendanceRows   = results[1] ?? [];
  const tsCounts         = (results[2] ?? [])[0] ?? {};
  const recentActivities = results[3] ?? [];

  const attMap = {};
  attendanceRows.forEach(a => { attMap[a.employee_id] = a; });
  const present = attendanceRows.filter(a => a.status === 'present').length;
  const late    = attendanceRows.filter(a => a.status === 'late').length;
  const absent  = teamMembers.length - present;

  const team = teamMembers.map(m => ({
    ...m,
    attendance_status: attMap[m.employee_id]?.status     || 'absent',
    check_in:          attMap[m.employee_id]?.check_in   || null,
    check_out:         attMap[m.employee_id]?.check_out  || null,
    work_hours:        attMap[m.employee_id]?.work_hours || null,
    late_by_minutes:   attMap[m.employee_id]?.late_by_minutes || 0,
  }));

  return {
    summary: {
      totalTeam:           teamMembers.length,
      presentToday:        present,
      absentToday:         absent,
      lateToday:           late,
      pendingTimesheets:   Number(tsCounts.pending  || 0),
      approvedTimesheets:  Number(tsCounts.approved || 0),
      rejectedTimesheets:  Number(tsCounts.rejected || 0),
    },
    team,
    recentActivities,
  };
}

module.exports = {
  // Tasks
  createTask, getTaskById, listMyTasks, updateTask, deleteTask,
  // Timesheets
  getOrCreateWeeklyTimesheet, getMyTimesheets, getTimesheetById,
  getTimesheetEntries, saveEntries, submitTimesheet,
  listManagerTimesheets, listAllTimesheets, reviewTimesheet,
  // Extra work
  createExtraWorkRequest, listExtraWorkRequests, listManagerExtraWork, reviewExtraWork,
  // Dashboards
  employeeDashboardCounts, managerDashboardCounts, adminDashboardCounts,
  managerFullDashboard,
};
