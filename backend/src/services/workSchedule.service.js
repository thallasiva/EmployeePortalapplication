const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

const SELECT_SCHEDULE = `
  SELECT ws.*,
         CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
         e.emp_code, e.emp_job_title, e.employee_status,
         d.department_name
    FROM employee_work_schedules ws
    JOIN employees e ON e.employee_id = ws.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
`;

/**
 * List work schedules for all employees.
 * Also includes employees who have no schedule yet (LEFT JOIN).
 */
async function listAll() {
  const rows = await query(`
    SELECT e.employee_id,
           CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
           e.emp_code, e.emp_job_title, e.employee_status,
           d.department_name,
           ws.schedule_id, ws.schedule_type, ws.work_days,
           ws.start_time, ws.end_time, ws.rotation_pattern, ws.updated_at
      FROM employees e
      LEFT JOIN departments d ON d.department_id = e.department_id
      LEFT JOIN employee_work_schedules ws ON ws.employee_id = e.employee_id
     WHERE e.employee_status IN ('Active','Notice Period')
       AND e.has_left_organization = 0
     ORDER BY e.first_name, e.last_name
  `);

  return rows.map(r => ({
    ...r,
    work_days: typeof r.work_days === 'string' ? JSON.parse(r.work_days) : (r.work_days || null),
  }));
}

/** Get a single employee's schedule */
async function getByEmployee(employeeId) {
  const [row] = await query(`${SELECT_SCHEDULE} WHERE ws.employee_id = ?`, [employeeId]);
  if (!row) {
    // Return a default structure if no schedule set
    const [emp] = await query(
      `SELECT e.employee_id, CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS employee_name,
              e.emp_code, e.emp_job_title, d.department_name
         FROM employees e
         LEFT JOIN departments d ON d.department_id = e.department_id
        WHERE e.employee_id = ?`,
      [employeeId]
    );
    if (!emp) throw ApiError.notFound('Employee not found');
    return { ...emp, schedule_id: null, schedule_type: 'fixed', work_days: null, start_time: null, end_time: null, rotation_pattern: null };
  }
  return {
    ...row,
    work_days: typeof row.work_days === 'string' ? JSON.parse(row.work_days) : (row.work_days || null),
  };
}

/** Upsert an employee's work schedule */
async function upsert(employeeId, adminEmployeeId, { schedule_type, work_days, start_time, end_time, rotation_pattern }) {
  const [existing] = await query(
    `SELECT schedule_id FROM employee_work_schedules WHERE employee_id = ?`,
    [employeeId]
  );

  const workDaysJson = work_days ? JSON.stringify(work_days) : null;

  if (existing) {
    await query(
      `UPDATE employee_work_schedules
          SET schedule_type = ?, work_days = ?, start_time = ?, end_time = ?,
              rotation_pattern = ?, updated_by = ?
        WHERE employee_id = ?`,
      [
        schedule_type || 'fixed',
        workDaysJson,
        start_time || null,
        end_time   || null,
        rotation_pattern || null,
        adminEmployeeId,
        employeeId,
      ]
    );
  } else {
    await query(
      `INSERT INTO employee_work_schedules
         (employee_id, schedule_type, work_days, start_time, end_time, rotation_pattern, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        schedule_type || 'fixed',
        workDaysJson,
        start_time || null,
        end_time   || null,
        rotation_pattern || null,
        adminEmployeeId,
      ]
    );
  }

  return getByEmployee(employeeId);
}

/** Delete an employee's custom schedule (revert to company default) */
async function remove(employeeId) {
  await query(`DELETE FROM employee_work_schedules WHERE employee_id = ?`, [employeeId]);
  return { success: true };
}

module.exports = { listAll, getByEmployee, upsert, remove };
