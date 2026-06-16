/** Shared payslip earnings/deductions calculation + currency formatting helpers. */

export const formatCurrency = (value) => {
  if (value === "" || value == null || Number.isNaN(Number(value))) return "—";
  return `$${Number(value).toLocaleString()}`;
};

const STANDARD_DEDUCTION = 50000;

// Old-regime income-tax slabs (non-senior citizen), with Section 87A rebate.
// Mirrors backend/src/utils/taxCalculator.js's slabTax() so the on-screen
// "Income Tax" figure matches the downloaded payslip PDF exactly.
const slabTax = (taxableIncome) => {
  let income = Math.max(0, Number(taxableIncome) || 0);

  // Section 87A rebate: no tax if total income <= 5,00,000
  if (income <= 500000) return 0;

  let tax = 0;
  if (income > 1000000) {
    tax += (income - 1000000) * 0.3;
    income = 1000000;
  }
  if (income > 500000) {
    tax += (income - 500000) * 0.2;
    income = 500000;
  }
  if (income > 250000) {
    tax += (income - 250000) * 0.05;
  }
  return Math.round(tax);
};

/**
 * Computes the earnings / deductions breakdown for a given Basic salary.
 *
 * This mirrors `calculateEarningsDeductionsBreakdown()` in
 * backend/src/utils/payslipBreakdown.js (used to build the downloaded/
 * printed payslip PDF), so the on-screen "Earnings Breakdown" / "Deductions
 * Breakdown" pie charts show the exact same line items and totals.
 *
 * Earnings (all as a % of Basic):
 *   Basic Salary (100%), HRA (40%), Special Allowance (25%), LTA (4.5%),
 *   Telephone & Internet Allowance (2%), Medical Allowance (5%),
 *   Conveyance Allowance (3%), Bonus (5%), Incentives (5%), Arrears (7.5%),
 *   Other Earnings (1%) — total ≈ 1.98x Basic.
 *
 * Deductions:
 *   PF (12% of Basic, capped at the statutory ₹15,000 wage ceiling),
 *   Professional Tax (flat ₹200/month),
 *   Income Tax (old-regime slab tax + 4% cess on annualised gross
 *   earnings, spread evenly across the financial year)
 */
export const calculatePayslip = (salaryValue) => {
  const basic = Math.round(Number(salaryValue) || 0);

  const hra = Math.round(basic * 0.4);
  const specialAllowance = Math.round(basic * 0.25);
  const lta = Math.round(basic * 0.045);
  const telephoneAndInternet = Math.round(basic * 0.02);
  const medicalAllowance = Math.round(basic * 0.05);
  const conveyanceAllowance = Math.round(basic * 0.03);
  const bonus = Math.round(basic * 0.05);
  const incentives = Math.round(basic * 0.05);
  const arrears = Math.round(basic * 0.075);
  const otherEarnings = Math.round(basic * 0.01);

  const totalEarnings =
    basic +
    hra +
    specialAllowance +
    lta +
    telephoneAndInternet +
    medicalAllowance +
    conveyanceAllowance +
    bonus +
    incentives +
    arrears +
    otherEarnings;

  // PF: 12% of Basic, capped at the statutory ₹15,000/month wage ceiling.
  const pf = Math.round(Math.min(basic, 15000) * 0.12);

  // Professional tax: flat ₹200/month.
  const profTax = 200;

  // Income tax: old-regime slab tax + 4% education cess on the annualised
  // gross earnings, spread evenly across the 12 months of the financial year.
  const grossAnnual = totalEarnings * 12;
  const pfAnnual = pf * 12;
  const taxableIncome = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax = slabTax(taxableIncome);
  const educationCess = Math.round(annualTax * 0.04);
  const incomeTax = Math.round((annualTax + educationCess) / 12);

  const totalDeductions = pf + profTax + incomeTax;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    basic,
    hra,
    specialAllowance,
    lta,
    telephoneAndInternet,
    medicalAllowance,
    conveyanceAllowance,
    bonus,
    incentives,
    arrears,
    otherEarnings,
    pf,
    profTax,
    incomeTax,
    totalEarnings,
    totalDeductions,
    netSalary,
  };
};
