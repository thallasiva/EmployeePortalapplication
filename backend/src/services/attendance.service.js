const BaseService = require('./base.service');
const { callProcedure } = require('../config/db');

class AttendanceService extends BaseService {
  constructor() {
    super('attendance', 'attendance_id', [
      'employee_id', 'attendance_date', 'check_in', 'check_out',
      'work_hours', 'late_by_minutes', 'status', 'source',
    ]);
  }

  async list({ employee_id, department_id, from_date, to_date, status, reporting_to, limit, offset } = {}) {
    const results = await callProcedure(
      'sp_list_attendance(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employee_id   ?? null,
        department_id ?? null,
        from_date     ?? null,
        to_date       ?? null,
        status        ?? null,
        reporting_to  ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getToday(employeeId) {
    const results = await callProcedure('sp_get_today_attendance(?)', [employeeId]);
    return (results[0] ?? [])[0] ?? null;
  }

  async monthly(employeeId, month, year) {
    const results = await callProcedure('sp_get_monthly_attendance(?, ?, ?)', [employeeId, month, year]);
    return results[0] ?? [];
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
