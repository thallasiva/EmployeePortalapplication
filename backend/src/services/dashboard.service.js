const { callProcedure } = require('../config/db');

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
    const results = await callProcedure('sp_birthdays_anniversaries(?)', [Number(month)]);
    return results[0] ?? [];
  }

  async recentActivities(limit = 10) {
    const results = await callProcedure('sp_recent_activities(?)', [Number(limit)]);
    return results[0] ?? [];
  }
}

module.exports = new DashboardService();
