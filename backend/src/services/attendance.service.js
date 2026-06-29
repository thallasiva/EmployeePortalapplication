const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');

const LIST_SELECT = `
  SELECT a.*, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name
    FROM attendance a
    JOIN employees e ON e.employee_id = a.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
`;

class AttendanceService extends BaseService {
  constructor() {
    super('attendance', 'attendance_id', [
      'employee_id', 'attendance_date', 'check_in', 'check_out',
      'work_hours', 'late_by_minutes', 'status', 'source',
    ]);
  }

  async list({ employee_id, department_id, from_date, to_date, status, reporting_to, limit, offset } = {}) {
    const where = [];
    const params = [];

    if (reporting_to) {
      where.push('e.reporting_to = ?');
      params.push(reporting_to);
    }
    if (employee_id) {
      where.push('a.employee_id = ?');
      params.push(employee_id);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    if (from_date) {
      where.push('a.attendance_date >= ?');
      params.push(from_date);
    }
    if (to_date) {
      where.push('a.attendance_date <= ?');
      params.push(to_date);
    }
    if (status) {
      where.push('a.status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY a.attendance_date DESC, a.employee_id`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM attendance a JOIN employees e ON e.employee_id = a.employee_id ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );
    return { rows, total: countRows[0]?.total || 0 };
  }

  async getToday(employeeId) {
    const rows = await query(`${LIST_SELECT} WHERE a.employee_id = ? AND a.attendance_date = CURDATE()`, [employeeId]);
    return rows[0] || null;
  }

  async monthly(employeeId, month, year) {
    return query(
      `${LIST_SELECT} WHERE a.employee_id = ? AND MONTH(a.attendance_date) = ? AND YEAR(a.attendance_date) = ?
       ORDER BY a.attendance_date ASC`,
      [employeeId, month, year]
    );
  }

  async checkIn(employeeId, { date, time, shift_start } = {}) {
    const checkDate = date || new Date().toISOString().slice(0, 10);
    const checkTime = time || new Date().toTimeString().slice(0, 8);
    await callProcedure('sp_employee_checkin(?, ?, ?, ?)', [
      employeeId,
      checkDate,
      checkTime,
      shift_start || '09:30:00',
    ]);
    return this.getToday(employeeId);
  }

  async checkOut(employeeId, { date, time } = {}) {
    const checkDate = date || new Date().toISOString().slice(0, 10);
    const checkTime = time || new Date().toTimeString().slice(0, 8);
    await callProcedure('sp_employee_checkout(?, ?, ?)', [employeeId, checkDate, checkTime]);
    return this.getToday(employeeId);
  }

  async dashboard(date) {
    const checkDate = date || new Date().toISOString().slice(0, 10);
    const results = await callProcedure('sp_attendance_dashboard(?)', [checkDate]);
    return results[0]?.[0] || null;
  }

  async teamLeaveCalendar(year, month) {
    const results = await callProcedure('sp_team_leave_calendar(?, ?)', [year, month]);
    return results[0] || [];
  }
}

module.exports = new AttendanceService();
