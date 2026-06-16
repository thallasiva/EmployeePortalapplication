const { callProcedure, query } = require('../config/db');

class DashboardService {
  async stats() {
    const results = await callProcedure('sp_dashboard_stats()', []);
    return results[0]?.[0] || {};
  }

  async attendanceDashboard(date) {
    const results = await callProcedure('sp_attendance_dashboard(?)', [date]);
    return results[0]?.[0] || {};
  }

  async teamLeaveCalendar(year, month) {
    const results = await callProcedure('sp_team_leave_calendar(?, ?)', [year, month]);
    return results[0] || [];
  }

  async birthdaysAndAnniversaries(month) {
    const rows = await query(
      `SELECT employee_id, emp_code, CONCAT(first_name, ' ', IFNULL(last_name,'')) AS employee_name,
              dob, emp_joining_date
         FROM employees
        WHERE employee_status = 'Active'
          AND (MONTH(dob) = ? OR MONTH(emp_joining_date) = ?)`,
      [month, month]
    );
    return rows;
  }

  async recentActivities(limit = 10) {
    const rows = await query(
      `SELECT a.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS performed_by_name
         FROM audit_logs a
         LEFT JOIN employees e ON e.employee_id = a.performed_by
        ORDER BY a.created_at DESC
        LIMIT ?`,
      [Number(limit)]
    );
    return rows;
  }
}

module.exports = new DashboardService();
