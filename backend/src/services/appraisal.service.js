const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

const PARAMS = [
  { key: 'job_knowledge', label: 'Job Knowledge / Technical Skills' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'interpersonal', label: 'Interpersonal Skills' },
  { key: 'communication', label: 'Communication Skills' },
  { key: 'deadlines', label: 'Meeting Deadlines' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'attitude', label: 'Attitude & Behaviour' },
  { key: 'attendance', label: 'Attendance & Punctuality' }
];
const CYCLE_TYPES = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
const DECISION_TYPES = ['development', 'promotion', 'increment', 'no_change'];

function normalizeParameters(parameters) {
  const source = parameters ?? PARAMS;
  if (!Array.isArray(source) || source.length === 0 || source.length > 20) {
    throw ApiError.badRequest('A review template must contain between 1 and 20 criteria');
  }
  const keys = new Set();
  return source.map((parameter) => {
    const key = String(parameter?.key || '').trim();
    const label = String(parameter?.label || '').trim();
    if (!/^[a-z][a-z0-9_]{0,49}$/.test(key) || !label || label.length > 255 || keys.has(key)) {
      throw ApiError.badRequest('Review criteria need unique keys and labels');
    }
    keys.add(key);
    return { key, label };
  });
}

function parametersForCycle(cycle) {
  if (!cycle?.template_json) return PARAMS;
  const parsed = typeof cycle.template_json === 'string'
    ? JSON.parse(cycle.template_json)
    : cycle.template_json;
  return normalizeParameters(parsed);
}

async function run(sql, params = [], connection) {
  if (!connection) return query(sql, params);
  const [rows] = await connection.query(sql, params);
  return rows;
}

function companyIdOrThrow(companyId) {
  const company = Number(companyId);
  if (!Number.isInteger(company) || company <= 0) {
    throw ApiError.forbidden('Company context is required');
  }
  return company;
}

async function assertEmployeeInCompany(employeeId, companyId, connection) {
  const company = companyIdOrThrow(companyId);
  const rows = await run(
    'SELECT employee_id FROM employees WHERE employee_id = ? AND company_id = ? LIMIT 1',
    [employeeId, company],
    connection
  );
  if (!rows.length) throw ApiError.forbidden('Employee is outside your company');
}

async function findCycle(cycleId, companyId, connection) {
  const company = companyIdOrThrow(companyId);
  const rows = await run(
    `SELECT * FROM appraisal_cycles
      WHERE cycle_id = ? AND (company_id = ? OR company_id IS NULL)
      LIMIT 1`,
    [cycleId, company],
    connection
  );
  return rows[0] ?? null;
}

async function findAppraisal(appraisalId, companyId, connection, lock = false) {
  const company = companyIdOrThrow(companyId);
  const rows = await run(
    `SELECT sa.*, e.company_id, e.reporting_to, e.employee_id
       FROM self_appraisals sa
       JOIN employees e ON e.employee_id = sa.employee_id
       JOIN appraisal_cycles ac ON ac.cycle_id = sa.cycle_id
      WHERE sa.appraisal_id = ?
        AND e.company_id = ?
        AND (ac.company_id = ? OR ac.company_id IS NULL)
      ${lock ? 'FOR UPDATE' : ''}
      LIMIT 1`,
    [appraisalId, company, company],
    connection
  );
  return rows[0] ?? null;
}

async function recordEvent(connection, appraisalId, actorEmployeeId, action, fromStatus, toStatus, reason) {
  await run(
    `INSERT INTO appraisal_workflow_events
      (appraisal_id, actor_employee_id, action, from_status, to_status, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [appraisalId, actorEmployeeId || null, action, fromStatus || null, toStatus || null, reason || null],
    connection
  );
}

async function ensureLegacyCycleCanBeScoped(cycle, companyId, connection) {
  if (cycle.company_id != null) return;
  const rows = await run(
    `SELECT COUNT(DISTINCT e.company_id) AS company_count,
            SUM(e.company_id <> ?) AS other_company_count
       FROM appraisal_enrollments ae
       JOIN employees e ON e.employee_id = ae.employee_id
      WHERE ae.cycle_id = ?`,
    [companyId, cycle.cycle_id],
    connection
  );
  if (Number(rows[0]?.other_company_count || 0) > 0) {
    throw ApiError.conflict('This legacy cycle is shared across companies. Create a new company cycle to change its settings.');
  }
}

async function getActiveCycle(companyId) {
  const company = companyIdOrThrow(companyId);
  const rows = await query(
    `SELECT * FROM appraisal_cycles
      WHERE status = 'active' AND (company_id = ? OR company_id IS NULL)
      ORDER BY (company_id IS NOT NULL) DESC, cycle_id DESC
      LIMIT 1`,
    [company]
  );
  return rows[0] ?? null;
}

async function getAllCycles(companyId) {
  const company = companyIdOrThrow(companyId);
  return query(
    `SELECT * FROM appraisal_cycles
      WHERE company_id = ? OR company_id IS NULL
      ORDER BY (company_id IS NOT NULL) DESC, cycle_id DESC`,
    [company]
  );
}

async function createCycle(adminEmployeeId, companyId, { fy_label, deadline, cycle_type, parameters }) {
  const company = companyIdOrThrow(companyId);
  if (!fy_label?.trim()) throw ApiError.badRequest('FY label is required');
  if (cycle_type && !CYCLE_TYPES.includes(cycle_type)) throw ApiError.badRequest('Invalid appraisal cycle type');
  await assertEmployeeInCompany(adminEmployeeId, company);
  const existing = await query(
    `SELECT cycle_id FROM appraisal_cycles
      WHERE status = 'active' AND company_id = ?
      LIMIT 1`,
    [company]
  );
  if (existing.length) throw ApiError.conflict('Disable the active appraisal cycle before creating another');
  const template = JSON.stringify(normalizeParameters(parameters));
  const result = await query(
    `INSERT INTO appraisal_cycles (company_id, fy_label, cycle_type, deadline, template_json, status)
     VALUES (?, ?, ?, ?, ?, 'inactive')`,
    [company, fy_label.trim(), cycle_type || 'yearly', deadline || null, template]
  );
  const rows = await query('SELECT * FROM appraisal_cycles WHERE cycle_id = ?', [result.insertId]);
  return rows[0] ?? null;
}

async function updateCycleSettings(adminEmployeeId, companyId, cycleId, { fy_label, deadline, cycle_type, parameters }) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(adminEmployeeId, company);
  if (cycle_type && !CYCLE_TYPES.includes(cycle_type)) throw ApiError.badRequest('Invalid appraisal cycle type');
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  await ensureLegacyCycleCanBeScoped(cycle, company);
  const nextParameters = parameters === undefined ? null : normalizeParameters(parameters);
  const templateChanged = nextParameters
    ? JSON.stringify(nextParameters) !== JSON.stringify(parametersForCycle(cycle))
    : false;
  if (templateChanged) {
    const appraisals = await query('SELECT COUNT(*) AS total FROM self_appraisals WHERE cycle_id = ?', [cycleId]);
    if (Number(appraisals[0]?.total || 0) > 0) {
      throw ApiError.conflict('The review template cannot change after employees have started appraisals');
    }
  }
  const template = templateChanged ? JSON.stringify(nextParameters) : null;
  await query(
    `UPDATE appraisal_cycles
        SET company_id = ?, fy_label = COALESCE(?, fy_label),
            deadline = COALESCE(?, deadline), cycle_type = COALESCE(?, cycle_type),
            template_json = COALESCE(?, template_json)
      WHERE cycle_id = ?`,
    [company, fy_label || null, deadline || null, cycle_type || null, template, cycleId]
  );
  const rows = await query('SELECT * FROM appraisal_cycles WHERE cycle_id = ?', [cycleId]);
  return rows[0] ?? null;
}

async function rolloutCycle(adminEmployeeId, companyId, cycleId, { rollout_type = 'all', employee_ids = [] } = {}) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(adminEmployeeId, company);
  if (!['all', 'selected'].includes(rollout_type)) throw ApiError.badRequest('Invalid rollout type');
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  await ensureLegacyCycleCanBeScoped(cycle, company);
  const selectedIds = [...new Set((employee_ids || []).map(Number))];
  if (rollout_type === 'selected' && !selectedIds.length) {
    throw ApiError.badRequest('Select at least one employee');
  }
  await withTransaction(async (connection) => {
    const active = await run(
      `SELECT cycle_id FROM appraisal_cycles
        WHERE status = 'active' AND cycle_id <> ?
          AND company_id = ?
        LIMIT 1`,
      [cycleId, company],
      connection
    );
    if (active.length) throw ApiError.conflict('Another appraisal cycle is active for this company');

    let employees;
    if (rollout_type === 'all') {
      employees = await run(
        `SELECT employee_id FROM employees
          WHERE company_id = ? AND employee_status = 'Active'`,
        [company],
        connection
      );
    } else {
      const placeholders = selectedIds.map(() => '?').join(', ');
      employees = await run(
        `SELECT employee_id FROM employees
          WHERE company_id = ? AND employee_status = 'Active'
            AND employee_id IN (${placeholders})`,
        [company, ...selectedIds],
        connection
      );
      if (employees.length !== selectedIds.length) {
        throw ApiError.forbidden('Selected employees must belong to your company and be active');
      }
    }

    await run(
      `UPDATE appraisal_cycles
          SET company_id = ?, status = 'active', rollout_type = ?,
              rolled_out_at = NOW(), rolled_out_by = ?, disabled_at = NULL, disabled_by = NULL
        WHERE cycle_id = ?`,
      [company, rollout_type, adminEmployeeId, cycleId],
      connection
    );
    for (const employee of employees) {
      await run(
        `INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by)
         VALUES (?, ?, ?)`,
        [cycleId, employee.employee_id, adminEmployeeId],
        connection
      );
    }
  });
  const rows = await query('SELECT * FROM appraisal_cycles WHERE cycle_id = ?', [cycleId]);
  return rows[0] ?? null;
}

async function disableCycle(adminEmployeeId, companyId, cycleId) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(adminEmployeeId, company);
  const cycle = await findCycle(cycleId, company);
  if (!cycle || cycle.status !== 'active') throw ApiError.badRequest('Cycle is not active');
  await ensureLegacyCycleCanBeScoped(cycle, company);
  await query(
    `UPDATE appraisal_cycles
        SET company_id = ?, status = 'inactive', disabled_at = NOW(), disabled_by = ?
      WHERE cycle_id = ?`,
    [company, adminEmployeeId, cycleId]
  );
  const rows = await query('SELECT * FROM appraisal_cycles WHERE cycle_id = ?', [cycleId]);
  return rows[0] ?? null;
}

async function toggleCycle(adminEmployeeId, companyId) {
  const cycle = await getActiveCycle(companyId);
  if (cycle) return disableCycle(adminEmployeeId, companyId, cycle.cycle_id);
  const cycles = await getAllCycles(companyId);
  const next = cycles[0];
  if (!next) throw ApiError.notFound('No appraisal cycle found');
  return rolloutCycle(adminEmployeeId, companyId, next.cycle_id, { rollout_type: 'all' });
}

async function getEnrollments(cycleId, companyId) {
  const company = companyIdOrThrow(companyId);
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  return query(
    `SELECT ae.employee_id, ae.enrolled_at,
            CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
            e.emp_code, e.emp_job_title, d.department_name,
            CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS manager_name,
            sa.status AS appraisal_status
       FROM appraisal_enrollments ae
       JOIN employees e ON e.employee_id = ae.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to AND m.company_id = e.company_id
       LEFT JOIN self_appraisals sa
         ON sa.employee_id = ae.employee_id AND sa.cycle_id = ae.cycle_id
      WHERE ae.cycle_id = ? AND e.company_id = ?
      ORDER BY e.first_name`,
    [cycleId, company]
  );
}

async function enrollEmployees(cycleId, adminEmployeeId, employeeIds, companyId) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(adminEmployeeId, company);
  if (!Array.isArray(employeeIds) || !employeeIds.length) throw ApiError.badRequest('Select at least one employee');
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  const ids = [...new Set(employeeIds.map(Number))];
  const placeholders = ids.map(() => '?').join(', ');
  const employees = await query(
    `SELECT employee_id FROM employees WHERE company_id = ? AND employee_status = 'Active'
      AND employee_id IN (${placeholders})`,
    [company, ...ids]
  );
  if (employees.length !== ids.length) throw ApiError.forbidden('Employees must belong to your company and be active');
  await withTransaction(async (connection) => {
    for (const employee of employees) {
      await run(
        `INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id, enrolled_by)
         VALUES (?, ?, ?)`,
        [cycleId, employee.employee_id, adminEmployeeId],
        connection
      );
    }
  });
  return getEnrollments(cycleId, company);
}

async function unenrollEmployee(cycleId, employeeId, companyId) {
  const company = companyIdOrThrow(companyId);
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  await assertEmployeeInCompany(employeeId, company);
  const rows = await query(
    `SELECT status FROM self_appraisals WHERE cycle_id = ? AND employee_id = ?`,
    [cycleId, employeeId]
  );
  if (rows[0] && rows[0].status !== 'draft') {
    throw ApiError.conflict('An employee cannot be unenrolled after submitting their appraisal');
  }
  await query('DELETE FROM appraisal_enrollments WHERE cycle_id = ? AND employee_id = ?', [cycleId, employeeId]);
  return { success: true };
}

async function isEnrolled(cycleId, employeeId) {
  const rows = await query(
    'SELECT 1 FROM appraisal_enrollments WHERE cycle_id = ? AND employee_id = ? LIMIT 1',
    [cycleId, employeeId]
  );
  return rows.length > 0;
}

async function getAppraisalContents(appraisalId, connection) {
  const [ratings, goals, events] = await Promise.all([
    run('SELECT * FROM appraisal_ratings WHERE appraisal_id = ? ORDER BY rating_id', [appraisalId], connection),
    run('SELECT * FROM appraisal_goals WHERE appraisal_id = ? ORDER BY sort_order, goal_id', [appraisalId], connection),
    run('SELECT * FROM appraisal_workflow_events WHERE appraisal_id = ? ORDER BY created_at, event_id', [appraisalId], connection)
  ]);
  return { ratings, goals, events };
}

async function getMyAppraisal(employeeId, companyId) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(employeeId, company);
  let cycle = await getActiveCycle(company);
  if (!cycle) {
    const previousCycles = await query(
      `SELECT ac.*
         FROM appraisal_cycles ac
         JOIN appraisal_enrollments ae ON ae.cycle_id = ac.cycle_id
        WHERE ae.employee_id = ?
          AND (ac.company_id = ? OR ac.company_id IS NULL)
        ORDER BY ac.cycle_id DESC
        LIMIT 1`,
      [employeeId, company]
    );
    cycle = previousCycles[0] ?? null;
  }
  if (!cycle) return { cycle: null, appraisal: null, ratings: [], goals: [], events: [], parameters: PARAMS, enrolled: false };
  const parameters = parametersForCycle(cycle);
  let enrolled = await isEnrolled(cycle.cycle_id, employeeId);
  if (!enrolled && cycle.status === 'active' && cycle.rollout_type === 'all') {
    await query(
      'INSERT IGNORE INTO appraisal_enrollments (cycle_id, employee_id) VALUES (?, ?)',
      [cycle.cycle_id, employeeId]
    );
    enrolled = true;
  }
  if (!enrolled) return { cycle, appraisal: null, ratings: [], goals: [], events: [], parameters, enrolled: false };
  const rows = await query(
    `SELECT * FROM self_appraisals
      WHERE cycle_id = ? AND employee_id = ?
      LIMIT 1`,
    [cycle.cycle_id, employeeId]
  );
  const appraisal = rows[0] ?? null;
  const contents = appraisal
    ? await getAppraisalContents(appraisal.appraisal_id)
    : { ratings: [], goals: [], events: [] };
  return { cycle, appraisal, ...contents, parameters, enrolled: true };
}

function validateRatings(ratings, parameters, { requireAll = false } = {}) {
  if (!Array.isArray(ratings)) throw ApiError.badRequest('Ratings must be an array');
  const keys = new Set(parameters.map((parameter) => parameter.key));
  const seen = new Set();
  for (const rating of ratings) {
    if (!keys.has(rating?.parameter_key) || seen.has(rating.parameter_key)) {
      throw ApiError.badRequest('Invalid or duplicate appraisal rating');
    }
    seen.add(rating.parameter_key);
    if (rating.self_rating != null && (!Number.isInteger(Number(rating.self_rating)) || Number(rating.self_rating) < 0 || Number(rating.self_rating) > 5)) {
      throw ApiError.badRequest('Self ratings must be between 0 and 5');
    }
  }
  if (requireAll && parameters.some((parameter) => !ratings.some((rating) => rating.parameter_key === parameter.key && Number(rating.self_rating) >= 1 && Number(rating.self_rating) <= 5))) {
    throw ApiError.badRequest('Complete every self-rating before submitting');
  }
}

function validateGoals(goals) {
  if (!Array.isArray(goals)) throw ApiError.badRequest('Goals must be an array');
  if (goals.length > 20) throw ApiError.badRequest('No more than 20 goals can be added');
  for (const goal of goals) {
    if (goal?.title && goal.title.length > 255) throw ApiError.badRequest('Goal titles must be 255 characters or fewer');
    if (goal.evidence_url && !/^https?:\/\//i.test(goal.evidence_url)) {
      throw ApiError.badRequest('Evidence links must use http or https');
    }
  }
}

async function saveMyAppraisal(employeeId, companyId, { ratings = [], goals = [], overall_comments, submit }) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(employeeId, company);
  validateGoals(goals);
  if (submit && (goals.length === 0 || goals.some((goal) => !goal.title?.trim()))) {
    throw ApiError.badRequest('Add at least one titled goal before submitting');
  }
  const cycle = await getActiveCycle(company);
  if (!cycle || cycle.status !== 'active') throw ApiError.badRequest('No active appraisal cycle');
  const parameters = parametersForCycle(cycle);
  validateRatings(ratings, parameters, { requireAll: Boolean(submit) });
  if (!await isEnrolled(cycle.cycle_id, employeeId)) throw ApiError.forbidden('You are not enrolled in this appraisal cycle');

  await withTransaction(async (connection) => {
    const existing = await run(
      'SELECT * FROM self_appraisals WHERE cycle_id = ? AND employee_id = ? FOR UPDATE',
      [cycle.cycle_id, employeeId],
      connection
    );
    let appraisal = existing[0];
    if (appraisal && !['draft', 'changes_requested'].includes(appraisal.status)) {
      throw ApiError.conflict('This appraisal can no longer be edited');
    }
    if (!appraisal) {
      const result = await run(
        `INSERT INTO self_appraisals (cycle_id, employee_id, status, overall_comments)
         VALUES (?, ?, 'draft', ?)`,
        [cycle.cycle_id, employeeId, overall_comments || null],
        connection
      );
      appraisal = { appraisal_id: result.insertId, status: 'draft' };
    } else {
      await run(
        'UPDATE self_appraisals SET overall_comments = ? WHERE appraisal_id = ?',
        [overall_comments || null, appraisal.appraisal_id],
        connection
      );
    }

    for (const rating of ratings) {
      await run(
        `INSERT INTO appraisal_ratings
          (appraisal_id, parameter_key, parameter_label, self_rating, self_comments)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE parameter_label = VALUES(parameter_label),
           self_rating = VALUES(self_rating), self_comments = VALUES(self_comments)`,
        [appraisal.appraisal_id, rating.parameter_key, rating.parameter_label || null, rating.self_rating || null, rating.self_comments || null],
        connection
      );
    }

    await run('DELETE FROM appraisal_goals WHERE appraisal_id = ?', [appraisal.appraisal_id], connection);
    for (const [index, goal] of goals.entries()) {
      await run(
        `INSERT INTO appraisal_goals
          (appraisal_id, title, description, success_metrics, self_progress, evidence_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appraisal.appraisal_id, goal.title?.trim() || '', goal.description || null,
          goal.success_metrics || null, goal.self_progress || null, goal.evidence_url || null, index
        ],
        connection
      );
    }

    if (submit) {
      const fromStatus = appraisal.status;
      if (fromStatus === 'changes_requested') {
        await run(
          `UPDATE appraisal_ratings
              SET manager_rating = NULL, manager_comments = NULL
            WHERE appraisal_id = ?`,
          [appraisal.appraisal_id],
          connection
        );
        await run(
          'UPDATE appraisal_goals SET manager_feedback = NULL WHERE appraisal_id = ?',
          [appraisal.appraisal_id],
          connection
        );
      }
      await run(
        `UPDATE self_appraisals
            SET overall_comments = ?, status = 'submitted', submitted_at = NOW(), hr_feedback = NULL,
                manager_feedback = IF(? = 'changes_requested', NULL, manager_feedback),
                manager_reviewed_at = IF(? = 'changes_requested', NULL, manager_reviewed_at)
          WHERE appraisal_id = ?`,
        [overall_comments || null, appraisal.status, appraisal.status, appraisal.appraisal_id],
        connection
      );
      await recordEvent(connection, appraisal.appraisal_id, employeeId, 'submit', fromStatus, 'submitted', null);
    }
  });

  return getMyAppraisal(employeeId, company);
}

async function getTeamAppraisals(managerEmployeeId, companyId) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(managerEmployeeId, company);
  let cycle = await getActiveCycle(company);
  if (!cycle) {
    const previousCycles = await query(
      `SELECT DISTINCT ac.*
         FROM appraisal_cycles ac
         JOIN appraisal_enrollments ae ON ae.cycle_id = ac.cycle_id
         JOIN employees e ON e.employee_id = ae.employee_id
         LEFT JOIN self_appraisals sa ON sa.cycle_id = ae.cycle_id AND sa.employee_id = ae.employee_id
        WHERE e.reporting_to = ? AND e.company_id = ?
          AND (ac.company_id = ? OR ac.company_id IS NULL)
          AND (sa.appraisal_id IS NULL OR sa.status <> 'closed')
        ORDER BY ac.cycle_id DESC
        LIMIT 1`,
      [managerEmployeeId, company, company]
    );
    cycle = previousCycles[0] ?? null;
  }
  if (!cycle) return { cycle: null, team: [], parameters: PARAMS };
  const enrollmentJoin = cycle.rollout_type === 'all' ? 'LEFT JOIN' : 'JOIN';
  const team = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
            e.emp_job_title, d.department_name,
            sa.appraisal_id, sa.status AS appraisal_status,
            sa.submitted_at, sa.overall_comments, sa.manager_feedback,
            ae.enrolled_at
       FROM employees e
       ${enrollmentJoin} appraisal_enrollments ae ON ae.employee_id = e.employee_id AND ae.cycle_id = ?
       LEFT JOIN self_appraisals sa ON sa.employee_id = e.employee_id AND sa.cycle_id = ?
       LEFT JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to AND m.company_id = e.company_id
      WHERE e.reporting_to = ? AND e.company_id = ? AND e.employee_status = 'Active'
      ORDER BY e.first_name, e.last_name`,
    [cycle.cycle_id, cycle.cycle_id, managerEmployeeId, company]
  );
  for (const member of team) {
    if (member.appraisal_id) {
      const contents = await getAppraisalContents(member.appraisal_id);
      member.ratings = contents.ratings;
      member.goals = contents.goals;
    } else {
      member.ratings = [];
      member.goals = [];
    }
  }
  return { cycle, team, parameters: parametersForCycle(cycle) };
}

async function saveManagerRating(managerEmployeeId, companyId, appraisalId, { ratings = [], goals = [], manager_feedback, submit }) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(managerEmployeeId, company);
  if (!Array.isArray(ratings)) throw ApiError.badRequest('Ratings must be an array');
  await withTransaction(async (connection) => {
    const appraisal = await findAppraisal(appraisalId, company, connection, true);
    if (!appraisal) throw ApiError.notFound('Appraisal not found');
    if (Number(appraisal.reporting_to) !== Number(managerEmployeeId)) throw ApiError.forbidden('Not your direct report');
    if (!['submitted', 'manager_review'].includes(appraisal.status)) {
      throw ApiError.conflict('This appraisal is not awaiting manager review');
    }
    const cycle = await findCycle(appraisal.cycle_id, company, connection);
    const parameters = parametersForCycle(cycle);
    const allowedKeys = new Set(parameters.map((parameter) => parameter.key));
    const seenKeys = new Set();
    for (const rating of ratings) {
      if (!allowedKeys.has(rating?.parameter_key) || seenKeys.has(rating.parameter_key)) throw ApiError.badRequest('Invalid or duplicate appraisal rating');
      seenKeys.add(rating.parameter_key);
      if (rating.manager_rating != null && (!Number.isInteger(Number(rating.manager_rating)) || Number(rating.manager_rating) < 1 || Number(rating.manager_rating) > 5)) {
        throw ApiError.badRequest('Manager ratings must be between 1 and 5');
      }
    }
    if (submit && parameters.some((parameter) => !ratings.some((rating) => rating.parameter_key === parameter.key && Number(rating.manager_rating) >= 1 && Number(rating.manager_rating) <= 5))) {
      throw ApiError.badRequest('Complete every manager rating before submitting to HR');
    }
    for (const rating of ratings) {
      await run(
        `UPDATE appraisal_ratings
            SET manager_rating = ?, manager_comments = ?
          WHERE appraisal_id = ? AND parameter_key = ?`,
        [rating.manager_rating || null, rating.manager_comments || null, appraisalId, rating.parameter_key],
        connection
      );
    }
    for (const goal of goals) {
      const result = await run(
        `UPDATE appraisal_goals SET manager_feedback = ?
          WHERE goal_id = ? AND appraisal_id = ?`,
        [goal.manager_feedback || null, goal.goal_id, appraisalId],
        connection
      );
      if (!result.affectedRows) throw ApiError.badRequest('Goal does not belong to this appraisal');
    }
    const toStatus = submit ? 'hr_review' : 'manager_review';
    await run(
      `UPDATE self_appraisals
          SET manager_feedback = ?, status = ?, manager_reviewed_at = IF(? = 'hr_review', NOW(), manager_reviewed_at)
        WHERE appraisal_id = ?`,
      [manager_feedback || null, toStatus, toStatus, appraisalId],
      connection
    );
    await recordEvent(connection, appraisalId, managerEmployeeId, submit ? 'manager_submit' : 'manager_save', appraisal.status, toStatus, null);
  });
  const appraisal = await findAppraisal(appraisalId, company);
  const contents = await getAppraisalContents(appraisalId);
  return { ...appraisal, ...contents };
}

async function getAllAppraisals(companyId, cycleIdOrFilters = {}, filters = {}) {
  const company = companyIdOrThrow(companyId);
  let cycleId;
  let actualFilters;
  if (typeof cycleIdOrFilters === 'number') {
    cycleId = cycleIdOrFilters;
    actualFilters = filters;
  } else {
    actualFilters = cycleIdOrFilters;
    const cycle = await getActiveCycle(company);
    cycleId = cycle?.cycle_id;
  }
  if (!cycleId) return { cycle: null, appraisals: [], notSubmitted: [] };
  const cycle = await findCycle(cycleId, company);
  if (!cycle) throw ApiError.notFound('Cycle not found');

  const conditions = ['sa.cycle_id = ?', 'e.company_id = ?'];
  const params = [cycleId, company];
  if (actualFilters.status) {
    conditions.push('sa.status = ?');
    params.push(actualFilters.status);
  }
  if (actualFilters.department_id) {
    conditions.push('e.department_id = ?');
    params.push(actualFilters.department_id);
  }
  const appraisals = await query(
    `SELECT sa.appraisal_id, sa.status AS appraisal_status, sa.submitted_at,
            sa.overall_comments, sa.manager_feedback, sa.hr_feedback,
            sa.acknowledged_at, sa.decision_type, sa.decision_notes,
            sa.decision_ctc_annual, sa.decision_effective_date, sa.closed_at,
            e.employee_id, e.emp_code,
            CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
            e.emp_job_title, d.department_name,
            CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS manager_name,
            sa.manager_reviewed_at
       FROM self_appraisals sa
       JOIN employees e ON e.employee_id = sa.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to AND m.company_id = e.company_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sa.submitted_at DESC, e.first_name`,
    params
  );
  const notSubmitted = await query(
    `SELECT e.employee_id, e.emp_code,
            CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
            e.emp_job_title, d.department_name,
            CONCAT(m.first_name, ' ', IFNULL(m.last_name, '')) AS manager_name
       FROM appraisal_enrollments ae
       JOIN employees e ON e.employee_id = ae.employee_id
       LEFT JOIN departments d ON d.department_id = e.department_id AND d.company_id = e.company_id
       LEFT JOIN employees m ON m.employee_id = e.reporting_to AND m.company_id = e.company_id
      WHERE ae.cycle_id = ? AND e.company_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM self_appraisals sa
           WHERE sa.cycle_id = ae.cycle_id AND sa.employee_id = ae.employee_id
        )
      ORDER BY e.first_name`,
    [cycleId, company]
  );
  for (const appraisal of appraisals) {
    const contents = await getAppraisalContents(appraisal.appraisal_id);
    appraisal.ratings = contents.ratings;
    appraisal.goals = contents.goals;
    appraisal.events = contents.events;
    const selfValues = contents.ratings.map((row) => Number(row.self_rating)).filter((value) => value > 0);
    const managerValues = contents.ratings.map((row) => Number(row.manager_rating)).filter((value) => value > 0);
    appraisal.self_avg = selfValues.length
      ? (selfValues.reduce((sum, value) => sum + value, 0) / selfValues.length).toFixed(1)
      : null;
    appraisal.manager_avg = managerValues.length
      ? (managerValues.reduce((sum, value) => sum + value, 0) / managerValues.length).toFixed(1)
      : null;
    appraisal.overall_avg = appraisal.manager_avg || appraisal.self_avg;
  }
  return { cycle, appraisals, notSubmitted, parameters: parametersForCycle(cycle) };
}

async function acknowledgeAppraisal(employeeId, companyId, appraisalId) {
  const company = companyIdOrThrow(companyId);
  await withTransaction(async (connection) => {
    const appraisal = await findAppraisal(appraisalId, company, connection, true);
    if (!appraisal || Number(appraisal.employee_id) !== Number(employeeId)) {
      throw ApiError.notFound('Appraisal not found');
    }
    if (appraisal.status !== 'shared') throw ApiError.conflict('Only a shared appraisal can be acknowledged');
    await run(
      `UPDATE self_appraisals SET status = 'acknowledged', acknowledged_at = NOW()
        WHERE appraisal_id = ?`,
      [appraisalId],
      connection
    );
    await recordEvent(connection, appraisalId, employeeId, 'acknowledge', 'shared', 'acknowledged', null);
  });
  return getMyAppraisal(employeeId, company);
}

async function applyCompensationDecision(connection, appraisal, company, ctcAnnual, effectiveDate) {
  if (!Number.isFinite(Number(ctcAnnual)) || Number(ctcAnnual) <= 0 || !effectiveDate) {
    throw ApiError.badRequest('A positive annual CTC and effective date are required for compensation changes');
  }
  const assignments = await run(
    `SELECT esa.assignment_id, esa.structure_id, esa.ctc_annual
       FROM employee_salary_assignments esa
       JOIN salary_structures ss ON ss.structure_id = esa.structure_id
      WHERE esa.employee_id = ? AND esa.is_active = 1
        AND esa.effective_from <= CURDATE()
        AND (ss.company_id = ? OR ss.company_id IS NULL)
      ORDER BY esa.effective_from DESC
      LIMIT 1
      FOR UPDATE`,
    [appraisal.employee_id, company],
    connection
  );
  const current = assignments[0];
  if (!current) throw ApiError.badRequest('Assign a salary structure before recording a compensation decision');
  if (String(effectiveDate) <= String(current.effective_from)) {
    throw ApiError.badRequest('Compensation must take effect after the current salary assignment');
  }
  if (Number(ctcAnnual) <= Number(current.ctc_annual)) {
    throw ApiError.badRequest('New annual CTC must be greater than the current assignment');
  }
  await run(
    `INSERT INTO employee_salary_assignments
      (employee_id, structure_id, ctc_annual, effective_from, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [appraisal.employee_id, current.structure_id, ctcAnnual, effectiveDate],
    connection
  );
}

async function processWorkflowAction(actorEmployeeId, companyId, appraisalId, { action, reason, hr_feedback, decision_type, decision_notes, decision_ctc_annual, decision_effective_date }) {
  const company = companyIdOrThrow(companyId);
  await assertEmployeeInCompany(actorEmployeeId, company);
  const validActions = ['request_changes', 'share', 'decision', 'close', 'reopen'];
  if (!validActions.includes(action)) throw ApiError.badRequest('Invalid appraisal workflow action');
  if (['request_changes', 'reopen'].includes(action) && !reason?.trim()) {
    throw ApiError.badRequest('A reason is required for this action');
  }
  if (action === 'decision' && !DECISION_TYPES.includes(decision_type)) {
    throw ApiError.badRequest('Select a valid appraisal decision');
  }

  await withTransaction(async (connection) => {
    const appraisal = await findAppraisal(appraisalId, company, connection, true);
    if (!appraisal) throw ApiError.notFound('Appraisal not found');

    if (action === 'request_changes') {
      if (appraisal.status !== 'hr_review') throw ApiError.conflict('Only appraisals in HR review can be returned');
      await run(
        `UPDATE self_appraisals SET status = 'changes_requested', hr_feedback = ?, hr_reviewed_at = NOW()
          WHERE appraisal_id = ?`,
        [reason.trim(), appraisalId],
        connection
      );
      await recordEvent(connection, appraisalId, actorEmployeeId, action, appraisal.status, 'changes_requested', reason.trim());
      return;
    }

    if (action === 'share') {
      if (appraisal.status !== 'hr_review') throw ApiError.conflict('Only appraisals in HR review can be shared');
      await run(
        `UPDATE self_appraisals
            SET status = 'shared', hr_feedback = ?, hr_reviewed_at = NOW(), shared_at = NOW()
          WHERE appraisal_id = ?`,
        [hr_feedback || null, appraisalId],
        connection
      );
      await recordEvent(connection, appraisalId, actorEmployeeId, action, appraisal.status, 'shared', hr_feedback);
      return;
    }

    if (action === 'decision') {
      if (appraisal.status !== 'acknowledged') throw ApiError.conflict('The employee must acknowledge the shared review first');
      if (appraisal.decision_type) throw ApiError.conflict('A decision has already been recorded; reopen the review to change it');
      if (!['increment', 'promotion'].includes(decision_type) && (decision_ctc_annual || decision_effective_date)) {
        throw ApiError.badRequest('Compensation fields are only valid for promotion or increment decisions');
      }
      if (['increment', 'promotion'].includes(decision_type) && decision_ctc_annual != null) {
        await applyCompensationDecision(connection, appraisal, company, decision_ctc_annual, decision_effective_date);
      } else if (decision_type === 'increment') {
        throw ApiError.badRequest('An annual CTC and effective date are required for an increment');
      }
      await run(
        `UPDATE self_appraisals
            SET decision_type = ?, decision_notes = ?, decision_ctc_annual = ?,
                decision_effective_date = ?, decision_by = ?
          WHERE appraisal_id = ?`,
        [
          decision_type, decision_notes || null, decision_ctc_annual || null,
          decision_effective_date || null, actorEmployeeId, appraisalId
        ],
        connection
      );
      await recordEvent(connection, appraisalId, actorEmployeeId, action, appraisal.status, appraisal.status, decision_notes);
      return;
    }

    if (action === 'close') {
      if (appraisal.status !== 'acknowledged' || !appraisal.decision_type) {
        throw ApiError.conflict('Record a decision after employee acknowledgment before closing');
      }
      await run(
        `UPDATE self_appraisals SET status = 'closed', closed_at = NOW() WHERE appraisal_id = ?`,
        [appraisalId],
        connection
      );
      await recordEvent(connection, appraisalId, actorEmployeeId, action, appraisal.status, 'closed', null);
      return;
    }

    if (appraisal.status !== 'closed') throw ApiError.conflict('Only closed appraisals can be reopened');
    if (['increment', 'promotion'].includes(appraisal.decision_type) && appraisal.decision_ctc_annual) {
      const today = await run('SELECT CURDATE() AS today', [], connection);
      if (String(appraisal.decision_effective_date) <= String(today[0]?.today)) {
        throw ApiError.conflict('Compensation is already effective; use the payroll adjustment workflow before reopening');
      }
      const assignment = await run(
        `UPDATE employee_salary_assignments
            SET is_active = 0
          WHERE employee_id = ? AND effective_from = ? AND ctc_annual = ? AND is_active = 1`,
        [appraisal.employee_id, appraisal.decision_effective_date, appraisal.decision_ctc_annual],
        connection
      );
      if (!assignment.affectedRows) throw ApiError.conflict('The related salary assignment has changed; resolve it before reopening');
    }
    await run(
      `UPDATE self_appraisals
          SET status = 'hr_review', closed_at = NULL, hr_feedback = ?,
              decision_type = NULL, decision_notes = NULL, decision_ctc_annual = NULL,
              decision_effective_date = NULL, decision_by = NULL
        WHERE appraisal_id = ?`,
      [reason.trim(), appraisalId],
      connection
    );
    await recordEvent(connection, appraisalId, actorEmployeeId, action, 'closed', 'hr_review', reason.trim());
  });

  return findAppraisal(appraisalId, company);
}

async function updateAppraisalStatus(appraisalId, companyId, actorEmployeeId, status) {
  const allowed = ['closed', 'hr_review'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Use a workflow action to change appraisal status');
  const appraisal = await findAppraisal(appraisalId, companyId);
  if (!appraisal) throw ApiError.notFound('Appraisal not found');
  return processWorkflowAction(actorEmployeeId, companyId, appraisalId, {
    action: status === 'closed' ? 'close' : 'reopen',
    reason: status === 'hr_review' ? 'Reopened by administrator' : undefined
  });
}

module.exports = {
  getActiveCycle, getAllCycles, createCycle, updateCycleSettings,
  rolloutCycle, disableCycle, toggleCycle,
  getEnrollments, enrollEmployees, unenrollEmployee, isEnrolled,
  getMyAppraisal, saveMyAppraisal,
  getTeamAppraisals, saveManagerRating,
  getAllAppraisals, updateAppraisalStatus, acknowledgeAppraisal,
  processWorkflowAction, PARAMS
};
