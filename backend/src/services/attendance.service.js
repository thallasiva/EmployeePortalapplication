const BaseService = require('./base.service');
const { callProcedure, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
function zonedDateTime(timeZone) {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
  return { date, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}
function minutesBetween(start, end) {
  const [sh, sm, ss = 0] = String(start).split(':').map(Number);
  const [eh, em, es = 0] = String(end).split(':').map(Number);
  let delta = (eh * 3600 + em * 60 + es) - (sh * 3600 + sm * 60 + ss);
  if (delta < 0) delta += 86400;
  return Math.floor(delta / 60);
}
class AttendanceService extends BaseService {
  constructor() {
    super('attendance', 'attendance_id', [
      'employee_id', 'attendance_date', 'check_in', 'check_out',
      'work_hours', 'late_by_minutes', 'status', 'source',
    ]);
  }
  async getCompanyTimezone(employeeId) {
    const rows = await query(`SELECT COALESCE(c.timezone, 'Asia/Kolkata') AS timezone
      FROM employees e LEFT JOIN companies c ON c.company_id = e.company_id
      WHERE e.employee_id = ? LIMIT 1`, [employeeId]);
    return rows[0]?.timezone || 'Asia/Kolkata';
  }
  async getShiftStart(employeeId, date) {
    const assignments = await query(`SELECT sd.start_time
      FROM employee_shift_assignments esa JOIN shift_definitions sd ON sd.shift_id = esa.shift_id
      WHERE esa.employee_id = ? AND esa.effective_from <= ?
        AND (esa.effective_to IS NULL OR esa.effective_to >= ?) AND sd.status = 'Active'
      ORDER BY esa.effective_from DESC, esa.assignment_id DESC LIMIT 1`, [employeeId, date, date]);
    if (assignments[0]?.start_time) return String(assignments[0].start_time);
    const schedules = await query('SELECT start_time FROM employee_work_schedules WHERE employee_id = ? LIMIT 1', [employeeId]);
    return schedules[0]?.start_time ? String(schedules[0].start_time) : null;
  }
  async list({ employee_id, department_id, from_date, to_date, status, reporting_to, limit, offset, companyId = null } = {}) {
    const scoped = companyId != null;
    const results = await callProcedure(
      'sp_list_attendance(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employee_id   ?? null,
        department_id ?? null,
        from_date     ?? null,
        to_date       ?? null,
        status        ?? null,
        reporting_to  ?? null,
        scoped ? null : (limit != null ? Number(limit) : null),
        scoped ? null : (limit != null ? Number(offset || 0) : null),
      ]
    );
    let rows = results[0] ?? [];
    let total = (results[1] ?? [])[0]?.total ?? rows.length;
    if (scoped) {
      const employees = await query('SELECT employee_id FROM employees WHERE company_id = ?', [companyId]);
      const ids = new Set(employees.map((employee) => Number(employee.employee_id)));
      rows = rows.filter((row) => ids.has(Number(row.employee_id)));
      total = rows.length;
      if (limit != null) rows = rows.slice(Number(offset || 0), Number(offset || 0) + Number(limit));
    }
    return { rows, total };
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
    const timeZone = await this.getCompanyTimezone(employeeId);
    const now = zonedDateTime(timeZone);
    const checkDate = date || now.date;
    const checkTime = time || now.time;
    const scheduledStart = await this.getShiftStart(employeeId, checkDate);
    const offices = await query(`SELECT o.office_name, o.geo_latitude, o.geo_longitude, o.geo_radius_meters
      FROM employees e JOIN offices o ON o.office_id = e.office_id
      WHERE e.employee_id = ? AND o.geo_fence_enabled = 1 AND o.status = 'Active' LIMIT 1`, [employeeId]);
    if (offices.length) {
      const office = offices[0];
      if (lat == null || lng == null) throw ApiError.forbidden('Location access is required to check in at this office');
      if (office.geo_latitude == null || office.geo_longitude == null) throw ApiError.conflict('This office geofence is enabled but its coordinates are not configured');
      const rad = (value) => Number(value) * Math.PI / 180;
      const dLat = rad(Number(lat) - Number(office.geo_latitude));
      const dLng = rad(Number(lng) - Number(office.geo_longitude));
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(Number(office.geo_latitude))) * Math.cos(rad(Number(lat))) * Math.sin(dLng / 2) ** 2;
      const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distance > Number(office.geo_radius_meters || 300)) throw ApiError.forbidden('You are outside the allowed check-in area for ' + office.office_name);
    }
    // Always use 7-param version (lat/lng/location default to NULL if not provided)
    await callProcedure('sp_employee_checkin(?, ?, ?, ?, ?, ?, ?)', [
      employeeId, checkDate, checkTime, scheduledStart || shift_start || '09:30:00',
      lat != null ? Number(lat) : null,
      lng != null ? Number(lng) : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }
  async breakStart(employeeId, { date, time, lat, lng, location } = {}) {
    const now = zonedDateTime(await this.getCompanyTimezone(employeeId));
    const d = date || now.date;
    const t = time || now.time;
    await callProcedure('sp_break_start(?, ?, ?, ?, ?, ?)', [
      employeeId, d, t,
      lat  != null ? Number(lat)  : null,
      lng  != null ? Number(lng)  : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }
  async breakEnd(employeeId, { date, time, lat, lng, location } = {}) {
    const now = zonedDateTime(await this.getCompanyTimezone(employeeId));
    const d = date || now.date;
    const t = time || now.time;
    await callProcedure('sp_break_end(?, ?, ?, ?, ?, ?)', [
      employeeId, d, t,
      lat  != null ? Number(lat)  : null,
      lng  != null ? Number(lng)  : null,
      location || null,
    ]);
    return this.getToday(employeeId);
  }
  async checkOut(employeeId, { date, time, lat, lng, location } = {}) {
    const timeZone = await this.getCompanyTimezone(employeeId);
    const now = zonedDateTime(timeZone);
    let checkDate = date || now.date;
    if (!date) {
      const open = await query(`SELECT attendance_date FROM attendance
        WHERE employee_id = ? AND attendance_date >= DATE_SUB(?, INTERVAL 1 DAY)
          AND attendance_date <= ? AND check_in IS NOT NULL AND check_out IS NULL
        ORDER BY attendance_date DESC LIMIT 1`, [employeeId, now.date, now.date]);
      if (open[0]?.attendance_date) checkDate = String(open[0].attendance_date).slice(0, 10);
    }
    const checkTime = time || now.time;
    // Always use 6-param version (lat/lng/location default to NULL if not provided)
    await callProcedure('sp_employee_checkout(?, ?, ?, ?, ?, ?)', [
      employeeId, checkDate, checkTime,
      lat != null ? Number(lat) : null,
      lng != null ? Number(lng) : null,
      location || null,
    ]);
    const punches = await query(`SELECT punch_type, punch_time FROM attendance_punches
      WHERE employee_id = ? AND attendance_date = ? ORDER BY punch_time, punch_id`, [employeeId, checkDate]);
    let checkIn = null;
    let breakStart = null;
    let workMinutes = 0;
    let breakMinutes = 0;
    for (const punch of punches) {
      if (punch.punch_type === 'IN') checkIn = punch.punch_time;
      else if (punch.punch_type === 'OUT' && checkIn) {
        workMinutes += minutesBetween(checkIn, punch.punch_time);
        checkIn = null;
      } else if (punch.punch_type === 'BREAK_START') breakStart = punch.punch_time;
      else if (punch.punch_type === 'BREAK_END' && breakStart) {
        breakMinutes += minutesBetween(breakStart, punch.punch_time);
        breakStart = null;
      }
    }
    const netMinutes = Math.max(0, workMinutes - breakMinutes);
    const status = netMinutes >= 540 ? 'present' : netMinutes >= 360 ? 'half_day' : 'present';
    await query(`UPDATE attendance SET work_hours = ?, break_minutes = ?, status = ?, updated_at = NOW()
      WHERE employee_id = ? AND attendance_date = ?`, [Math.round((netMinutes / 60) * 100) / 100, breakMinutes, status, employeeId, checkDate]);
    return this.getToday(employeeId);
  }
  async dashboard(date, companyId = null) {
    const checkDate = date || new Date().toISOString().slice(0, 10);
    if (companyId != null) {
      const [row] = await query(`SELECT
        (SELECT COUNT(*) FROM employees WHERE employee_status = 'Active' AND company_id = ?) AS total_employees,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.check_in IS NOT NULL) AS checked_in_today,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.status='present') AS present_today,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.status='absent') AS absent_today,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.status='leave') AS on_leave_today,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.status='late') AS late_today,
        (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.work_hours>=9) AS met_nine_hour_rule,
        (SELECT ROUND(AVG(a.work_hours),1) FROM attendance a JOIN employees e ON e.employee_id=a.employee_id WHERE e.company_id=? AND a.attendance_date=? AND a.work_hours>0) AS avg_hours_per_day`,
      [companyId, companyId, checkDate, companyId, checkDate, companyId, checkDate, companyId, checkDate, companyId, checkDate, companyId, checkDate, companyId, checkDate]);
      return row || null;
    }
    const results = await callProcedure('sp_attendance_dashboard(?)', [checkDate]);
    return results[0]?.[0] || null;
  }
  async analytics(fromDate, toDate, companyId = null) {
    const [weekly, nineHourByDepartment, earlyLogoutByDepartment] = await Promise.all([
      query(
        `SELECT DATE_FORMAT(attendance_date, '%a') AS label,
                SUM(status = 'present') AS present,
                SUM(status = 'absent') AS absent
         FROM attendance a
         JOIN employees e ON e.employee_id = a.employee_id
         WHERE a.attendance_date BETWEEN ? AND ? AND (? IS NULL OR e.company_id = ?)
         GROUP BY attendance_date
         ORDER BY attendance_date`,
        [fromDate, toDate, companyId, companyId]
      ),
      query(
        `SELECT COALESCE(d.department_name, 'Unassigned') AS label,
                SUM(a.work_hours >= 9) AS value
         FROM attendance a
         JOIN employees e ON e.employee_id = a.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         WHERE a.attendance_date = ?
           AND a.status IN ('present', 'late')
           AND a.check_out IS NOT NULL
           AND a.work_hours >= 9 AND (? IS NULL OR e.company_id = ?)
         GROUP BY d.department_id, d.department_name
         ORDER BY value DESC, label`,
        [toDate, companyId, companyId]
      ),
      query(
        `SELECT COALESCE(d.department_name, 'Unassigned') AS label,
                COUNT(*) AS value
         FROM attendance a
         JOIN employees e ON e.employee_id = a.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         WHERE a.attendance_date = ?
           AND a.status IN ('present', 'late')
           AND a.check_out IS NOT NULL
           AND a.work_hours < 9 AND (? IS NULL OR e.company_id = ?)
         GROUP BY d.department_id, d.department_name
         ORDER BY value DESC, label`,
        [toDate, companyId, companyId]
      ),
    ]);
    return { weekly, nineHourByDepartment, earlyLogoutByDepartment };
  }
  async teamLeaveCalendar(year, month, companyId = null) {
    if (companyId != null) {
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const to = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);
      return query(`SELECT lr.leave_request_id, lr.employee_id, e.emp_code,
          TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS employee_name,
          lr.from_date, lr.to_date, lr.days, lr.status, lt.leave_type_name
        FROM leave_requests lr JOIN employees e ON e.employee_id = lr.employee_id
        LEFT JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
        WHERE e.company_id = ? AND lr.status = 'Approved' AND lr.from_date <= ? AND lr.to_date >= ?
        ORDER BY lr.from_date, employee_name`, [companyId, to, from]);
    }
    const results = await callProcedure('sp_team_leave_calendar(?, ?)', [year, month]);
    return results[0] || [];
  }
}
module.exports = new AttendanceService();
