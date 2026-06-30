const { callProcedure } = require('../config/db');

class ReportService {
  async employeeSummary() {
    const results = await callProcedure('sp_employee_summary_report()');
    return {
      byStatus:     results[0] ?? [],
      byDepartment: results[1] ?? [],
      byType:       results[2] ?? [],
    };
  }

  async attendanceReport({ from_date, to_date, department_id } = {}) {
    const results = await callProcedure(
      'sp_attendance_report(?, ?, ?)',
      [from_date ?? null, to_date ?? null, department_id ?? null]
    );
    return { summary: results[0] ?? [], details: results[1] ?? [] };
  }

  async leaveReport({ year, department_id, status } = {}) {
    const results = await callProcedure(
      'sp_leave_report(?, ?, ?)',
      [year ?? null, department_id ?? null, status ?? null]
    );
    return { summary: results[0] ?? [], details: results[1] ?? [] };
  }

  async payrollReport({ month, year, department_id } = {}) {
    const results = await callProcedure(
      'sp_payroll_report(?, ?, ?)',
      [month ?? null, year ?? null, department_id ?? null]
    );
    return { summary: results[0] ?? [], details: results[1] ?? [] };
  }

  async helpdeskReport({ from_date, to_date } = {}) {
    const results = await callProcedure(
      'sp_helpdesk_report(?, ?)',
      [from_date ?? null, to_date ?? null]
    );
    return {
      byStatus:   results[0] ?? [],
      byCategory: results[1] ?? [],
      byPriority: results[2] ?? [],
    };
  }

  async hiringReport() {
    const results = await callProcedure('sp_hiring_report()');
    return {
      jobsByStatus:         results[0] ?? [],
      applicationsByStatus: results[1] ?? [],
      referralsByStatus:    results[2] ?? [],
      openJobs:             results[3] ?? [],
    };
  }

  async reviewReport({ review_type_id, status } = {}) {
    const results = await callProcedure(
      'sp_review_report(?, ?)',
      [review_type_id ?? null, status ?? null]
    );
    return { byStatus: results[0] ?? [], details: results[1] ?? [] };
  }
}

module.exports = new ReportService();
