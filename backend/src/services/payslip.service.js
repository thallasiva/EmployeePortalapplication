const BaseService = require('./base.service');
const { callProcedure, readOuts, query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const notify = require('./mailNotify.service');
const { computeTdsSection } = require('../utils/taxCalculator');
const { rupeesInWords } = require('../utils/numberToWords');
const { calculateEarningsDeductionsBreakdown } = require('../utils/payslipBreakdown');
const { encryptSalaryFields, applyVisibility } = require('../utils/encryption');
const salaryAssignmentSvc = require('./salaryAssignment.service');








function isGratuityEligible(joiningDate, month, year) {
  if (!joiningDate) return false;
  const joined = new Date(joiningDate);

  const refDate = new Date(year, month - 1, 1);
  const msInDay = 86400000;
  const daysDiff = Math.floor((refDate - joined) / msInDay);

  return daysDiff >= 1700;
}






function buildFromStructure(components, ctx, gratuityEligible = true) {
  const earnings = components.
  filter((c) => c.category === 'Earning' && c.show_on_payslip !== 0 && !c._deferred).
  map((c) => {

    const isGratuity = /gratuity/i.test(c.component_name || '') || c.component_code === 'GRATUITY';
    const amount = !gratuityEligible && isGratuity ? 0 : c.monthly_amount || 0;
    return { label: (c.component_name || c.component_code).toUpperCase(), amount };
  }).
  filter((c) => c.amount > 0);

  const structDeductions = components.
  filter((c) => c.category === 'Deduction' && c.show_on_payslip !== 0 && !c._deferred).
  map((c) => ({ label: (c.component_name || c.component_code).toUpperCase(), amount: c.monthly_amount || 0 })).
  filter((c) => c.amount > 0);

  const basicMonthly = ctx.BASIC || 0;
  const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0);


  const pfWage = Math.min(basicMonthly, 15000);
  const pf = Math.round(pfWage * 0.12);
  const eps = Math.round(pfWage * 0.0833);
  const epf = Math.round(pfWage * 0.0367);
  const employerPf = eps + epf;
  const edli = Math.min(Math.round(pfWage * 0.005), 75);
  const esiApplicable = totalEarnings <= 21000;
  const esiEmployee = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;
  const esiEmployer = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;
  const professionalTax = totalEarnings <= 15000 ? 0 : totalEarnings <= 20000 ? 150 : 200;


  const deductions = [...structDeductions];
  const hasLabel = (lbl) => deductions.some((d) => d.label === lbl || d.label.replace(/\s+/g, '') === lbl.replace(/\s+/g, ''));

  if (!hasLabel('PF') && !hasLabel('EMP PF') && !hasLabel('EMPPF')) {
    deductions.push({ label: 'PF', amount: pf });
  }
  if (!hasLabel('ESI') && esiEmployee > 0) {
    deductions.push({ label: 'ESI', amount: esiEmployee });
  }
  if (!hasLabel('PROF TAX') && !hasLabel('PROFTAX') && !hasLabel('PROFESSIONAL TAX')) {
    deductions.push({ label: 'PROF TAX', amount: professionalTax });
  }
  if (!hasLabel('INCOME TAX') && !hasLabel('INCOMETAX') && !hasLabel('TDS')) {
    deductions.push({ label: 'INCOME TAX', amount: 0 });
  }

  return { earnings, deductions, totalEarnings, eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax, pf };
}

const MONTH_NAMES = [
'January', 'February', 'March', 'April', 'May', 'June',
'July', 'August', 'September', 'October', 'November', 'December'];


const formatINR = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

class PayslipService extends BaseService {
  constructor() {
    super('payslips', 'payslip_id', [
    'payroll_run_id', 'employee_id', 'month', 'year', 'basic', 'hra', 'allowances',
    'gross_earnings', 'ctc', 'deductions', 'net_pay', 'working_days', 'paid_days', 'lop_days', 'status']
    );
  }

  async list({ employee_id, month, year, status, department_id, payroll_run_id, limit, offset, reqUser } = {}) {
    const results = await callProcedure(
      'sp_list_payslips(?, ?, ?, ?, ?, ?, ?, ?)',
      [
      employee_id ?? null,
      month ?? null,
      year ?? null,
      status ?? null,
      department_id ?? null,
      payroll_run_id ?? null,
      limit != null ? Number(limit) : null,
      limit != null ? Number(offset || 0) : null]

    );
    const rows = results[0] ?? [];
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


    let earnings, deductions, totalEarnings, eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax;


    const gratuityEligible = isGratuityEligible(row.emp_joining_date, row.month, row.year);

    try {
      const structured = await salaryAssignmentSvc.computePayslipBreakdown(row.emp_id);
      if (structured && structured.components?.length) {
        ({ earnings, deductions, totalEarnings, eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax } =
        buildFromStructure(structured.components, structured.ctx, gratuityEligible));
      }
    } catch {}


    if (!earnings) {
      const basic = Number(row.basic) || 0;
      ({ earnings, deductions, totalEarnings, eps, epf, employerPf, edli, esiEmployee, esiEmployer, professionalTax } =
      calculateEarningsDeductionsBreakdown(basic));

      if (!gratuityEligible) {
        const gIdx = earnings.findIndex((e) => /gratuity/i.test(e.label));
        if (gIdx !== -1) earnings[gIdx].amount = 0;
      }
    }

    const pfMonthly = deductions.find((d) => d.label === 'PF' || d.label === 'EMP PF')?.amount || 0;
    const professionTaxMonthly = deductions.find((d) => /prof/i.test(d.label))?.amount || 0;

    const regimeRows = await query('SELECT tax_regime FROM employees WHERE employee_id = ? LIMIT 1', [row.emp_id]);
    const proofRows = await query(`SELECT p.section_key, p.investment_type, p.actual_amount
      FROM it_proof_documents p
      WHERE p.employee_id = ? AND p.status = 'verified'`, [row.emp_id]);
    const tds = computeTdsSection({
      earnings, pfMonthly, professionTaxMonthly, approvedProofs: proofRows,
      taxRegime: regimeRows[0]?.tax_regime || 'old', month: row.month, year: row.year
    });

    const incomeTaxDeduction = deductions.find((d) => /income.?tax|tds/i.test(d.label));
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
        pf_number: row.pf_number || '-'
      },
      bank: {
        bank_name: row.bank_name || '-',
        account_number: row.account_number || '-',
        pan_number: row.pan_number || '-',
        uan_number: row.uan_number || '-'
      },
      company: {
        company_name: row.company_name || 'NAT IT Services',
        address: row.company_address || ''
      },
      earnings,
      deductions,
      total_earnings: totalEarnings,
      total_deductions: totalDeductions,
      net_pay: netSalary,
      net_pay_words: rupeesInWords(netSalary),
      ctc: Number(row.ctc) > 0 ? Number(row.ctc) : totalEarnings + employerPf + edli + esiEmployer,
      eps, epf, edli, esi_employer: esiEmployer, tds
    };
  }

  async generate({ employee_id, month, year, payroll_run_id }) {
    await callProcedure('sp_generate_payslip(?, ?, ?, ?, @payslip_id)', [
    employee_id, month, year, payroll_run_id || null]
    );
    const out = await readOuts('payslip_id');
    const payslipId = out[0].payslip_id;
    if (!payslipId) throw ApiError.internal('Failed to generate payslip');

    const approvedInputs = await query(`SELECT COALESCE(SUM(amount),0) AS total FROM payroll_inputs
      WHERE employee_id=? AND month=? AND year=? AND status='APPROVED'`, [employee_id, month, year]);
    const variableEarnings = Number(approvedInputs[0]?.total || 0);
    if (variableEarnings > 0) {
      await query(`UPDATE payslips SET gross_earnings = gross_earnings + ?, net_pay = net_pay + ? WHERE payslip_id=?`,
        [variableEarnings, variableEarnings, payslipId]);
    }


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


        notify.payslipReleased({
          employeeEmail: emp.email,
          employeeName: emp.employee_name.trim(),
          empCode: emp.emp_code || '',
          month: monthLabel,
          year: Number(year),
          grossSalary: payslip.gross_earnings,
          deductions: payslip.deductions,
          netSalary: payslip.net_pay
        });
        emailed += 1;
        genResults.push({
          employee_id: emp.employee_id, emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(), email: emp.email,
          payslip_id: payslip.payslip_id, emailed: true, error: null
        });
      } catch (err) {
        genResults.push({
          employee_id: emp.employee_id, emp_code: emp.emp_code,
          employee_name: emp.employee_name.trim(), email: emp.email,
          emailed: false, error: err.message
        });
      }
    }

    return { month: Number(month), year: Number(year), generated, emailed, results: genResults };
  }
}

module.exports = new PayslipService();
