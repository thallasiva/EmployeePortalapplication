const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

function requireCompanyId(companyId) {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.forbidden('Company context is required');
  }
  return id;
}

class DashboardService {
  async stats(companyId) {
    const company = requireCompanyId(companyId);
    const rows = await query(
      `SELECT
         (SELECT COUNT(*) FROM employees WHERE company_id = ? AND employee_status = 'Active') AS employees_count,
         (SELECT COUNT(*) FROM companies WHERE company_id = ?) AS companies_count,
         (SELECT COUNT(*)
            FROM leave_requests lr
            JOIN employees e ON e.employee_id = lr.employee_id
           WHERE e.company_id = ? AND lr.status = 'Pending') AS pending_leaves_count,
         (SELECT COUNT(*)
            FROM payslips p
            JOIN employees e ON e.employee_id = p.employee_id
           WHERE e.company_id = ? AND p.month = MONTH(CURDATE()) AND p.year = YEAR(CURDATE())) AS salaries_count,
         (SELECT COUNT(*)
            FROM helpdesk_tickets t
            JOIN employees e ON e.employee_id = t.employee_id
           WHERE e.company_id = ? AND t.status IN ('Open', 'In Progress')) AS open_tickets_count,
         (SELECT COUNT(*)
            FROM jobs j
            LEFT JOIN departments d ON d.department_id = j.department_id
            LEFT JOIN employees creator ON creator.employee_id = j.created_by
           WHERE COALESCE(d.company_id, creator.company_id) = ? AND j.status = 'Open') AS open_jobs_count`,
      [company, company, company, company, company, company]
    );
    return rows[0] || {};
  }

  async attendanceDashboard(date, companyId) {
    const company = requireCompanyId(companyId);
    const rows = await query(
      `SELECT
         (SELECT COUNT(*) FROM employees WHERE company_id = ? AND employee_status = 'Active') AS total_employees,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.check_in IS NOT NULL) AS checked_in_today,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.status = 'present') AS present_today,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.status = 'absent') AS absent_today,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.status = 'leave') AS on_leave_today,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.status = 'late') AS late_today,
         (SELECT COUNT(*) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.work_hours >= 9) AS met_nine_hour_rule,
         (SELECT ROUND(AVG(a.work_hours), 1) FROM attendance a JOIN employees e ON e.employee_id = a.employee_id
           WHERE e.company_id = ? AND a.attendance_date = ? AND a.work_hours > 0) AS avg_hours_per_day`,
      [company, company, date, company, date, company, date, company, date, company, date, company, date, company, date]
    );
    return rows[0] || {};
  }

  async teamLeaveCalendar(year, month, companyId) {
    const company = requireCompanyId(companyId);
    const first = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const last = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const leaves = await query(
      `SELECT lr.from_date, lr.to_date
         FROM leave_requests lr
         JOIN employees e ON e.employee_id = lr.employee_id
        WHERE e.company_id = ?
          AND lr.status = 'Approved'
          AND lr.from_date <= ?
          AND lr.to_date >= ?`,
      [company, last, first]
    );
    return Array.from({ length: lastDay }, (_, index) => {
      const day = new Date(Date.UTC(year, month - 1, index + 1)).toISOString().slice(0, 10);
      return {
        day_date: day,
        employees_on_leave: leaves.filter((leave) => {
          const from = new Date(leave.from_date).toISOString().slice(0, 10);
          const to = new Date(leave.to_date).toISOString().slice(0, 10);
          return day >= from && day <= to;
        }).length
      };
    });
  }

  async birthdaysAndAnniversaries(month, companyId) {
    const company = requireCompanyId(companyId);
    return query(
      `SELECT employee_id, emp_code,
              CONCAT(first_name, ' ', IFNULL(last_name, '')) AS employee_name,
              dob, emp_joining_date
         FROM employees
        WHERE company_id = ?
          AND employee_status = 'Active'
          AND (MONTH(dob) = ? OR MONTH(emp_joining_date) = ?)`,
      [company, Number(month), Number(month)]
    );
  }

  async recentActivities(limit = 10, companyId) {
    const company = requireCompanyId(companyId);
    const cappedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    return query(
      `SELECT a.*, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS performed_by_name
         FROM audit_logs a
         LEFT JOIN employees e ON e.employee_id = a.user_id
        WHERE a.company_id = ? OR (a.company_id IS NULL AND e.company_id = ?)
        ORDER BY a.created_at DESC
        LIMIT ?`,
      [company, company, cappedLimit]
    );
  }
}

module.exports = new DashboardService();
