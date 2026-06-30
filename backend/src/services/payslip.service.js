const BaseService = require('./base.service');
const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const { computeTdsSection } = require('../utils/taxCalculator');
const { rupeesInWords } = require('../utils/numberToWords');
const { calculateEarningsDeductionsBreakdown } = require('../utils/payslipBreakdown');
const { encryptSalaryFields, applyVisibility } = require('../utils/encryption');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatINR = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

class PayslipService extends BaseService {
  constructor() {
    super('payslips', 'payslip_id', [
      'payroll_run_id', 'employee_id', 'month', 'year', 'basic', 'hra', 'allowances',
      'gross_earnings', 'ctc', 'deductions', 'net_pay', 'working_days', 'paid_days', 'lop_days', 'status',
    ]);
  }

  async list({ employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser } = {}) {
    const results = await callProcedure(
      'sp_list_payslips(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employee_id    ?? null,
        month          ?? null,
        year           ?? null,
        status         ?? null,
        department_id  ?? null,
        payroll_run_id ?? null,
        limit != null ? Number(limit)       : null,
        limit != null ? Number(offset || 0) : null,
      ]
    );
    const rows  = results[0] ?? [];
    const total = (results[1] ?? [])[0]?.total ?? 0;

    const normalised = rows.map((r) => {
      const ctc = Number(r.ctc) > 0 ? Number(r.ctc) : Number(r.ctc_computed) || 0;
      const { ctc_computed, ...rest } = r;
      const normalRow = { ...rest, ctc };
      return applyVisibility(normalRow, reqUser, r.employee_id);
    });

    return { rows: normalised, total };
  }

  async getDetails(id) {
    const results = await callProcedure('sp_get_payslip(?)', [id]);
    const row = (results[0] ?? [])[0] ?? null;
    if (!row) return null;
    const ctc = Number(row.ctc) > 0 ? Number(row.ctc) : Number(row.ctc_computed) || 0;
    const { ctc_computed, ...rest } = row;
    return { ...rest, ctc };
  }

  async getFullDetails(id) {
    const results = await callProcedure('sp_get_payslip_full(?)', [id]);
    const row = (results[0] ?? [])[0] ?? null;
    if (!row) return null;

    const basic = Number(row.basic) || 0;
    const {
      earnings, deductions, totalEarnings,
      eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax,
    } = calculateEarningsDeductionsBreakdown(basic);

    const pfMonthly = deductions.find((d) => d.label === 'PF')?.amount || 0;
    const professionTaxMonthly = deductions.find((d) => d.label === 'PROF TAX')?.amount || 0;

    const tds = computeTdsSection({
      earnings, pfMonthly, professionTaxMonthly, month: row.month, year: row.year,
    });

    const incomeTaxDeduction = deductions.find((d) => d.label === 'INCOME TAX');
    if (incomeTaxDeduction) incomeTaxDeduction.amount = tds.incomeTax.monthlyProjectedTax;

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
      ctc: Number(row.ctc) > 0 ? Number(row.ctc) : totalEarnings + employerPf + edli + esiEmployer,
      eps, epf, edli, esi_employer: esiEmployer, tds,
    };
  }

  async generate({ employee_id, month, year, payroll_run_id }) {
    await callProcedure('sp_generate_payslip(?, ?, ?, ?, @payslip_id)', [
      employee_id, month, year, payroll_run_id || null,
    ]);
    const out = await readOuts('payslip_id');
    const payslipId = out[0].payslip_id;
    if (!payslipId) throw ApiError.internal('Failed to generate payslip');

    // Fetch raw payslip and encrypt salary fields
    const rawResults = await callProcedure('sp_get_payslip_raw(?)', [payslipId]);
    const rawRow = (rawResults[0] ?? [])[0] ?? null;
    if (rawRow) {
      const encrypted = encryptSalaryFields(rawRow);
      if (encrypted) {
        await callProcedure('sp_update_payslip_encrypted(?, ?)', [payslipId, encrypted]);
      }
    }

    return this.getDetails(payslipId);
  }

  async markPaid(id) {
    const exists = await this.existsById(id);
    if (!exists) throw ApiError.notFound('Payslip not found');
    await callProcedure('sp_mark_payslip_paid(?)', [id]);
    return this.getDetails(id);
  }

  async generateAllAndNotify({ month, year }) {
    const results = await callProcedure('sp_get_active_employees_basic()');
    const employees = results[0] ?? [];

    const monthLabel = MONTH_NAMES[Number(month) - 1] || month;
    const genResults = [];
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
        genResults.push({
          employee_id: emp.employee_id, emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(), email: emp.email,
          payslip_id: payslip.payslip_id, emailed: mailResult.sent, error: mailResult.error,
        });
      } catch (err) {
        genResults.push({
          employee_id: emp.employee_id, emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(), email: emp.email,
          emailed: false, error: err.message,
        });
      }
    }

    return { month: Number(month), year: Number(year), generated, emailed, results: genResults };
  }
}

module.exports = new PayslipService();
