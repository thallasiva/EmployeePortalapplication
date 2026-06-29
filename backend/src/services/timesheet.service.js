/**
 * TimesheetService
 * Handles employee_tasks, weekly_timesheets, timesheet_entries, extra_work_requests
 */
const { query, callProcedure, withTransaction } = require('../config/db');
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
  const out = await query('SELECT @task_id AS task_id');
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
  // Dynamic update — stored procedures don't support dynamic SET lists,
  // so we build the UPDATE here but keep all other operations as procedures.
  const allowed = ['task_name', 'project_name', 'description', 'status',
                   'start_date', 'end_date', 'start_time', 'end_time', 'duration_hours'];
  const sets = [], params = [];
  for (const [k, v] of Object.entries(fields)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); params.push(v === '' ? null : v); }
  }
  if (!sets.length) throw ApiError.badRequest('Nothing to update');
  params.push(task_id, employee_id);
  await query(`UPDATE employee_tasks SET ${sets.join(', ')} WHERE task_id = ? AND employee_id = ?`, params);
  return getTaskById(task_id);
}

async function deleteTask(task_id, employee_id) {
  await callProcedure('sp_delete_task(?, ?, @affected)', [task_id, employee_id]);
  const out = await query('SELECT @affected AS affected');
  if (!out[0]?.affected) throw ApiError.notFound('Task not found');
}

// ─── Weekly Timesheets ───────────────────────────────────────────────────────

async function getOrCreateWeeklyTimesheet(employee_id, weekStart, weekEnd) {
  await callProcedure('sp_get_weekly_timesheet(?, ?, ?, @ts_id)', [employee_id, weekStart, weekEnd]);
  const out = await query('SELECT @ts_id AS ts_id');
  const [ts] = await query('SELECT * FROM weekly_timesheets WHERE timesheet_id = ?', [out[0].ts_id]);
  return ts;
}

async function getMyTimesheets(employee_id) {
  return query(
    `SELECT wt.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
     WHERE wt.employee_id = ?
     ORDER BY wt.week_start DESC`,
    [employee_id]
  );
}

async function getTimesheetById(timesheet_id) {
  const [ts] = await query(
    `SELECT wt.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
     WHERE wt.timesheet_id = ?`,
    [timesheet_id]
  );
  return ts || null;
}

async function getTimesheetEntries(timesheet_id) {
  return query(
    `SELECT te.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            d.department_name
     FROM timesheet_entries te
     JOIN employees e ON e.employee_id = te.employee_id
     LEFT JOIN departments d ON d.department_id = e.department_id
     WHERE te.timesheet_id = ?
     ORDER BY te.work_date, te.start_time`,
    [timesheet_id]
  );
}

// ─── Save/update entries for a week ─────────────────────────────────────────
// entries = [{ task_id?, project_name, task_name, activity_desc, work_date, start_time, end_time, duration_hours }]
async function saveEntries(employee_id, weekDateStr, entries) {
  const { weekStart, weekEnd } = isoWeekBounds(weekDateStr);
  return withTransaction(async (conn) => {
    // Get or create timesheet header
    let [[ts]] = await conn.query(
      `SELECT * FROM weekly_timesheets WHERE employee_id = ? AND week_start = ?`,
      [employee_id, weekStart]
    );
    if (!ts) {
      const [r] = await conn.query(
        `INSERT INTO weekly_timesheets (employee_id, week_start, week_end, status) VALUES (?,?,?,'draft')`,
        [employee_id, weekStart, weekEnd]
      );
      [[ts]] = await conn.query(`SELECT * FROM weekly_timesheets WHERE timesheet_id = ?`, [r.insertId]);
    }

    if (!['draft', 'rejected'].includes(ts.status)) {
      throw ApiError.badRequest(`Cannot edit a timesheet with status: ${ts.status}`);
    }

    // Collect task_ids currently linked to this timesheet (before deletion)
    const [prevEntries] = await conn.query(
      `SELECT DISTINCT task_id FROM timesheet_entries WHERE timesheet_id = ? AND task_id IS NOT NULL`,
      [ts.timesheet_id]
    );
    const prevTaskIds = prevEntries.map(r => r.task_id);

    // Delete old entries and re-insert
    await conn.query(`DELETE FROM timesheet_entries WHERE timesheet_id = ?`, [ts.timesheet_id]);

    // Collect new task_ids from incoming entries
    const newTaskIds = [...new Set(entries.map(e => e.task_id).filter(Boolean))];

    let totalHours = 0;
    for (const entry of entries) {
      const hours = parseFloat(entry.duration_hours) || 0;
      totalHours += hours;
      await conn.query(
        `INSERT INTO timesheet_entries
           (timesheet_id, employee_id, task_id, project_name, task_name, activity_desc, work_date, start_time, end_time, duration_hours)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          ts.timesheet_id, employee_id,
          entry.task_id || null,
          entry.project_name || '',
          entry.task_name || '',
          entry.activity_desc || '',
          toDateStr(entry.work_date),
          entry.start_time || null,
          entry.end_time || null,
          hours,
        ]
      );
    }

    // Sync task statuses:
    // Tasks removed from timesheet → revert to 'open'
    const removedTaskIds = prevTaskIds.filter(id => !newTaskIds.includes(id));
    if (removedTaskIds.length) {
      await conn.query(
        `UPDATE employee_tasks SET status = 'open' WHERE task_id IN (?) AND employee_id = ? AND status = 'in_timesheet'`,
        [removedTaskIds, employee_id]
      );
    }
    // Tasks added/kept in timesheet → mark 'in_timesheet'
    if (newTaskIds.length) {
      await conn.query(
        `UPDATE employee_tasks SET status = 'in_timesheet' WHERE task_id IN (?) AND employee_id = ?`,
        [newTaskIds, employee_id]
      );
    }

    // Update total hours
    await conn.query(
      `UPDATE weekly_timesheets SET total_hours = ? WHERE timesheet_id = ?`,
      [totalHours, ts.timesheet_id]
    );

    [[ts]] = await conn.query(`SELECT * FROM weekly_timesheets WHERE timesheet_id = ?`, [ts.timesheet_id]);
    return ts;
  });
}

// ─── Submit a week's timesheet ───────────────────────────────────────────────
async function submitTimesheet(employee_id, timesheet_id) {
  const [ts] = await query(
    `SELECT * FROM weekly_timesheets WHERE timesheet_id = ? AND employee_id = ?`,
    [timesheet_id, employee_id]
  );
  if (!ts) throw ApiError.notFound('Timesheet not found');
  if (!['draft', 'rejected'].includes(ts.status)) {
    throw ApiError.badRequest(`Cannot submit a timesheet with status: ${ts.status}`);
  }
  await query(
    `UPDATE weekly_timesheets SET status = 'pending', submitted_at = NOW() WHERE timesheet_id = ?`,
    [timesheet_id]
  );
  return getTimesheetById(timesheet_id);
}

// ─── Manager: list timesheets for their direct reports ───────────────────────
async function listManagerTimesheets(manager_employee_id, { status } = {}) {
  const where = ['e.reporting_to = ?'];
  const params = [manager_employee_id];
  if (status) { where.push('wt.status = ?'); params.push(status); }
  return query(
    `SELECT wt.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_code,
            d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     LEFT JOIN departments d ON d.department_id = e.department_id
     LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
     WHERE ${where.join(' AND ')}
     ORDER BY wt.week_start DESC`,
    params
  );
}

// ─── Admin: list all timesheets ──────────────────────────────────────────────
async function listAllTimesheets({ status, employee_id } = {}) {
  const where = [];
  const params = [];
  if (status) { where.push('wt.status = ?'); params.push(status); }
  if (employee_id) { where.push('wt.employee_id = ?'); params.push(employee_id); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query(
    `SELECT wt.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_code,
            d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS reviewer_name
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     LEFT JOIN departments d ON d.department_id = e.department_id
     LEFT JOIN employees m ON m.employee_id = wt.reviewed_by
     ${whereSql}
     ORDER BY wt.submitted_at DESC, wt.week_start DESC`,
    params
  );
}

// ─── Manager: approve / reject ───────────────────────────────────────────────
async function reviewTimesheet(timesheet_id, { decision, reviewed_by, comments = '' }) {
  const [ts] = await query(
    `SELECT * FROM weekly_timesheets WHERE timesheet_id = ?`,
    [timesheet_id]
  );
  if (!ts) throw ApiError.notFound('Timesheet not found');
  if (ts.status !== 'pending') {
    throw ApiError.badRequest(`Cannot review a timesheet with status: ${ts.status}`);
  }
  const status = decision === 'approved' ? 'approved' : 'rejected';
  await query(
    `UPDATE weekly_timesheets SET status = ?, reviewed_by = ?, reviewed_at = NOW(), comments = ? WHERE timesheet_id = ?`,
    [status, reviewed_by, comments, timesheet_id]
  );

  // Sync task statuses based on decision
  const linkedEntries = await query(
    `SELECT DISTINCT task_id FROM timesheet_entries WHERE timesheet_id = ? AND task_id IS NOT NULL`,
    [timesheet_id]
  );
  const linkedTaskIds = linkedEntries.map(r => r.task_id);
  if (linkedTaskIds.length) {
    const newTaskStatus = status === 'approved' ? 'completed' : 'open';
    await query(
      `UPDATE employee_tasks SET status = ? WHERE task_id IN (?)`,
      [newTaskStatus, linkedTaskIds]
    );
  }

  return getTimesheetById(timesheet_id);
}

// ─── Extra Work Requests ─────────────────────────────────────────────────────

async function createExtraWorkRequest({ employee_id, timesheet_id, work_date, task_name, extra_hours, reason }) {
  const result = await query(
    `INSERT INTO extra_work_requests (employee_id, timesheet_id, work_date, task_name, extra_hours, reason)
     VALUES (?,?,?,?,?,?)`,
    [employee_id, timesheet_id || null, toDateStr(work_date), task_name, extra_hours, reason]
  );
  const [row] = await query(`SELECT * FROM extra_work_requests WHERE extra_work_id = ?`, [result.insertId]);
  return row;
}

async function listExtraWorkRequests(employee_id) {
  return query(
    `SELECT ew.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
     FROM extra_work_requests ew
     JOIN employees e ON e.employee_id = ew.employee_id
     WHERE ew.employee_id = ?
     ORDER BY ew.created_at DESC`,
    [employee_id]
  );
}

async function listManagerExtraWork(manager_employee_id) {
  return query(
    `SELECT ew.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_code
     FROM extra_work_requests ew
     JOIN employees e ON e.employee_id = ew.employee_id
     WHERE e.reporting_to = ?
     ORDER BY ew.created_at DESC`,
    [manager_employee_id]
  );
}

async function reviewExtraWork(extra_work_id, { decision, reviewed_by, manager_notes = '' }) {
  const [ew] = await query(`SELECT * FROM extra_work_requests WHERE extra_work_id = ?`, [extra_work_id]);
  if (!ew) throw ApiError.notFound('Extra work request not found');
  if (ew.status !== 'pending') throw ApiError.badRequest('Already reviewed');
  const status = decision === 'approved' ? 'approved' : 'rejected';
  await query(
    `UPDATE extra_work_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), manager_notes = ? WHERE extra_work_id = ?`,
    [status, reviewed_by, manager_notes, extra_work_id]
  );
  const [row] = await query(`SELECT * FROM extra_work_requests WHERE extra_work_id = ?`, [extra_work_id]);
  return row;
}

// ─── Dashboard Counts ────────────────────────────────────────────────────────

async function employeeDashboardCounts(employee_id) {
  const [row] = await query(
    `SELECT
       SUM(status = 'draft')    AS draft,
       SUM(status = 'pending')  AS pending,
       SUM(status = 'approved') AS approved,
       SUM(status = 'rejected') AS rejected
     FROM weekly_timesheets WHERE employee_id = ?`,
    [employee_id]
  );
  const taskCount = await query(
    `SELECT COUNT(*) AS cnt FROM timesheet_entries WHERE employee_id = ?`,
    [employee_id]
  );
  return {
    draftTasks:     Number(taskCount[0]?.cnt   || 0),
    submittedWeeks: Number(row?.draft  || 0) + Number(row?.pending || 0) + Number(row?.approved || 0) + Number(row?.rejected || 0),
    pendingApproval: Number(row?.pending  || 0),
    approvedWeeks:   Number(row?.approved || 0),
    rejectedWeeks:   Number(row?.rejected || 0),
  };
}

async function managerDashboardCounts(manager_employee_id) {
  const [row] = await query(
    `SELECT
       SUM(wt.status = 'pending')  AS pending,
       SUM(wt.status = 'approved') AS approved,
       SUM(wt.status = 'rejected') AS rejected
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     WHERE e.reporting_to = ?`,
    [manager_employee_id]
  );
  return {
    pendingApprovals:   Number(row?.pending  || 0),
    approvedTimesheets: Number(row?.approved || 0),
    rejectedTimesheets: Number(row?.rejected || 0),
  };
}

async function adminDashboardCounts() {
  const [ts] = await query(
    `SELECT
       SUM(status = 'pending')  AS pending,
       SUM(status = 'approved') AS approved,
       SUM(status = 'rejected') AS rejected
     FROM weekly_timesheets`
  );
  const [emp] = await query(`SELECT COUNT(*) AS cnt FROM employees WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'Employee' LIMIT 1)`);
  const [mgr] = await query(`SELECT COUNT(*) AS cnt FROM employees WHERE role_id = (SELECT role_id FROM roles WHERE role_name = 'Reporting Manager' LIMIT 1)`);
  return {
    totalEmployees:     Number(emp?.cnt      || 0),
    totalManagers:      Number(mgr?.cnt      || 0),
    pendingTimesheets:  Number(ts?.pending   || 0),
    approvedTimesheets: Number(ts?.approved  || 0),
    rejectedTimesheets: Number(ts?.rejected  || 0),
  };
}

// ─── Manager Full Dashboard ──────────────────────────────────────────────────
async function managerFullDashboard(manager_employee_id) {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Team members
  const teamMembers = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS name,
            e.emp_job_title, d.department_name,
            EXISTS(
              SELECT 1 FROM resignations r
              WHERE r.employee_id = e.employee_id
                AND r.status IN ('pending','rm_approved','accepted')
            ) AS serving_notice
     FROM employees e
     LEFT JOIN departments d ON d.department_id = e.department_id
     WHERE e.reporting_to = ? AND e.employee_status = 'Active'
     ORDER BY e.first_name`,
    [manager_employee_id]
  );

  const teamIds = teamMembers.map(e => e.employee_id);

  // 2. Today's attendance (only if team has members)
  let attendance = [];
  if (teamIds.length) {
    attendance = await query(
      `SELECT a.employee_id, a.status, a.check_in, a.check_out, a.work_hours, a.late_by_minutes
       FROM attendance a
       WHERE a.employee_id IN (${teamIds.map(() => '?').join(',')}) AND a.attendance_date = ?`,
      [...teamIds, today]
    );
  }

  const attMap = {};
  attendance.forEach(a => { attMap[a.employee_id] = a; });

  const present = attendance.filter(a => a.status === 'present').length;
  const absent  = teamMembers.length - present;
  const late    = attendance.filter(a => a.status === 'late').length;

  // 3. Timesheet counts for team
  const [tsCounts] = await query(
    `SELECT
       SUM(wt.status = 'pending')  AS pending,
       SUM(wt.status = 'approved') AS approved,
       SUM(wt.status = 'rejected') AS rejected
     FROM weekly_timesheets wt
     JOIN employees e ON e.employee_id = wt.employee_id
     WHERE e.reporting_to = ?`,
    [manager_employee_id]
  );

  // 4. Recent team activities (last 10)
  let recentActivities = [];
  if (teamIds.length) {
    recentActivities = await query(
      `(SELECT 'timesheet' AS type,
               CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS actor,
               CONCAT('Submitted timesheet for week ', DATE_FORMAT(wt.week_start,'%d %b %Y')) AS detail,
               wt.submitted_at AS occurred_at
        FROM weekly_timesheets wt
        JOIN employees e ON e.employee_id = wt.employee_id
        WHERE wt.employee_id IN (${teamIds.map(() => '?').join(',')})
          AND wt.submitted_at IS NOT NULL)
       UNION ALL
       (SELECT 'leave' AS type,
               CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS actor,
               CONCAT('Applied for ', IFNULL(lt.leave_type_name,'Leave'),
                      ' (', lr.from_date,' to ',lr.to_date,')') AS detail,
               lr.applied_on AS occurred_at
        FROM leave_requests lr
        JOIN employees e ON e.employee_id = lr.employee_id
        LEFT JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
        WHERE lr.employee_id IN (${teamIds.map(() => '?').join(',')})
          AND lr.applied_on IS NOT NULL)
       ORDER BY occurred_at DESC
       LIMIT 10`,
      [...teamIds, ...teamIds]
    );
  }

  // 5. Enrich team members with today's attendance status
  const team = teamMembers.map(m => ({
    ...m,
    attendance_status: attMap[m.employee_id]?.status || 'absent',
    check_in:    attMap[m.employee_id]?.check_in    || null,
    check_out:   attMap[m.employee_id]?.check_out   || null,
    work_hours:  attMap[m.employee_id]?.work_hours  || null,
    late_by_minutes: attMap[m.employee_id]?.late_by_minutes || 0,
  }));

  return {
    summary: {
      totalTeam:           teamMembers.length,
      presentToday:        present,
      absentToday:         absent,
      lateToday:           late,
      pendingTimesheets:   Number(tsCounts?.pending  || 0),
      approvedTimesheets:  Number(tsCounts?.approved || 0),
      rejectedTimesheets:  Number(tsCounts?.rejected || 0),
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
  // Extra Work
  createExtraWorkRequest, listExtraWorkRequests, listManagerExtraWork, reviewExtraWork,
  // Dashboard
  employeeDashboardCounts, managerDashboardCounts, adminDashboardCounts,
  managerFullDashboard,
  // util
  isoWeekBounds,
};
