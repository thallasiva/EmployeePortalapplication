const { query, withTransaction } = require('../config/db');
const ApiError = require('../utils/ApiError');

// Admin and HR Manager see organisation-wide reports; a Reporting Manager sees their direct reports.
const REPORT_ROLES = ['Admin', 'HR Manager'];
const FEEDBACK_TYPES = ['Positive', 'Constructive', 'Developmental'];

const NAME = (alias) => `TRIM(CONCAT_WS(' ', ${alias}.first_name, ${alias}.last_name))`;

const canSeeReports = (user) => REPORT_ROLES.includes(user?.roleName);
const isManager = (user) => user?.roleName === 'Reporting Manager';

function requireEmployee(user) {
  if (!user?.employeeId) throw ApiError.badRequest('Your login is not linked to an employee record');
  return Number(user.employeeId);
}

async function assertActiveEmployees(ids) {
  const rows = await query(
    `SELECT employee_id FROM employees WHERE employee_id IN (?) AND (employee_status IS NULL OR employee_status = 'Active')`,
    [ids]
  );
  if (rows.length !== ids.length) throw ApiError.badRequest('One or more selected employees are not active');
}

async function assertCategory(categoryId, type) {
  if (!categoryId) return;
  const rows = await query(
    'SELECT category_id FROM kudos_categories WHERE category_id = ? AND category_type = ? AND is_active = 1',
    [categoryId, type]
  );
  if (!rows.length) throw ApiError.badRequest('Selected category is not available');
}

/* ---------- Categories ---------- */

async function listCategories({ type, includeInactive }) {
  const where = [];
  const params = [];
  if (type) { where.push('c.category_type = ?'); params.push(type); }
  if (!includeInactive) where.push('c.is_active = 1');
  return query(
    `SELECT c.*,
            CASE WHEN c.category_type = 'kudos'
                 THEN (SELECT COUNT(*) FROM kudos k WHERE k.category_id = c.category_id)
                 ELSE (SELECT COUNT(*) FROM employee_feedback f WHERE f.category_id = c.category_id) END AS usage_count
       FROM kudos_categories c
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.category_type, c.category_name`,
    params
  );
}

async function createCategory(data) {
  const exists = await query(
    'SELECT category_id FROM kudos_categories WHERE category_type = ? AND category_name = ?',
    [data.category_type, data.category_name]
  );
  if (exists.length) throw ApiError.conflict('A category with this name already exists');
  const result = await query(
    'INSERT INTO kudos_categories (category_name, description, color, category_type, is_active) VALUES (?, ?, ?, ?, ?)',
    [data.category_name, data.description || null, data.color, data.category_type, data.is_active ? 1 : 0]
  );
  return (await query('SELECT * FROM kudos_categories WHERE category_id = ?', [result.insertId]))[0];
}

async function updateCategory(id, data) {
  const current = (await query('SELECT * FROM kudos_categories WHERE category_id = ?', [id]))[0];
  if (!current) throw ApiError.notFound('Category not found');
  const next = { ...current, ...data };
  const dup = await query(
    'SELECT category_id FROM kudos_categories WHERE category_type = ? AND category_name = ? AND category_id <> ?',
    [next.category_type, next.category_name, id]
  );
  if (dup.length) throw ApiError.conflict('A category with this name already exists');
  await query(
    'UPDATE kudos_categories SET category_name = ?, description = ?, color = ?, category_type = ?, is_active = ? WHERE category_id = ?',
    [next.category_name, next.description || null, next.color, next.category_type, next.is_active ? 1 : 0, id]
  );
  return (await query('SELECT * FROM kudos_categories WHERE category_id = ?', [id]))[0];
}

async function deleteCategory(id) {
  const result = await query('DELETE FROM kudos_categories WHERE category_id = ?', [id]);
  if (!result.affectedRows) throw ApiError.notFound('Category not found');
}

/* ---------- People picker ---------- */

async function listRecipients(user, { search, teamOnly }) {
  const me = requireEmployee(user);
  const where = [`(e.employee_status IS NULL OR e.employee_status = 'Active')`, 'e.employee_id <> ?'];
  const params = [me];
  if (teamOnly) { where.push('e.reporting_to = ?'); params.push(me); }
  if (search) {
    where.push(`(${NAME('e')} LIKE ? OR e.emp_code LIKE ? OR e.email LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  return query(
    `SELECT e.employee_id, ${NAME('e')} AS name, e.emp_code, e.profile_photo,
            COALESCE(ds.designation_name, e.emp_job_title) AS designation, d.department_name,
            (e.reporting_to = ?) AS is_direct_report
       FROM employees e
       LEFT JOIN designations ds ON ds.designation_id = e.designation_id
       LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE ${where.join(' AND ')}
      ORDER BY is_direct_report DESC, name
      LIMIT 200`,
    [me, ...params]
  );
}

/* ---------- Summary ---------- */

async function getSummary(user) {
  const me = requireEmployee(user);
  const [row] = await query(
    `SELECT
       (SELECT COUNT(*) FROM kudos WHERE to_employee_id = ?) AS kudos_received,
       (SELECT COUNT(*) FROM kudos WHERE from_employee_id = ?) AS kudos_given,
       (SELECT COUNT(*) FROM kudos WHERE to_employee_id = ? AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS kudos_this_month,
       (SELECT COUNT(*) FROM employee_feedback WHERE to_employee_id = ?) AS feedback_received,
       (SELECT COUNT(*) FROM employee_feedback WHERE from_employee_id = ?) AS feedback_given,
       (SELECT COUNT(*) FROM feedback_requests WHERE reviewer_employee_id = ? AND status = 'pending') AS pending_requests,
       (SELECT COUNT(*) FROM employees WHERE reporting_to = ? AND (employee_status IS NULL OR employee_status = 'Active')) AS team_size`,
    [me, me, me, me, me, me, me]
  );
  const byCategory = await query(
    `SELECT COALESCE(c.category_name, 'General') AS category_name, COALESCE(c.color, '#94a3b8') AS color, COUNT(*) AS total
       FROM kudos k LEFT JOIN kudos_categories c ON c.category_id = k.category_id
      WHERE k.to_employee_id = ?
      GROUP BY category_name, color
      ORDER BY total DESC`,
    [me]
  );
  return { ...row, by_category: byCategory };
}

/* ---------- Kudos ---------- */

const KUDOS_SELECT = `
  SELECT k.kudos_id, k.message, k.is_public, k.created_at,
         k.from_employee_id, ${NAME('ef')} AS from_name, ef.profile_photo AS from_photo,
         k.to_employee_id, ${NAME('et')} AS to_name, et.profile_photo AS to_photo,
         d.department_name AS to_department,
         c.category_id, c.category_name, c.color AS category_color
    FROM kudos k
    JOIN employees ef ON ef.employee_id = k.from_employee_id
    JOIN employees et ON et.employee_id = k.to_employee_id
    LEFT JOIN departments d ON d.department_id = et.department_id
    LEFT JOIN kudos_categories c ON c.category_id = k.category_id`;

async function listKudos(user, { scope = 'received', categoryId, departmentId, months, limit, offset }) {
  const me = requireEmployee(user);
  const where = [];
  const params = [];

  if (scope === 'received') { where.push('k.to_employee_id = ?'); params.push(me); }
  else if (scope === 'sent') { where.push('k.from_employee_id = ?'); params.push(me); }
  else if (scope === 'team') {
    if (!isManager(user) && !canSeeReports(user)) throw ApiError.forbidden('Team kudos are available to managers');
    where.push('et.reporting_to = ?'); params.push(me);
  } else if (scope === 'wall') {
    // Everyone sees public kudos; HR / Admin also see private ones.
    if (!canSeeReports(user)) where.push('k.is_public = 1');
  } else {
    throw ApiError.badRequest('Invalid scope');
  }

  if (categoryId) { where.push('k.category_id = ?'); params.push(categoryId); }
  if (departmentId) { where.push('et.department_id = ?'); params.push(departmentId); }
  if (months) { where.push('k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)'); params.push(Number(months)); }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await query(`${KUDOS_SELECT} ${whereSql} ORDER BY k.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM kudos k JOIN employees et ON et.employee_id = k.to_employee_id ${whereSql}`,
    params
  );
  return { rows, total };
}

async function topRecognised({ months = 3, limit = 5 }) {
  return query(
    `SELECT et.employee_id, ${NAME('et')} AS name, COUNT(*) AS total
       FROM kudos k JOIN employees et ON et.employee_id = k.to_employee_id
      WHERE k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY et.employee_id, name
      ORDER BY total DESC, name
      LIMIT ?`,
    [Number(months), Number(limit)]
  );
}

async function giveKudos(user, { to_employee_ids, category_id, message, is_public }) {
  const me = requireEmployee(user);
  const ids = [...new Set(to_employee_ids.map(Number))];
  if (ids.includes(me)) throw ApiError.badRequest('You cannot give kudos to yourself');
  await assertActiveEmployees(ids);
  await assertCategory(category_id, 'kudos');

  await withTransaction(async (conn) => {
    for (const id of ids) {
      await conn.query(
        'INSERT INTO kudos (from_employee_id, to_employee_id, category_id, message, is_public) VALUES (?, ?, ?, ?, ?)',
        [me, id, category_id || null, message, is_public ? 1 : 0]
      );
    }
  });
  return { sent: ids.length };
}

/* ---------- Feedback ---------- */

async function listFeedback(user, { scope = 'received', type, limit, offset }) {
  const me = requireEmployee(user);
  const where = [];
  const params = [];

  if (scope === 'received') { where.push('f.to_employee_id = ?'); params.push(me); }
  else if (scope === 'sent') { where.push('f.from_employee_id = ?'); params.push(me); }
  else if (scope === 'team') {
    if (!isManager(user) && !canSeeReports(user)) throw ApiError.forbidden('Team feedback is available to managers');
    where.push('et.reporting_to = ?'); params.push(me);
  } else {
    throw ApiError.badRequest('Invalid scope');
  }
  if (type) { where.push('f.feedback_type = ?'); params.push(type); }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const rows = await query(
    `SELECT f.feedback_id, f.feedback_type, f.message, f.is_anonymous, f.created_at, f.request_id,
            f.from_employee_id, ${NAME('ef')} AS from_name, COALESCE(dsf.designation_name, ef.emp_job_title) AS from_designation,
            f.to_employee_id, ${NAME('et')} AS to_name, COALESCE(dst.designation_name, et.emp_job_title) AS to_designation,
            (ef.employee_id = et.reporting_to) AS from_is_manager,
            c.category_name, fr.topic AS request_topic
       FROM employee_feedback f
       JOIN employees ef ON ef.employee_id = f.from_employee_id
       JOIN employees et ON et.employee_id = f.to_employee_id
       LEFT JOIN designations dsf ON dsf.designation_id = ef.designation_id
       LEFT JOIN designations dst ON dst.designation_id = et.designation_id
       LEFT JOIN kudos_categories c ON c.category_id = f.category_id
       LEFT JOIN feedback_requests fr ON fr.request_id = f.request_id
      ${whereSql}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id ${whereSql}`,
    params
  );

  // Anonymous feedback hides the author from everyone except the author.
  const masked = rows.map((r) => (r.is_anonymous && Number(r.from_employee_id) !== me
    ? { ...r, from_employee_id: null, from_name: 'Anonymous', from_designation: null, from_is_manager: 0 }
    : r));
  return { rows: masked, total };
}

async function giveFeedback(user, { to_employee_id, feedback_type, category_id, message, is_anonymous, request_id }) {
  const me = requireEmployee(user);
  const to = Number(to_employee_id);
  if (to === me) throw ApiError.badRequest('You cannot give feedback to yourself');
  await assertActiveEmployees([to]);
  await assertCategory(category_id, 'feedback');

  return withTransaction(async (conn) => {
    if (request_id) {
      const [reqRows] = await conn.query(
        'SELECT * FROM feedback_requests WHERE request_id = ? FOR UPDATE',
        [request_id]
      );
      const req = reqRows[0];
      if (!req || Number(req.reviewer_employee_id) !== me || Number(req.requester_employee_id) !== to) {
        throw ApiError.badRequest('Feedback request not found');
      }
      if (req.status !== 'pending') throw ApiError.conflict('This request has already been answered');
      await conn.query(
        "UPDATE feedback_requests SET status = 'completed', responded_at = NOW() WHERE request_id = ?",
        [request_id]
      );
    }
    const [result] = await conn.query(
      `INSERT INTO employee_feedback (from_employee_id, to_employee_id, feedback_type, category_id, message, is_anonymous, request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [me, to, feedback_type, category_id || null, message, is_anonymous ? 1 : 0, request_id || null]
    );
    return { feedback_id: result.insertId };
  });
}

/* ---------- Feedback requests ---------- */

async function listRequests(user, { scope = 'incoming', status }) {
  const me = requireEmployee(user);
  const where = [scope === 'outgoing' ? 'r.requester_employee_id = ?' : 'r.reviewer_employee_id = ?'];
  const params = [me];
  if (status) { where.push('r.status = ?'); params.push(status); }
  return query(
    `SELECT r.*, ${NAME('rq')} AS requester_name, ${NAME('rv')} AS reviewer_name,
            COALESCE(dq.designation_name, rq.emp_job_title) AS requester_designation,
            COALESCE(dv.designation_name, rv.emp_job_title) AS reviewer_designation
       FROM feedback_requests r
       JOIN employees rq ON rq.employee_id = r.requester_employee_id
       JOIN employees rv ON rv.employee_id = r.reviewer_employee_id
       LEFT JOIN designations dq ON dq.designation_id = rq.designation_id
       LEFT JOIN designations dv ON dv.designation_id = rv.designation_id
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(r.status, 'pending', 'completed', 'declined'), r.created_at DESC
      LIMIT 100`,
    params
  );
}

async function requestFeedback(user, { reviewer_employee_ids, topic, message }) {
  const me = requireEmployee(user);
  const ids = [...new Set(reviewer_employee_ids.map(Number))];
  if (ids.includes(me)) throw ApiError.badRequest('You cannot request feedback from yourself');
  await assertActiveEmployees(ids);
  await withTransaction(async (conn) => {
    for (const id of ids) {
      await conn.query(
        'INSERT INTO feedback_requests (requester_employee_id, reviewer_employee_id, topic, message) VALUES (?, ?, ?, ?)',
        [me, id, topic, message || null]
      );
    }
  });
  return { sent: ids.length };
}

async function declineRequest(user, id) {
  const me = requireEmployee(user);
  const result = await query(
    "UPDATE feedback_requests SET status = 'declined', responded_at = NOW() WHERE request_id = ? AND reviewer_employee_id = ? AND status = 'pending'",
    [id, me]
  );
  if (!result.affectedRows) throw ApiError.notFound('Pending request not found');
}

/* ---------- Team (Reporting Manager) ---------- */

async function getTeam(user) {
  const me = requireEmployee(user);
  return query(
    `SELECT e.employee_id, ${NAME('e')} AS name, e.emp_code, e.profile_photo,
            COALESCE(ds.designation_name, e.emp_job_title) AS designation,
            (SELECT COUNT(*) FROM kudos k WHERE k.to_employee_id = e.employee_id AND k.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)) AS kudos_90d,
            (SELECT COUNT(*) FROM employee_feedback f WHERE f.to_employee_id = e.employee_id AND f.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)) AS feedback_90d,
            (SELECT MAX(k.created_at) FROM kudos k WHERE k.to_employee_id = e.employee_id) AS last_kudos_at,
            (SELECT COUNT(*) FROM feedback_requests r WHERE r.requester_employee_id = e.employee_id AND r.reviewer_employee_id = ? AND r.status = 'pending') AS pending_from_me
       FROM employees e
       LEFT JOIN designations ds ON ds.designation_id = e.designation_id
      WHERE e.reporting_to = ? AND (e.employee_status IS NULL OR e.employee_status = 'Active')
      ORDER BY name`,
    [me, me]
  );
}

/* ---------- Reports (HR Manager / Admin) ---------- */

async function getReport(user, { months = 6, departmentId, type }) {
  if (!canSeeReports(user)) throw ApiError.forbidden('Reports are available to HR and Admin');
  const m = Math.min(Math.max(Number(months) || 6, 1), 24);
  const deptK = departmentId ? 'AND et.department_id = ?' : '';
  const deptF = departmentId ? 'AND et.department_id = ?' : '';
  const typeF = type ? 'AND f.feedback_type = ?' : '';
  const dp = departmentId ? [departmentId] : [];
  const tp = type ? [type] : [];

  const [totals] = await query(
    `SELECT
       (SELECT COUNT(*) FROM employees e WHERE (e.employee_status IS NULL OR e.employee_status = 'Active') ${departmentId ? 'AND e.department_id = ?' : ''}) AS employees,
       (SELECT COUNT(*) FROM kudos k JOIN employees et ON et.employee_id = k.to_employee_id
         WHERE k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) ${deptK}) AS kudos,
       (SELECT COUNT(*) FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id
         WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) ${deptF} ${typeF}) AS feedback,
       (SELECT COUNT(*) FROM feedback_requests r WHERE r.status = 'pending') AS pending_requests,
       (SELECT COUNT(*) FROM feedback_requests r WHERE r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)) AS requests_total,
       (SELECT COUNT(*) FROM feedback_requests r WHERE r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND r.status = 'completed') AS requests_completed`,
    [...dp, m, ...dp, m, ...dp, ...tp, m, m]
  );

  const [participation] = await query(
    `SELECT COUNT(DISTINCT p.employee_id) AS active_people FROM (
        SELECT k.from_employee_id AS employee_id FROM kudos k WHERE k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        UNION SELECT k.to_employee_id FROM kudos k WHERE k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        UNION SELECT f.from_employee_id FROM employee_feedback f WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        UNION SELECT f.to_employee_id FROM employee_feedback f WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
     ) p JOIN employees et ON et.employee_id = p.employee_id
     WHERE (et.employee_status IS NULL OR et.employee_status = 'Active') ${deptK}`,
    [m, m, m, m, ...dp]
  );

  const byType = await query(
    `SELECT f.feedback_type, COUNT(*) AS total
       FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id
      WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) ${deptF} ${typeF}
      GROUP BY f.feedback_type`,
    [m, ...dp, ...tp]
  );

  const kudosTrend = await query(
    `SELECT DATE_FORMAT(k.created_at, '%Y-%m') AS month, COUNT(*) AS total
       FROM kudos k JOIN employees et ON et.employee_id = k.to_employee_id
      WHERE k.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? MONTH), '%Y-%m-01') ${deptK}
      GROUP BY month`,
    [m - 1, ...dp]
  );
  const feedbackTrend = await query(
    `SELECT DATE_FORMAT(f.created_at, '%Y-%m') AS month, COUNT(*) AS total
       FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id
      WHERE f.created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ? MONTH), '%Y-%m-01') ${deptF} ${typeF}
      GROUP BY month`,
    [m - 1, ...dp, ...tp]
  );

  const byDepartment = await query(
    `SELECT d.department_id, d.department_name,
            (SELECT COUNT(*) FROM kudos k JOIN employees et ON et.employee_id = k.to_employee_id
              WHERE et.department_id = d.department_id AND k.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)) AS kudos,
            (SELECT COUNT(*) FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id
              WHERE et.department_id = d.department_id AND f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) ${typeF}) AS feedback,
            (SELECT COUNT(*) FROM employee_feedback f JOIN employees et ON et.employee_id = f.to_employee_id
              WHERE et.department_id = d.department_id AND f.feedback_type = 'Positive' AND f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)) AS positive,
            (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.department_id AND (e.employee_status IS NULL OR e.employee_status = 'Active')) AS headcount
       FROM departments d
      ${departmentId ? 'WHERE d.department_id = ?' : ''}
      ORDER BY kudos DESC, d.department_name`,
    [m, m, ...tp, m, ...dp]
  );

  const byEmployee = await query(
    `SELECT et.employee_id, ${NAME('et')} AS name, et.emp_code, d.department_name,
            SUM(f.feedback_type = 'Positive') AS positive,
            SUM(f.feedback_type = 'Constructive') AS constructive,
            SUM(f.feedback_type = 'Developmental') AS developmental,
            COUNT(*) AS total, MAX(f.created_at) AS last_feedback_at
       FROM employee_feedback f
       JOIN employees et ON et.employee_id = f.to_employee_id
       LEFT JOIN departments d ON d.department_id = et.department_id
      WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) ${deptF} ${typeF}
      GROUP BY et.employee_id, name, et.emp_code, d.department_name
      ORDER BY total DESC, name
      LIMIT 200`,
    [m, ...dp, ...tp]
  );

  const lowRecognition = await query(
    `SELECT e.employee_id, ${NAME('e')} AS name, d.department_name,
            (SELECT MAX(k.created_at) FROM kudos k WHERE k.to_employee_id = e.employee_id) AS last_kudos_at
       FROM employees e LEFT JOIN departments d ON d.department_id = e.department_id
      WHERE (e.employee_status IS NULL OR e.employee_status = 'Active') ${departmentId ? 'AND e.department_id = ?' : ''}
        AND NOT EXISTS (SELECT 1 FROM kudos k WHERE k.to_employee_id = e.employee_id AND k.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY))
      ORDER BY last_kudos_at IS NOT NULL, last_kudos_at, name
      LIMIT 10`,
    dp
  );

  // Fill every month in the window so charts have no gaps.
  const trend = [];
  const now = new Date();
  for (let i = m - 1; i >= 0; i -= 1) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    trend.push({
      month: key,
      kudos: Number(kudosTrend.find((r) => r.month === key)?.total || 0),
      feedback: Number(feedbackTrend.find((r) => r.month === key)?.total || 0)
    });
  }

  return {
    months: m,
    totals: { ...totals, active_people: participation.active_people },
    by_type: FEEDBACK_TYPES.map((t) => ({ feedback_type: t, total: Number(byType.find((r) => r.feedback_type === t)?.total || 0) })),
    trend,
    by_department: byDepartment,
    by_employee: byEmployee,
    low_recognition: lowRecognition,
    top_recognised: await topRecognised({ months: m, limit: 5 })
  };
}

module.exports = {
  FEEDBACK_TYPES,
  canSeeReports,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listRecipients,
  getSummary,
  listKudos,
  topRecognised,
  giveKudos,
  listFeedback,
  giveFeedback,
  listRequests,
  requestFeedback,
  declineRequest,
  getTeam,
  getReport
};
