const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');

function requireCompanyId(companyId) {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.forbidden('Company context is required');
  }
  return id;
}

class ReportService {
  async employeeSummary(companyId) {
    const company = requireCompanyId(companyId);
    const [byStatus, byDepartment, byType] = await Promise.all([
      query(
        `SELECT employee_status AS status, COUNT(*) AS total
           FROM employees
          WHERE company_id = ?
          GROUP BY employee_status`,
        [company]
      ),
      query(
        `SELECT d.department_id, d.department_name, COUNT(e.employee_id) AS total
           FROM departments d
           LEFT JOIN employees e
             ON e.department_id = d.department_id
            AND e.company_id = ?
            AND e.employee_status = 'Active'
          WHERE d.company_id = ?
             OR (d.company_id IS NULL AND EXISTS (
                  SELECT 1 FROM employees e2
                   WHERE e2.department_id = d.department_id
                     AND e2.company_id = ?
                ))
          GROUP BY d.department_id, d.department_name
          ORDER BY d.department_name`,
        [company, company, company]
      ),
      query(
        `SELECT employee_type, COUNT(*) AS total
           FROM employees
          WHERE company_id = ? AND employee_status = 'Active'
          GROUP BY employee_type`,
        [company]
      )
    ]);
    return { byStatus, byDepartment, byType };
  }

  async attendanceReport({ from_date, to_date, department_id } = {}, companyId) {
    const company = requireCompanyId(companyId);
    const from = from_date ?? null;
    const to = to_date ?? null;
    const department = department_id ?? null;
    const filters = [company, from, from, to, to, department, department];
    const [summary, details] = await Promise.all([
      query(
        `SELECT a.status, COUNT(*) AS total
           FROM attendance a
           JOIN employees e ON e.employee_id = a.employee_id
          WHERE e.company_id = ?
            AND (? IS NULL OR a.attendance_date >= ?)
            AND (? IS NULL OR a.attendance_date <= ?)
            AND (? IS NULL OR e.department_id = ?)
          GROUP BY a.status`,
        filters
      ),
      query(
        `SELECT a.attendance_id, a.employee_id, e.emp_code,
                CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                d.department_name, a.attendance_date, a.check_in, a.check_out,
                a.work_hours, a.late_by_minutes, a.status
           FROM attendance a
           JOIN employees e ON e.employee_id = a.employee_id
           LEFT JOIN departments d
             ON d.department_id = e.department_id
            AND (d.company_id = e.company_id OR d.company_id IS NULL)
          WHERE e.company_id = ?
            AND (? IS NULL OR a.attendance_date >= ?)
            AND (? IS NULL OR a.attendance_date <= ?)
            AND (? IS NULL OR e.department_id = ?)
          ORDER BY a.attendance_date DESC, e.emp_code
          LIMIT 500`,
        filters
      )
    ]);
    return { summary, details };
  }

  async leaveReport({ year, department_id, status } = {}, companyId) {
    const company = requireCompanyId(companyId);
    const filters = [company, year ?? null, year ?? null, department_id ?? null, department_id ?? null, status ?? null, status ?? null];
    const [summary, details] = await Promise.all([
      query(
        `SELECT lt.leave_type_name, lr.status, COUNT(*) AS total, SUM(lr.days) AS total_days
           FROM leave_requests lr
           JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
           JOIN employees e ON e.employee_id = lr.employee_id
          WHERE e.company_id = ?
            AND (? IS NULL OR YEAR(lr.from_date) = ?)
            AND (? IS NULL OR e.department_id = ?)
            AND (? IS NULL OR lr.status = ?)
          GROUP BY lt.leave_type_name, lr.status`,
        filters
      ),
      query(
        `SELECT lr.leave_request_id, lr.employee_id, e.emp_code,
                CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                d.department_name, lt.leave_type_name, lr.from_date, lr.to_date,
                lr.days, lr.status, lr.applied_on
           FROM leave_requests lr
           JOIN leave_types lt ON lt.leave_type_id = lr.leave_type_id
           JOIN employees e ON e.employee_id = lr.employee_id
           LEFT JOIN departments d
             ON d.department_id = e.department_id
            AND (d.company_id = e.company_id OR d.company_id IS NULL)
          WHERE e.company_id = ?
            AND (? IS NULL OR YEAR(lr.from_date) = ?)
            AND (? IS NULL OR e.department_id = ?)
            AND (? IS NULL OR lr.status = ?)
          ORDER BY lr.applied_on DESC
          LIMIT 500`,
        filters
      )
    ]);
    return { summary, details };
  }

  async payrollReport({ month, year, department_id } = {}, companyId) {
    const company = requireCompanyId(companyId);
    const filters = [company, month ?? null, month ?? null, year ?? null, year ?? null, department_id ?? null, department_id ?? null];
    const [summary, details] = await Promise.all([
      query(
        `SELECT p.month, p.year, COUNT(*) AS payslip_count,
                SUM(p.gross_earnings) AS total_gross,
                SUM(p.deductions) AS total_deductions,
                SUM(p.net_pay) AS total_net
           FROM payslips p
           JOIN employees e ON e.employee_id = p.employee_id
          WHERE e.company_id = ?
            AND (? IS NULL OR p.month = ?)
            AND (? IS NULL OR p.year = ?)
            AND (? IS NULL OR e.department_id = ?)
          GROUP BY p.month, p.year
          ORDER BY p.year DESC, p.month DESC`,
        filters
      ),
      query(
        `SELECT p.payslip_id, p.employee_id, e.emp_code,
                CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                d.department_name, p.month, p.year, p.gross_earnings,
                p.deductions, p.net_pay, p.status
           FROM payslips p
           JOIN employees e ON e.employee_id = p.employee_id
           LEFT JOIN departments d
             ON d.department_id = e.department_id
            AND (d.company_id = e.company_id OR d.company_id IS NULL)
          WHERE e.company_id = ?
            AND (? IS NULL OR p.month = ?)
            AND (? IS NULL OR p.year = ?)
            AND (? IS NULL OR e.department_id = ?)
          ORDER BY p.year DESC, p.month DESC
          LIMIT 500`,
        filters
      )
    ]);
    return { summary, details };
  }

  async helpdeskReport({ from_date, to_date } = {}, companyId) {
    const company = requireCompanyId(companyId);
    const filters = [company, from_date ?? null, from_date ?? null, to_date ?? null, to_date ?? null];
    const [byStatus, byCategory, byPriority] = await Promise.all(
      ['status', 'category', 'priority'].map((column) =>
        query(
          `SELECT t.${column}, COUNT(*) AS total
             FROM helpdesk_tickets t
             JOIN employees e ON e.employee_id = t.employee_id
            WHERE e.company_id = ?
              AND (? IS NULL OR t.created_at >= ?)
              AND (? IS NULL OR t.created_at <= ?)
            GROUP BY t.${column}`,
          filters
        )
      )
    );
    return { byStatus, byCategory, byPriority };
  }

  async hiringReport(companyId) {
    const company = requireCompanyId(companyId);
    const [jobsByStatus, applicationsByStatus, referralsByStatus, openJobs] = await Promise.all([
      query(
        `SELECT j.status, COUNT(*) AS total
           FROM jobs j
           LEFT JOIN departments d ON d.department_id = j.department_id
           LEFT JOIN employees creator ON creator.employee_id = j.created_by
          WHERE COALESCE(d.company_id, creator.company_id) = ?
          GROUP BY j.status`,
        [company]
      ),
      query(
        `SELECT a.status, COUNT(*) AS total
           FROM job_applications a
           JOIN jobs j ON j.job_id = a.job_id
           LEFT JOIN departments d ON d.department_id = j.department_id
           LEFT JOIN employees creator ON creator.employee_id = j.created_by
          WHERE COALESCE(d.company_id, creator.company_id) = ?
          GROUP BY a.status`,
        [company]
      ),
      query(
        `SELECT r.status, COUNT(*) AS total
           FROM referrals r
           JOIN jobs j ON j.job_id = r.job_id
           LEFT JOIN departments d ON d.department_id = j.department_id
           LEFT JOIN employees creator ON creator.employee_id = j.created_by
          WHERE COALESCE(d.company_id, creator.company_id) = ?
          GROUP BY r.status`,
        [company]
      ),
      query(
        `SELECT j.job_id, j.title, d.department_name, j.status, j.posted_on, j.closing_date,
                (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.job_id) AS application_count
           FROM jobs j
           LEFT JOIN departments d ON d.department_id = j.department_id
           LEFT JOIN employees creator ON creator.employee_id = j.created_by
          WHERE j.status = 'Open'
            AND COALESCE(d.company_id, creator.company_id) = ?
          ORDER BY j.posted_on DESC`,
        [company]
      )
    ]);
    return { jobsByStatus, applicationsByStatus, referralsByStatus, openJobs };
  }

  async reviewReport({ review_type_id, status } = {}, companyId) {
    const company = requireCompanyId(companyId);
    const filters = [company, review_type_id ?? null, review_type_id ?? null, status ?? null, status ?? null];
    const [byStatus, details] = await Promise.all([
      query(
        `SELECT r.status, COUNT(*) AS total, AVG(r.overall_rating) AS avg_rating
           FROM reviews r
           JOIN employees e ON e.employee_id = r.employee_id
          WHERE e.company_id = ?
            AND (? IS NULL OR r.review_type_id = ?)
            AND (? IS NULL OR r.status = ?)
          GROUP BY r.status`,
        filters
      ),
      query(
        `SELECT r.review_id, r.employee_id,
                CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
                rt.name AS review_type, r.status, r.overall_rating, r.due_date, r.submitted_on
           FROM reviews r
           JOIN employees e ON e.employee_id = r.employee_id
           JOIN review_types rt ON rt.review_type_id = r.review_type_id
          WHERE e.company_id = ?
            AND (? IS NULL OR r.review_type_id = ?)
            AND (? IS NULL OR r.status = ?)
          ORDER BY r.due_date DESC
          LIMIT 500`,
        filters
      )
    ]);
    return { byStatus, details };
  }
}

module.exports = new ReportService();
