'use strict';
const { query } = require('../config/db');
const payrollAttendanceService = require('./payrollAttendance.service');
const ApiError = require('../utils/ApiError');

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

class PayrollDashboardService {
  async overview({ month, year, companyId }) {
    const company = Number(companyId);
    const m = Number(month), y = Number(year);
    if (!Number.isInteger(company) || company <= 0) throw ApiError.forbidden('Company context is required');
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2000 || y > 2100) {
      throw ApiError.badRequest('A valid payroll month and year are required');
    }

    const [summary, runs, pendingApprovals, historical, paymentRows, activities] = await Promise.all([
      payrollAttendanceService.getMonthSummary({ month: m, year: y, includeDays: false, companyId: company }),
      query(`SELECT payroll_run_id, month, year, status, review_status, is_locked, total_amount,
                    payment_exported_at, processed_on, processed_by
               FROM payroll_runs WHERE company_id=?
              ORDER BY year DESC, month DESC, payroll_run_id DESC LIMIT 12`, [company]),
      query(`SELECT COUNT(*) AS count FROM payroll_runs
              WHERE company_id=? AND month=? AND year=? AND review_status='PENDING_REVIEW'`, [company, m, y]),
      this._history(company, y, m),
      this._payments(company, m, y),
      query(`SELECT a.action, a.created_at, a.user_id, a.result,
                    CONCAT(e.first_name,' ',IFNULL(e.last_name,'')) AS performed_by_name
               FROM audit_logs a
               LEFT JOIN employees e ON e.employee_id=a.user_id AND e.company_id=a.company_id
              WHERE a.company_id=? AND a.action LIKE '%PAYROLL%'
              ORDER BY a.created_at DESC LIMIT 12`, [company]),
    ]);

    const departmentMap = new Map();
    const componentMap = new Map();
    const exceptionMap = new Map();
    let employerContributionTotal = 0;
    for (const employee of summary.employees) {
      const pay = employee.pay;
      if (pay && !employee.on_hold) {
        const department = employee.department || 'Unassigned';
        const departmentTotal = departmentMap.get(department) || { department, employees: 0, gross: 0, net: 0, employerContributions: 0 };
        departmentTotal.employees += 1;
        departmentTotal.gross += Number(pay.gross || 0);
        departmentTotal.net += Number(pay.net || 0);
        for (const item of pay.employerContributions || []) {
          departmentTotal.employerContributions += Number(item.amount || 0);
          employerContributionTotal += Number(item.amount || 0);
          const key = `employer:${item.code || item.label}`;
          const component = componentMap.get(key) || { code: item.code, label: item.label, category: 'Employer Contribution', amount: 0 };
          component.amount += Number(item.amount || 0);
          componentMap.set(key, component);
        }
        departmentMap.set(department, departmentTotal);
        for (const item of pay.earnings || []) {
          const key = `earning:${item.code || item.label}`;
          const component = componentMap.get(key) || { code: item.code, label: item.label, category: 'Earning', amount: 0 };
          component.amount += Number(item.amount || 0);
          componentMap.set(key, component);
        }
        for (const item of pay.deductions || []) {
          const key = `deduction:${item.code || item.label}`;
          const component = componentMap.get(key) || { code: item.code, label: item.label, category: 'Deduction', amount: 0 };
          component.amount += Number(item.amount || 0);
          componentMap.set(key, component);
        }
      }
      for (const flag of employee.flags || []) {
        if (['MONTH_NOT_OVER', 'NEW_JOINER', 'EXITING'].includes(flag.code)) continue;
        const count = exceptionMap.get(flag.code) || { code: flag.code, label: flag.label, employees: 0 };
        count.employees += 1;
        exceptionMap.set(flag.code, count);
      }
    }

    const activeRun = summary.run;
    return {
      period: { month: m, year: y, start: summary.period.start, end: summary.period.end },
      currency: summary.policy?.currency_code || 'INR',
      totals: {
        totalEmployees: summary.totals.employees,
        eligibleEmployees: summary.totals.payable,
        onHoldEmployees: summary.totals.onHold,
        employeesWithoutSalary: summary.totals.withoutSalary,
        gross: money(summary.totals.gross),
        net: money(summary.totals.net),
        deductions: money(summary.totals.deductions),
        employerContributions: money(employerContributionTotal),
        pendingApprovals: Number(pendingApprovals[0]?.count || 0),
        payrollStatus: activeRun?.review_status || activeRun?.status || 'NOT_STARTED',
        exceptions: summary.totals.withIssues,
        pendingPayments: Number(paymentRows?.pending || 0),
        failedPayments: Number(paymentRows?.failed || 0),
        paidPayments: Number(paymentRows?.paid || 0),
        paymentTrackingAvailable: paymentRows?.available !== false,
      },
      departments: [...departmentMap.values()].map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'number' ? money(value) : value]))).sort((a, b) => b.gross - a.gross),
      components: [...componentMap.values()].map((row) => ({ ...row, amount: money(row.amount) })).sort((a, b) => b.amount - a.amount),
      exceptions: [...exceptionMap.values()].sort((a, b) => b.employees - a.employees),
      trends: historical.map((row) => ({ ...row, monthLabel: new Date(Number(row.year), Number(row.month) - 1, 1).toLocaleString('en-IN', { month: 'short' }) })),
      history: runs,
      activities,
      paymentBatch: paymentRows?.payment_batch_id ? {
        payment_batch_id: paymentRows.payment_batch_id,
        batch_reference: paymentRows.batch_reference,
        status: paymentRows.status,
      } : null,
    };
  }

  async _history(companyId, year, month) {
    const start = new Date(year, month - 6, 1);
    const fromYear = start.getFullYear();
    const fromMonth = start.getMonth() + 1;
    return query(
      `SELECT p.year, p.month, COUNT(*) AS employees,
              COALESCE(SUM(p.gross_earnings),0) AS gross,
              COALESCE(SUM(p.deductions),0) AS deductions,
              COALESCE(SUM(p.net_pay),0) AS net
         FROM payslips p
         JOIN employees e ON e.employee_id=p.employee_id AND e.company_id=?
        WHERE (p.year>? OR (p.year=? AND p.month>=?))
          AND (p.year<? OR (p.year=? AND p.month<=?))
        GROUP BY p.year, p.month ORDER BY p.year, p.month`,
      [companyId, fromYear, fromYear, fromMonth, year, year, month]
    ).then((rows) => rows.map((row) => ({
      year: Number(row.year), month: Number(row.month), employees: Number(row.employees),
      gross: money(row.gross), deductions: money(row.deductions), net: money(row.net),
    })));
  }

  async _payments(companyId, month, year) {
    try {
      const rows = await query(
        `SELECT b.payment_batch_id, b.batch_reference, b.status,
                SUM(i.status IN ('PENDING','PARTIAL')) AS pending, SUM(i.status='FAILED') AS failed, SUM(i.status='PAID') AS paid
           FROM payroll_payment_batches b
           JOIN payroll_runs r ON r.payroll_run_id=b.payroll_run_id AND r.company_id=b.company_id
           LEFT JOIN payroll_payment_items i ON i.payment_batch_id=b.payment_batch_id
          WHERE b.company_id=? AND r.month=? AND r.year=?
          GROUP BY b.payment_batch_id LIMIT 1`,
        [companyId, month, year]
      );
      return rows.length ? { ...rows[0], pending: Number(rows[0].pending || 0), failed: Number(rows[0].failed || 0), paid: Number(rows[0].paid || 0), available: true } : { pending: 0, failed: 0, paid: 0, available: true };
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE') return { pending: 0, failed: 0, paid: 0, available: false, batch: null };
      throw error;
    }
  }
}

module.exports = new PayrollDashboardService();
