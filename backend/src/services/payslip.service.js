const BaseService = require('./base.service');
const { query, callProcedure } = require('../config/db');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const { computeTdsSection } = require('../utils/taxCalculator');
const { rupeesInWords } = require('../utils/numberToWords');
const { calculateEarningsDeductionsBreakdown } = require('../utils/payslipBreakdown');
const { encryptSalaryFields, applyVisibility, maskSalaryRow } = require('../utils/encryption');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const LIST_SELECT = `
  SELECT p.*,
         ROUND(p.gross_earnings + LEAST(p.basic, 15000) * 0.12, 2) AS ctc_computed,
         e.emp_code, CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS employee_name,
         d.department_name, des.designation_name
    FROM payslips p
    JOIN employees e ON e.employee_id = p.employee_id
    LEFT JOIN departments d ON d.department_id = e.department_id
    LEFT JOIN designations des ON des.designation_id = e.designation_id
`;

class PayslipService extends BaseService {
  constructor() {
    super('payslips', 'payslip_id', [
      'payroll_run_id', 'employee_id', 'month', 'year', 'basic', 'hra', 'allowances',
      'gross_earnings', 'ctc', 'deductions', 'net_pay', 'working_days', 'paid_days', 'lop_days', 'status',
    ]);
  }

  async list({ employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser } = {}) {
    const where = [];
    const params = [];

    if (employee_id) {
      where.push('p.employee_id = ?');
      params.push(employee_id);
    }
    if (month) {
      where.push('p.month = ?');
      params.push(month);
    }
    if (year) {
      where.push('p.year = ?');
      params.push(year);
    }
    if (status) {
      where.push('p.status = ?');
      params.push(status);
    }
    if (department_id) {
      where.push('e.department_id = ?');
      params.push(department_id);
    }
    if (payroll_run_id) {
      where.push('p.payroll_run_id = ?');
      params.push(payroll_run_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    let sql = `${LIST_SELECT} ${whereSql} ORDER BY p.year DESC, p.month DESC, e.first_name ASC`;
    if (limit !== undefined) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const rows = await query(sql, params);
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM payslips p JOIN employees e ON e.employee_id = p.employee_id ${whereSql}`,
      where.length ? params.slice(0, params.length - (limit !== undefined ? 2 : 0)) : []
    );

    // Normalise CTC and apply salary visibility based on requesting user
    const normalised = rows.map((r) => {
      const ctc = Number(r.ctc) > 0 ? Number(r.ctc) : Number(r.ctc_computed) || 0;
      const { ctc_computed, ...rest } = r;
      const normalRow = { ...rest, ctc };
      // Each employee can see their own payslip; admins see all; others get masked
      return applyVisibility(normalRow, reqUser, r.employee_id);
    });

    return { rows: normalised, total: countRows[0]?.total || 0 };
  }

  async getDetails(id) {
    const rows = await query(`${LIST_SELECT} WHERE p.payslip_id = ?`, [id]);
    return rows[0] || null;
  }

  /**
   * Assembles all data needed to render a full printable payslip (matching
   * the company's standard payslip layout, including the simplified TDS /
   * Income Tax Deduction / Tax Paid Details sections).
   *
   * @returns {object|null} full payslip view-model, or null if not found
   */
  async getFullDetails(id) {
    const rows = await query(
      `SELECT p.*,
              e.emp_code, e.first_name, e.last_name, e.emp_job_title, e.location,
              e.pf_number, e.employee_id AS emp_id,
              d.department_name, d.company_id,
              des.designation_name,
              c.company_name, c.address AS company_address,
              b.bank_name, b.account_number, b.pan_number, b.uan_number
         FROM payslips p
         JOIN employees e ON e.employee_id = p.employee_id
         LEFT JOIN departments d ON d.department_id = e.department_id
         LEFT JOIN designations des ON des.designation_id = e.designation_id
         LEFT JOIN companies c ON c.company_id = d.company_id
         LEFT JOIN employee_bank_details b ON b.employee_id = e.employee_id
        WHERE p.payslip_id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;

    const basic = Number(row.basic) || 0;

    // --- Earnings / Deductions breakdown ---
    const {
      earnings, deductions, totalEarnings,
      eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax,
    } = calculateEarningsDeductionsBreakdown(basic);

    const pfMonthly = deductions.find((d) => d.label === 'PF')?.amount || 0;
    const professionTaxMonthly = deductions.find((d) => d.label === 'PROF TAX')?.amount || 0;

    const tds = computeTdsSection({
      earnings,
      pfMonthly,
      professionTaxMonthly,
      month: row.month,
      year: row.year,
    });

    // The "INCOME TAX" deduction line item (used by both the on-screen pie
    // chart and the PDF's Deductions table) and the TDS section's "Monthly
    // Projected Tax" figure are computed via the same formula from the same
    // inputs (annualised gross earnings, PF, standard deduction, slab tax +
    // cess). Use the TDS section's value as the single source of truth so
    // the two sections of the payslip always agree exactly.
    const incomeTaxDeduction = deductions.find((d) => d.label === 'INCOME TAX');
    if (incomeTaxDeduction) {
      incomeTaxDeduction.amount = tds.incomeTax.monthlyProjectedTax;
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = Math.max(0, totalEarnings - totalDeductions);

    return {
      payslip_id: row.payslip_id,
      month: row.month,
      month_name: MONTH_NAMES[Number(row.month) - 1] || row.month,
      year: row.year,
      status: row.status,
      working_days: row.working_days,
      paid_days: row.paid_days,
      lop_days: row.lop_days,
      employee: {
        employee_id: row.emp_id,
        emp_code: row.emp_code,
        employee_name: `${row.first_name} ${row.last_name || ''}`.trim(),
        designation_name: row.designation_name || '-',
        department_name: row.department_name || '-',
        location: row.location || '-',
        pf_number: row.pf_number || '-',
      },
      bank: {
        bank_name: row.bank_name || '-',
        account_number: row.account_number || '-',
        pan_number: row.pan_number || '-',
        uan_number: row.uan_number || '-',
      },
      company: {
        company_name: row.company_name || 'NAT IT Services',
        address: row.company_address || '',
      },
      earnings,
      deductions,
      total_earnings: totalEarnings,
      total_deductions: totalDeductions,
      net_pay: netSalary,
      net_pay_words: rupeesInWords(netSalary),
      // CTC: prefer value stored by sp_generate_payslip (migration 007+);
      // fall back to gross + all employer costs for older payslips.
      ctc: Number(row.ctc) > 0 ? Number(row.ctc) : totalEarnings + employerPf + edli + esiEmployer,
      // Employer statutory contributions (for payslip CTC section)
      eps,
      epf,
      edli,
      esi_employer: esiEmployer,
      tds,
    };
  }

  /**
   * Generates (or refreshes) a single employee's payslip for a month/year
   * via sp_generate_payslip. Encrypts salary fields after generation.
   */
  async generate({ employee_id, month, year, payroll_run_id }) {
    await callProcedure('sp_generate_payslip(?, ?, ?, ?, @payslip_id)', [
      employee_id, month, year, payroll_run_id || null,
    ]);
    const out = await query('SELECT @payslip_id AS payslip_id');
    const payslipId = out[0].payslip_id;
    if (!payslipId) throw ApiError.internal('Failed to generate payslip');

    // Encrypt salary fields then NULL out plaintext columns
    const row = await query('SELECT * FROM payslips WHERE payslip_id = ?', [payslipId]);
    if (row[0]) {
      const encrypted = encryptSalaryFields(row[0]);
      if (encrypted) {
        await query(
          `UPDATE payslips SET
             salary_encrypted = ?,
             basic = NULL, hra = NULL, allowances = NULL,
             gross_earnings = NULL, ctc = NULL,
             deductions = NULL, net_pay = NULL
           WHERE payslip_id = ?`,
          [encrypted, payslipId]
        );
      }
    }

    return this.getDetails(payslipId);
  }

  async markPaid(id) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Payslip not found');
    await query('UPDATE payslips SET status = ? WHERE payslip_id = ?', ['Paid', id]);
    return this.getDetails(id);
  }

  /**
   * Generates payslips for every active employee for the given month/year
   * and emails each employee their payslip summary via SMTP.
   *
   * @param {{month: number, year: number, processed_by?: number}} params
   * @returns {{ month: number, year: number, generated: number, emailed: number,
   *   results: {employee_id: number, emp_code: string, employee_name: string,
   *     email: string, payslip_id?: number, emailed: boolean, error?: string}[] }}
   */
  async generateAllAndNotify({ month, year }) {
    const employees = await query(
      `SELECT employee_id, emp_code, email, CONCAT(first_name, ' ', IFNULL(last_name, '')) AS employee_name
         FROM employees
        WHERE employee_status = 'Active'`
    );

    const monthLabel = MONTH_NAMES[Number(month) - 1] || month;
    const results = [];
    let generated = 0;
    let emailed = 0;

    for (const emp of employees) {
      try {
        const payslip = await this.generate({ employee_id: emp.employee_id, month, year, payroll_run_id: null });
        generated += 1;

        const html = `
          <h2>Payslip for ${monthLabel} ${year}</h2>
          <p>Dear ${emp.employee_name.trim()},</p>
          <p>Your payslip for <strong>${monthLabel} ${year}</strong> has been generated. Here is a summary:</p>
          <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">
            <tr><td>Basic</td><td>${formatINR(payslip.basic)}</td></tr>
            <tr><td>HRA</td><td>${formatINR(payslip.hra)}</td></tr>
            <tr><td>Allowances</td><td>${formatINR(payslip.allowances)}</td></tr>
            <tr><td><strong>Gross Earnings</strong></td><td><strong>${formatINR(payslip.gross_earnings)}</strong></td></tr>
            <tr><td>Deductions</td><td>${formatINR(payslip.deductions)}</td></tr>
            <tr><td><strong>Net Pay</strong></td><td><strong>${formatINR(payslip.net_pay)}</strong></td></tr>
            <tr><td>Paid Days</td><td>${payslip.paid_days} / ${payslip.working_days}</td></tr>
          </table>
          <p>You can view the full payslip by logging into the HRMS portal.</p>
        `;

        const mailResult = await emailService.sendMail({
          to: emp.email,
          subject: `Payslip for ${monthLabel} ${year}`,
          html,
        });

        if (mailResult.sent) emailed += 1;

        results.push({
          employee_id: emp.employee_id,
          emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(),
          email: emp.email,
          payslip_id: payslip.payslip_id,
          emailed: mailResult.sent,
          error: mailResult.error,
        });
      } catch (err) {
        results.push({
          employee_id: emp.employee_id,
          emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(),
          email: emp.email,
          emailed: false,
          error: err.message,
        });
      }
    }

    return { month: Number(month), year: Number(year), generated, emailed, results };
  }
}

module.exports = new PayslipService();
