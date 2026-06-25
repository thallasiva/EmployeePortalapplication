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
async function getActiveCycle() {
  const [row] = await query(`SELECT * FROM appraisal_cycles ORDER BY cycle_id DESC LIMIT 1`);
  return row || null;
}

async function toggleCycle(adminEmployeeId) {
  const cycle = await getActiveCycle();
  if (!cycle) throw ApiError.notFound('No appraisal cycle found');
  const newStatus = cycle.status === 'active' ? 'inactive' : 'active';
  const rolledAt  = newStatus === 'active' ? new Date() : null;
  await query(
    `UPDATE appraisal_cycles SET status=?, rolled_out_at=?, rolled_out_by=? WHERE cycle_id=?`,
    [newStatus, rolledAt, adminEmployeeId, cycle.cycle_id]
  );
  return getActiveCycle();
}

async function updateCycleSettings(adminEmployeeId, { fy_label, deadline }) {
  const cycle = await getActiveCycle();
  if (!cycle) throw ApiError.notFound('No appraisal cycle found');
  await query(
    `UPDATE appraisal_cycles SET fy_label=COALESCE(?,fy_label), deadline=COALESCE(?,deadline) WHERE cycle_id=?`,
    [fy_label || null, deadline || null, cycle.cycle_id]
  );
  return getActiveCycle();
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

  // Check enrollment
  const enrolled = await isEnrolled(cycle.cycle_id, employeeId);
  if (!enrolled) return { cycle, appraisal: null, ratings: [], parameters: PARAMS, enrolled: false };

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

  // Upsert ratings
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

  // For each submitted, also get ratings
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
  // Verify this appraisal belongs to a direct report
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
  if (manager_feedback !== undefined) {
    await query(
      `UPDATE self_appraisals SET overall_comments=COALESCE(overall_comments,'')
       WHERE appraisal_id=?`, [appraisalId]
    );
  }
  return { success: true };
}

/* ── Admin: all appraisals ──────────────────────────────────────────────── */
async function getAllAppraisals(filters = {}) {
  const cycle = await getActiveCycle();
  if (!cycle) return { cycle: null, appraisals: [] };

  const where = ['sa.cycle_id = ?'];
  const params = [cycle.cycle_id];

  if (filters.status) { where.push('sa.status = ?'); params.push(filters.status); }
  if (filters.department_id) { where.push('e.department_id = ?'); params.push(filters.department_id); }

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
    a.ratings = await query(
      `SELECT * FROM appraisal_ratings WHERE appraisal_id=?`,
      [a.appraisal_id]
    );
  }

  // Also get employees who have NOT submitted
  const notSubmitted = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
            e.emp_job_title, d.department_name,
            CONCAT(m.first_name,' ',IFNULL(m.last_name,'')) AS manager_name
     FROM employees e
     LEFT JOIN departments d ON d.department_id = e.department_id
     LEFT JOIN employees m ON m.employee_id = e.reporting_to
     LEFT JOIN self_appraisals sa ON sa.employee_id = e.employee_id AND sa.cycle_id = ?
     WHERE e.employee_status = 'Active' AND sa.appraisal_id IS NULL
     ORDER BY e.first_name`,
    [cycle.cycle_id]
  );

  return { cycle, appraisals, notSubmitted, parameters: PARAMS };
}

async function updateAppraisalStatus(appraisalId, status) {
  await query(`UPDATE self_appraisals SET status=? WHERE appraisal_id=?`, [status, appraisalId]);
  return { success: true };
}

module.exports = {
  getActiveCycle, toggleCycle, updateCycleSettings,
  getMyAppraisal, saveMyAppraisal,
  getTeamAppraisals, saveManagerRating,
  getAllAppraisals, updateAppraisalStatus,
  getEnrollments, enrollEmployees, unenrollEmployee, isEnrolled,
  PARAMS,
};
