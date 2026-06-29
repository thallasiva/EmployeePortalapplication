const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const PARAMS = [
  { key: 'job_knowledge',      label: 'Job Knowledge / Technical Skills' },
  { key: 'productivity',       label: 'Productivity' },
  { key: 'interpersonal',      label: 'Interpersonal Skills' },
  { key: 'communication',      label: 'Communication Skills' },
  { key: 'deadlines',          label: 'Meeting Deadlines' },
  { key: 'accountability',     label: 'Accountability' },
  { key: 'attitude',           label: 'Attitude & Behaviour' },
  { key: 'attendance',         label: 'Attendance & Punctuality' },
];

/* ── Cycle ──────────────────────────────────────────────────────────────── */

/** Returns the currently active cycle (if any) */
async function getActiveCycle() {
  const [row] = await query(
    `SELECT * FROM appraisal_cycles WHERE status = 'active' ORDER BY cycle_id DESC LIMIT 1`
  );
  // Fallback: return latest cycle regardless of status (for sidebar check etc.)
  if (!row) {
    const [latest] = await query(`SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC LIMIT 1`);
    return latest || null;
  }
  return row;
}

/** Returns all cycles ordered newest first */
async function getAllCycles() {
  return query(`SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC`);
}

/** Admin creates a new inactive cycle */
async function createCycle(adminEmployeeId, { fy_label, deadline, cycle_type }) {
  if (!fy_label) throw ApiError.badRequest('FY label is required');
  const validTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
  const type = validTypes.includes(cycle_type) ? cycle_type : 'yearly';
  const result = await query(
    `INSERT INTO appraisal_cycles (fy_label, cycle_type, status, deadline, rolled_out_by) VALUES (?, ?, 'inactive', ?, ?)`,
    [fy_label, type, deadline || null, adminEmployeeId]
  );
  const [row] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [result.insertId]);
  return row;
}

/** Admin updates cycle name/deadline (any status) */
async function updateCycleSettings(adminEmployeeId, cycleId, { fy_label, deadline, cycle_type }) {
  const [cycle] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  const validTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
  const typeVal = validTypes.includes(cycle_type) ? cycle_type : null;
  await query(
    `UPDATE appraisal_cycles SET fy_label=COALESCE(?,fy_label), deadline=COALESCE(?,deadline), cycle_type=COALESCE(?,cycle_type) WHERE cycle_id=?`,
    [fy_label || null, deadline || null, typeVal, cycleId]
  );
  const [updated] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  return updated;
}

/**
 * Admin rolls out a cycle:
 *  - Sets status = 'active'
 *  - rollout_type = 'all' → enrolls all active employees
 *  - rollout_type = 'selected' → enrolls only the given employee_ids
 * Only one cycle can be active at a time.
 */
async function rolloutCycle(adminEmployeeId, cycleId, { rollout_type = 'all', employee_ids = [] }) {
  // Ensure no other cycle is active
  const [alreadyActive] = await query(
    `SELECT cycle_id FROM appraisal_cycles WHERE status = 'active' AND cycle_id != ?`,
    [cycleId]
  );
  if (alreadyActive) throw ApiError.badRequest('Another appraisal cycle is already active. Disable it first.');

  const [cycle] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  if (cycle.status === 'active') throw ApiError.badRequest('Cycle is already active');

  await query(
    `UPDATE appraisal_cycles SET status='active', rollout_type=?, rolled_out_at=NOW(), rolled_out_by=?, disabled_at=NULL, disabled_by=NULL WHERE cycle_id=?`,
    [rollout_type, adminEmployeeId, cycleId]
  );

  // Enroll employees
  const targets = rollout_type === 'all'
    ? (await query(`SELECT employee_id FROM employees WHERE employee_status = 'Active'`)).map(e => e.employee_id)
    : employee_ids.map(Number).filter(Boolean);

  for (const empId of targets) {
    await query(
      `INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by) VALUES (?,?,?)`,
      [cycleId, empId, adminEmployeeId]
    );
  }

  const [updated] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  return updated;
}

/**
 * Admin disables a cycle:
 *  - Sets status = 'inactive'
 *  - Resets all self_appraisals for this cycle back to 'draft' (status → "New")
 *  - Clears submitted_at so employees can re-submit when cycle is re-enabled
 */
async function disableCycle(adminEmployeeId, cycleId) {
  const [cycle] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  if (cycle.status !== 'active') throw ApiError.badRequest('Cycle is not active');

  // Reset all employee appraisals for this cycle to draft ("New")
  await query(
    `UPDATE self_appraisals SET status = 'draft', submitted_at = NULL WHERE cycle_id = ?`,
    [cycleId]
  );

  await query(
    `UPDATE appraisal_cycles SET status='inactive', disabled_at=NOW(), disabled_by=? WHERE cycle_id=?`,
    [adminEmployeeId, cycleId]
  );

  const [updated] = await query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  return updated;
}

// Keep for backward compat (sidebar check uses getActiveCycle)
async function toggleCycle(adminEmployeeId) {
  const cycle = await getActiveCycle();
  if (!cycle) throw ApiError.notFound('No appraisal cycle found');
  if (cycle.status === 'active') {
    return disableCycle(adminEmployeeId, cycle.cycle_id);
  } else {
    return rolloutCycle(adminEmployeeId, cycle.cycle_id, { rollout_type: 'all' });
  }
}

/* ── Enrollment ─────────────────────────────────────────────────────────── */
async function getEnrollments(cycleId) {
  return query(
    `SELECT ae.employee_id, ae.enrolled_at,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_code, e.emp_job_title, d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name,
            sa.status AS appraisal_status
       FROM appraisal_enrollments ae
       JOIN employees e ON e.employee_id = ae.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to
       LEFT JOIN self_appraisals sa ON sa.employee_id = ae.employee_id AND sa.cycle_id = ae.cycle_id
      WHERE ae.cycle_id = ?
      ORDER BY e.first_name`,
    [cycleId]
  );
}

async function enrollEmployees(cycleId, adminEmployeeId, employeeIds) {
  for (const empId of employeeIds) {
    await query(
      `INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by) VALUES (?,?,?)`,
      [cycleId, empId, adminEmployeeId]
    );
  }
  return getEnrollments(cycleId);
}

async function unenrollEmployee(cycleId, employeeId) {
  await query(
    `DELETE FROM appraisal_enrollments WHERE cycle_id=? AND employee_id=?`,
    [cycleId, employeeId]
  );
  return { success: true };
}

async function isEnrolled(cycleId, employeeId) {
  const [row] = await query(
    `SELECT 1 FROM appraisal_enrollments WHERE cycle_id=? AND employee_id=?`,
    [cycleId, employeeId]
  );
  return !!row;
}

/* ── Employee: get/save/submit ──────────────────────────────────────────── */
async function getMyAppraisal(employeeId) {
  const cycle = await getActiveCycle();
  if (!cycle) return { cycle: null, appraisal: null, ratings: [], enrolled: false };

  // If cycle is not active, employees should not see the appraisal form
  if (cycle.status !== 'active') {
    return { cycle, appraisal: null, ratings: [], parameters: PARAMS, enrolled: false };
  }

  // Lazy enrollment: if cycle is active and employee not yet enrolled, auto-enroll them
  const enrolled = await isEnrolled(cycle.cycle_id, employeeId);
  if (!enrolled) {
    await query(
      `INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by) VALUES (?,?,?)`,
      [cycle.cycle_id, employeeId, employeeId]
    );
  }

  const [appraisal] = await query(
    `SELECT * FROM self_appraisals WHERE cycle_id=? AND employee_id=?`,
    [cycle.cycle_id, employeeId]
  );
  let ratings = [];
  if (appraisal) {
    ratings = await query(
      `SELECT * FROM appraisal_ratings WHERE appraisal_id=?`,
      [appraisal.appraisal_id]
    );
  }
  return { cycle, appraisal: appraisal || null, ratings, parameters: PARAMS, enrolled: true };
}

async function saveMyAppraisal(employeeId, { ratings, overall_comments, submit }) {
  const cycle = await getActiveCycle();
  if (!cycle || cycle.status !== 'active')
    throw ApiError.badRequest('No active appraisal cycle');

  let [appraisal] = await query(
    `SELECT * FROM self_appraisals WHERE cycle_id=? AND employee_id=?`,
    [cycle.cycle_id, employeeId]
  );

  if (!appraisal) {
    const result = await query(
      `INSERT INTO self_appraisals (cycle_id, employee_id, status, overall_comments) VALUES (?,?,?,?)`,
      [cycle.cycle_id, employeeId, 'draft', overall_comments || null]
    );
    [appraisal] = await query(`SELECT * FROM self_appraisals WHERE appraisal_id=?`, [result.insertId]);
  } else {
    if (appraisal.status === 'submitted')
      throw ApiError.badRequest('Appraisal already submitted');
    await query(
      `UPDATE self_appraisals SET overall_comments=? WHERE appraisal_id=?`,
      [overall_comments || null, appraisal.appraisal_id]
    );
  }

  for (const r of (ratings || [])) {
    const [existing] = await query(
      `SELECT rating_id FROM appraisal_ratings WHERE appraisal_id=? AND parameter_key=?`,
      [appraisal.appraisal_id, r.parameter_key]
    );
    if (existing) {
      await query(
        `UPDATE appraisal_ratings SET self_rating=?, self_comments=?, parameter_label=? WHERE rating_id=?`,
        [r.self_rating ?? null, r.self_comments ?? null, r.parameter_label ?? null, existing.rating_id]
      );
    } else {
      await query(
        `INSERT INTO appraisal_ratings (appraisal_id, parameter_key, parameter_label, self_rating, self_comments)
         VALUES (?,?,?,?,?)`,
        [appraisal.appraisal_id, r.parameter_key, r.parameter_label ?? null, r.self_rating ?? null, r.self_comments ?? null]
      );
    }
  }

  if (submit) {
    await query(
      `UPDATE self_appraisals SET status='submitted', submitted_at=NOW() WHERE appraisal_id=?`,
      [appraisal.appraisal_id]
    );
  }

  return getMyAppraisal(employeeId);
}

/* ── Manager: team appraisals ───────────────────────────────────────────── */
async function getTeamAppraisals(managerEmployeeId) {
  const cycle = await getActiveCycle();
  if (!cycle) return { cycle: null, team: [] };

  const team = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_job_title, d.department_name,
            sa.appraisal_id, sa.status AS appraisal_status, sa.submitted_at,
            sa.overall_comments
     FROM employees e
     LEFT JOIN departments d ON d.department_id = e.department_id
     LEFT JOIN self_appraisals sa
            ON sa.employee_id = e.employee_id AND sa.cycle_id = ?
     INNER JOIN appraisal_enrollments ae
            ON ae.employee_id = e.employee_id AND ae.cycle_id = ?
     WHERE e.reporting_to = ? AND e.employee_status = 'Active'
     ORDER BY e.first_name`,
    [cycle.cycle_id, cycle.cycle_id, managerEmployeeId]
  );

  for (const member of team) {
    if (member.appraisal_id) {
      member.ratings = await query(
        `SELECT * FROM appraisal_ratings WHERE appraisal_id=?`,
        [member.appraisal_id]
      );
    } else {
      member.ratings = [];
    }
  }

  return { cycle, team, parameters: PARAMS };
}

async function saveManagerRating(managerEmployeeId, appraisalId, { ratings, manager_feedback }) {
  const [appraisal] = await query(
    `SELECT sa.*, e.reporting_to FROM self_appraisals sa
     JOIN employees e ON e.employee_id = sa.employee_id
     WHERE sa.appraisal_id = ?`,
    [appraisalId]
  );
  if (!appraisal) throw ApiError.notFound('Appraisal not found');
  if (appraisal.reporting_to !== managerEmployeeId)
    throw ApiError.forbidden('Not your direct report');

  for (const r of (ratings || [])) {
    await query(
      `UPDATE appraisal_ratings SET manager_rating=?, manager_comments=?
       WHERE appraisal_id=? AND parameter_key=?`,
      [r.manager_rating ?? null, r.manager_comments ?? null, appraisalId, r.parameter_key]
    );
  }

  // manager_feedback (overall) is passed from frontend but stored as per-parameter comments above
  // No separate column needed — per-parameter manager_comments in appraisal_ratings are sufficient

  return { success: true };
}

/* ── Admin: all appraisals ──────────────────────────────────────────────── */
async function getAllAppraisals(cycleIdOrFilters = {}, filters = {}) {
  // Support calling as getAllAppraisals(cycleId, filters) or getAllAppraisals(filters)
  let cycleId, actualFilters;
  if (typeof cycleIdOrFilters === 'number') {
    cycleId = cycleIdOrFilters;
    actualFilters = filters;
  } else {
    actualFilters = cycleIdOrFilters;
    const cycle = await getActiveCycle();
    cycleId = cycle?.cycle_id;
  }

  if (!cycleId) return { cycle: null, appraisals: [], notSubmitted: [] };
  const [cycle] = await require('../config/db').query(`SELECT * FROM appraisal_cycles WHERE cycle_id = ?`, [cycleId]);
  if (!cycle) return { cycle: null, appraisals: [], notSubmitted: [] };

  const where = ['sa.cycle_id = ?'];
  const params = [cycleId];

  if (filters.status)        { where.push('sa.status = ?');          params.push(filters.status); }
  if (filters.department_id) { where.push('e.department_id = ?');    params.push(filters.department_id); }

  const appraisals = await query(
    `SELECT sa.appraisal_id, sa.status AS appraisal_status, sa.submitted_at, sa.overall_comments,
            e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_job_title, d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name
       FROM self_appraisals sa
       JOIN employees e ON e.employee_id = sa.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to
      WHERE ${where.join(' AND ')}
      ORDER BY sa.submitted_at DESC`,
    params
  );

  for (const a of appraisals) {
    const ratings = await query(
      `SELECT self_rating, manager_rating FROM appraisal_ratings WHERE appraisal_id=?`,
      [a.appraisal_id]
    );
    const selfVals = ratings.filter(r => r.self_rating).map(r => r.self_rating);
    const mgrVals  = ratings.filter(r => r.manager_rating).map(r => r.manager_rating);
    a.self_avg    = selfVals.length ? (selfVals.reduce((s,v) => s+v, 0) / selfVals.length).toFixed(1) : null;
    a.manager_avg = mgrVals.length  ? (mgrVals.reduce((s,v) => s+v, 0) / mgrVals.length).toFixed(1)  : null;
    // overall avg: prefer manager avg if available, else self avg
    a.overall_avg = a.manager_avg || a.self_avg;
  }

  // Enrolled employees who haven't started
  const notSubmitted = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_job_title, d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name
       FROM appraisal_enrollments ae
       JOIN employees e ON e.employee_id = ae.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to
      WHERE ae.cycle_id = ?
        AND ae.employee_id NOT IN (
              SELECT employee_id FROM self_appraisals WHERE cycle_id = ?
            )
      ORDER BY e.first_name`,
    [cycle.cycle_id, cycle.cycle_id]
  );

  return { cycle, appraisals, notSubmitted };
}

async function updateAppraisalStatus(appraisalId, status) {
  await query(
    `UPDATE self_appraisals SET status=? WHERE appraisal_id=?`,
    [status, appraisalId]
  );
  const [row] = await query(
    `SELECT sa.*,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name
       FROM self_appraisals sa
       JOIN employees e ON e.employee_id = sa.employee_id
      WHERE sa.appraisal_id=?`,
    [appraisalId]
  );
  return row;
}

module.exports = {
  // Cycle management
  getActiveCycle, getAllCycles, createCycle, updateCycleSettings,
  rolloutCycle, disableCycle, toggleCycle,
  // Enrollment
  getEnrollments, enrollEmployees, unenrollEmployee, isEnrolled,
  // Employee
  getMyAppraisal, saveMyAppraisal,
  // Manager
  getTeamAppraisals, saveManagerRating,
  // Admin
  getAllAppraisals, updateAppraisalStatus,
};

