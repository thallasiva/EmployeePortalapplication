/** Shared payslip earnings/deductions calculation + currency formatting helpers. */

export const formatCurrency = (value) => {
  if (value === "" || value == null || Number.isNaN(Number(value))) return "—";
  return `$${Number(value).toLocaleString()}`;
};

const STANDARD_DEDUCTION = 50000;

// Old-regime income-tax slabs (non-senior citizen), with Section 87A rebate.
// Mirrors backend/src/utils/taxCalculator.js slabTax() exactly.
const slabTax = (taxableIncome) => {
  let income = Math.max(0, Number(taxableIncome) || 0);
  if (income <= 500000) return 0;
  let tax = 0;
  if (income > 1000000) { tax += (income - 1000000) * 0.3; income = 1000000; }
  if (income > 500000)  { tax += (income - 500000)  * 0.2; income = 500000;  }
  if (income > 250000)  { tax += (income - 250000)  * 0.05; }
  return Math.round(tax);
};

/**
 * Computes earnings / deductions breakdown for a given monthly Basic salary.
 * Mirrors `calculateEarningsDeductionsBreakdown()` in
 * backend/src/utils/payslipBreakdown.js exactly — same percentages, same
 * statutory deduction rules.
 *
 * Statutory rules applied:
 *   PF:  12% of min(basic, ₹15,000)
 *   EPS: 8.33% of min(basic, ₹15,000)  — employer pension
 *   EPF: 3.67% of min(basic, ₹15,000)  — employer provident fund
 *   EDLI: 0.5% of min(basic, ₹15,000), capped at ₹75
 *   ESI (employee): 0.75% of gross if gross ≤ ₹21,000
 *   ESI (employer): 3.25% of gross if gross ≤ ₹21,000
 *   PT:  ≤₹15k → ₹0 | ₹15,001–₹20k → ₹150 | >₹20k → ₹200
 *   TDS: old-regime slab + 4% cess, monthly
 */
export const calculatePayslip = (salaryValue) => {
  const basic = Math.round(Number(salaryValue) || 0);

  const hra                  = Math.round(basic * 0.4);
  const specialAllowance     = Math.round(basic * 0.25);
  const lta                  = Math.round(basic * 0.045);
  const telephoneAndInternet = Math.round(basic * 0.02);
  const medicalAllowance     = Math.round(basic * 0.05);
  const conveyanceAllowance  = Math.round(basic * 0.03);
  const bonus                = Math.round(basic * 0.05);
  const incentives           = Math.round(basic * 0.05);
  const arrears              = Math.round(basic * 0.075);
  const otherEarnings        = Math.round(basic * 0.01);

  const totalEarnings =
    basic + hra + specialAllowance + lta + telephoneAndInternet +
    medicalAllowance + conveyanceAllowance + bonus + incentives + arrears + otherEarnings;

  // PF / EPS / EPF / EDLI
  const pfWage     = Math.min(basic, 15000);
  const pf         = Math.round(pfWage * 0.12);           // employee PF
  const eps        = Math.round(pfWage * 0.0833);         // employer EPS (8.33%)
  const epf        = Math.round(pfWage * 0.0367);         // employer EPF (3.67%)
  const employerPf = eps + epf;                            // = 12% of pfWage
  const edli       = Math.min(Math.round(pfWage * 0.005), 75); // max ₹75

  // ESI (gross ≤ ₹21,000)
  const esiApplicable  = totalEarnings <= 21000;
  const esiEmployee    = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;
  const esiEmployer    = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;

  // Professional Tax (slab-based)
  const profTax = totalEarnings <= 15000 ? 0
                : totalEarnings <= 20000 ? 150
                : 200;

  // Income Tax (TDS)
  const grossAnnual   = totalEarnings * 12;
  const pfAnnual      = pf * 12;
  const taxableIncome = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax     = slabTax(taxableIncome);
  const educationCess = Math.round(annualTax * 0.04);
  const incomeTax     = Math.round((annualTax + educationCess) / 12);

  const totalDeductions = pf + esiEmployee + profTax + incomeTax;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);
  const ctc = totalEarnings + employerPf + edli + esiEmployer;

  return {
    basic, hra, specialAllowance, lta, telephoneAndInternet,
    medicalAllowance, conveyanceAllowance, bonus, incentives, arrears, otherEarnings,
    // Employee deductions
    pf, esiEmployee, profTax, incomeTax,
    // Employer contributions
    eps, epf, employerPf, edli, esiEmployer,
    // Totals
    totalEarnings, totalDeductions, netSalary, ctc,
    // Legacy aliases used by some components
    professionalTax: profTax,
    tds: incomeTax,
    esi: esiEmployee,
    conveyance: Math.round(basic * 0.03),
    gross: totalEarnings,
  };
};
