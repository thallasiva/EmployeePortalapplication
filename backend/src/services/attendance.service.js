const BaseService = require('./base.service');
const { callProcedure, query } = require('../config/db');

function indiaDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

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
    const row = (results[0] ?? [])[0] ?? null;
    if (!row) return null;
    // Attach punches from result set 1
    const punches = results[1] ?? [];
    return { ...row, punches };
  }

  async monthly(employeeId, month, year) {
    const results = await callProcedure('sp_get_monthly_attendance(?, ?, ?)', [employeeId, month, year]);
    return results[0] ?? [];
  }

  async swipes(employeeId, date) {
    return query(
      `SELECT punch_id, punch_type, DATE_FORMAT(punch_time, '%H:%i') AS punch_time, location
         FROM attendance_punches
        WHERE employee_id = ? AND attendance_date = ?
        ORDER BY punch_time ASC, punch_id ASC`,
      [employeeId, date]
    );
  }

  async checkIn(employeeId, { date, time, shift_start, lat, lng, location } = {}) {
    const checkDate = date || indiaDate();
    const checkTime = time || new Date().toTimeString().slice(0, 8);
    // Always use 7-param version (lat/lng/location default to NULL if not provided)
    await callProcedure('sp_employee_checkin(?, ?, ?, ?, ?, ?, ?)', [
      employeeId, checkDate, checkTime, shift_start || '09:30:00',
      lat != null ? Number(lat) : null,
      lng != null ? Number(lng) : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }

  async breakStart(employeeId, { date, time, lat, lng, location } = {}) {
    const d = date || new Date().toISOString().slice(0, 10);
    const t = time || new Date().toTimeString().slice(0, 8);
    await callProcedure('sp_break_start(?, ?, ?, ?, ?, ?)', [
      employeeId, d, t,
      lat  != null ? Number(lat)  : null,
      lng  != null ? Number(lng)  : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }

  async breakEnd(employeeId, { date, time, lat, lng, location } = {}) {
    const d = date || new Date().toISOString().slice(0, 10);
    const t = time || new Date().toTimeString().slice(0, 8);
    await callProcedure('sp_break_end(?, ?, ?, ?, ?, ?)', [
      employeeId, d, t,
      lat  != null ? Number(lat)  : null,
      lng  != null ? Number(lng)  : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }

  async checkOut(employeeId, { date, time, lat, lng, location } = {}) {
    const checkDate = date || indiaDate();
    const checkTime = time || new Date().toTimeString().slice(0, 8);
    // Always use 6-param version (lat/lng/location default to NULL if not provided)
    await callProcedure('sp_employee_checkout(?, ?, ?, ?, ?, ?)', [
      employeeId, checkDate, checkTime,
      lat != null ? Number(lat) : null,
      lng != null ? Number(lng) : null,
      location || null,
    ]);
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
