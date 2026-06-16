const { query } = require('../config/db');

class ReportService {
  async employeeSummary() {
    const [byStatus, byDepartment, byType] = await Promise.all([
      query(`SELECT employee_status AS status, COUNT(*) AS total FROM employees GROUP BY employee_status`),
      query(`SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS total
               FROM departments d
               LEFT JOIN employees e ON e.department_id = d.department_id AND e.employee_status = 'Active'
              GROUP BY d.department_id, d.department_name
              ORDER BY d.department_name`),
      query(`SELECT employee_type, COUNT(*) AS total FROM employees WHERE employee_status = 'Active' GROUP BY employee_type`),
    ]);
    return { byStatus, byDepartment, byType };
  }

  async attendanceReport({ from_date, to_date, department_id } = {}) {
    const where = [];
    const params = [];
    if (from_date) {
      where.push('a.attendance_date >= ?');
      params.push(from_date);
    }
    if (to_date) {
      where.push('a.attendance_date <= ?');
      params.push(to_date);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const summary = await query(
      `SELECT a.status, COUNT(*) AS total
         FROM attendance a
         JOIN employees e ON e.employee_id = a.employee_id
         ${whereSql}
        GROUP BY a.status`,
      params
    );

    const details = await query(
      `SELECT a.attendance_id, a.employee_id, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
              d.department_name, a.attendance_date, a.check_in, a.check_out, a.work_hours, a.late_by_minutes, a.status
         FROM attendance a
         JOIN employees e ON e.employee_id = a.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         ${whereSql}
        ORDER BY a.attendance_date DESC, e.emp_code
        LIMIT 500`,
      params
    );

    return { summary, details };
  }

  async leaveReport({ year, department_id, status } = {}) {
    const where = [];
    const params = [];
    if (year) {
      where.push('YEAR(lr.from_date) = ?');
      params.push(year);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    if (status) {
      where.push('lr.status = ?');
      params.push(status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const summary = await query(
      `SELECT lt.leave_type_name, lr.status, COUNT(*) AS total, SUM(lr.days) AS total_days
         FROM leave_requests lr
         JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
         JOIN employees e ON e.employee_id = lr.employee_id
         ${whereSql}
        GROUP BY lt.leave_type_name, lr.status`,
      params
    );

    const details = await query(
      `SELECT lr.leave_request_id, lr.employee_id, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
              d.department_name, lt.leave_type_name, lr.from_date, lr.to_date, lr.days, lr.status, lr.applied_on
         FROM leave_requests lr
         JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
         JOIN employees e ON e.employee_id = lr.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         ${whereSql}
        ORDER BY lr.applied_on DESC
        LIMIT 500`,
      params
    );

    return { summary, details };
  }

  async payrollReport({ month, year, department_id } = {}) {
    const where = [];
    const params = [];
    if (month) {
      where.push('p.month = ?');
      params.push(month);
    }
    if (year) {
      where.push('p.year = ?');
      params.push(year);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const summary = await query(
      `SELECT p.month, p.year, COUNT(*) AS payslip_count,
              SUM(p.gross_earnings) AS total_gross, SUM(p.deductions) AS total_deductions, SUM(p.net_pay) AS total_net
         FROM payslips p
         JOIN employees e ON e.employee_id = p.employee_id
         ${whereSql}
        GROUP BY p.month, p.year
        ORDER BY p.year DESC, p.month DESC`,
      params
    );

    const details = await query(
      `SELECT p.payslip_id, p.employee_id, e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
              d.department_name, p.month, p.year, p.gross_earnings, p.deductions, p.net_pay, p.status
         FROM payslips p
         JOIN employees e ON e.employee_id = p.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         ${whereSql}
        ORDER BY p.year DESC, p.month DESC
        LIMIT 500`,
      params
    );

    return { summary, details };
  }

  async helpdeskReport({ from_date, to_date } = {}) {
    const where = [];
    const params = [];
    if (from_date) {
      where.push('t.created_at >= ?');
      params.push(from_date);
    }
    if (to_date) {
      where.push('t.created_at <= ?');
      params.push(to_date);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const byStatus = await query(
      `SELECT t.status, COUNT(*) AS total FROM helpdesk_tickets t ${whereSql} GROUP BY t.status`,
      params
    );
    const byCategory = await query(
      `SELECT t.category, COUNT(*) AS total FROM helpdesk_tickets t ${whereSql} GROUP BY t.category`,
      params
    );
    const byPriority = await query(
      `SELECT t.priority, COUNT(*) AS total FROM helpdesk_tickets t ${whereSql} GROUP BY t.priority`,
      params
    );

    return { byStatus, byCategory, byPriority };
  }

  async hiringReport() {
    const jobsByStatus = await query(`SELECT status, COUNT(*) AS total FROM jobs GROUP BY status`);
    const applicationsByStatus = await query(`SELECT status, COUNT(*) AS total FROM job_applications GROUP BY status`);
    const referralsByStatus = await query(`SELECT status, COUNT(*) AS total FROM referrals GROUP BY status`);
    const openJobs = await query(
      `SELECT j.job_id, j.title, d.department_name, j.status, j.posted_on, j.closing_date,
              (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.job_id) AS application_count
         FROM jobs j
         LEFT JOIN departments d ON d.department_id = j.department_id
        WHERE j.status = 'Open'
        ORDER BY j.posted_on DESC`
    );
    return { jobsByStatus, applicationsByStatus, referralsByStatus, openJobs };
  }

  async reviewReport({ review_type_id, status } = {}) {
    const where = [];
    const params = [];
    if (review_type_id) {
      where.push('r.review_type_id = ?');
      params.push(review_type_id);
    }
    if (status) {
      where.push('r.status = ?');
      params.push(status);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const byStatus = await query(
      `SELECT r.status, COUNT(*) AS total, AVG(r.overall_rating) AS avg_rating
         FROM reviews r ${whereSql} GROUP BY r.status`,
      params
    );

    const details = await query(
      `SELECT r.review_id, r.employee_id, CONCAT(e.first_name, ' ', IFNULL(e.last_name,'')) AS employee_name,
              rt.name AS review_type, r.status, r.overall_rating, r.due_date, r.submitted_on
         FROM reviews r
         JOIN employees e ON e.employee_id = r.employee_id
         JOIN review_types rt ON rt.review_type_id = r.review_type_id
         ${whereSql}
        ORDER BY r.due_date DESC
        LIMIT 500`,
      params
    );

    return { byStatus, details };
  }
}

module.exports = new ReportService();
