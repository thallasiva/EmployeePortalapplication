/**
 * salaryBreakdown.js
 *
 * Single source of truth for salary component calculation.
 * Priority: payslip actuals > salary_structure values > statutory / percentage fallback.
 *
 * This means:
 *  - When a payslip has been generated (gross_earnings, net_pay etc.) those numbers are used.
 *  - Individual components come from salary_structures DB fields (hra, special_allowance, etc.)
 *  - Only falls back to percentage estimates if the DB field is absent.
 *
 * NO values are hardcoded in the UI — everything flows from the DB.
 */

const N = (v) => Number(v) || 0;

/**
 * @param {object} structure  — row from salary_structures (DB)
 * @param {object} payslip    — row from payslips (DB), may be null/undefined
 * @returns {object}          — all salary components + totals
 */
export function buildSalaryBreakdown(structure = {}, payslip = null) {
  const s = structure || {};
  const p = payslip   || {};

  /* ── Core components from DB, with fallback percentages ── */
  const basic    = N(p.basic    || s.basic);
  const hra      = N(p.hra      || s.hra             || Math.round(basic * 0.40));
  const special  = N(s.special_allowance              || Math.round(basic * 0.25));
  const lta      = N(s.lta      || s.lta_allowance   || Math.round(basic * 0.045));
  const telephone= N(s.telephone_allowance || s.telephone_and_internet || Math.round(basic * 0.02));
  const conveyance=N(s.conveyance                     || Math.round(basic * 0.03));
  const medical  = N(s.medical_allowance              || Math.round(basic * 0.05));

  /* ── Statutory deductions from DB, with fallback rules ── */
  const pfWage   = Math.min(basic, 15000);
  const pf       = N(p.pf_employee || s.pf_employee  || Math.round(pfWage * 0.12));
  const empPf    = N(s.pf_employer                   || Math.round(pfWage * 0.12));
  const calcGross= basic + hra + special + lta + telephone + conveyance + medical;
  const profTax  = N(s.professional_tax              || (calcGross > 20000 ? 200 : calcGross > 15000 ? 150 : 0));

  /* ── Totals: prefer actual payslip values ── */
  const gross      = N(p.gross_earnings) || calcGross;
  const deductions = N(p.deductions)     || (pf + profTax);
  const net        = N(p.net_pay)        || (gross - deductions);
  const ctc        = N(p.ctc || s.ctc)  || (gross + empPf);

  return {
    basic, hra, special, lta, telephone, conveyance, medical,
    pf, empPf, profTax,
    gross, deductions, net, ctc,
    workingDays: N(p.working_days || 26),
    paidDays:    N(p.paid_days    || 26),
    lopDays:     N(p.lop_days     || 0),
    // convenience
    fromPayslip: !!p.gross_earnings,   // true = real generated payslip
  };
}

/** Format number as Indian currency string (2 decimals, no ₹ prefix) */
export const fmtSalary = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
