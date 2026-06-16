const { slabTax } = require('./taxCalculator');

const STANDARD_DEDUCTION = 50000;

/**
 * Computes the earnings / deductions breakdown for a payslip from an
 * employee's monthly Basic salary.
 *
 * This mirrors `calculatePayslip()` in src/utils/payslipCalculations.js on
 * the frontend (used by the "Earnings Breakdown" / "Deductions Breakdown"
 * pie charts on the employee Payslips page) so the downloaded/printed
 * payslip PDF shows the exact same line items and totals as the on-screen
 * charts.
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
 *
 * @param {number} basicSalary - the employee's monthly Basic salary
 * @returns {{
 *   earnings: {label: string, amount: number}[],
 *   deductions: {label: string, amount: number}[],
 *   totalEarnings: number,
 *   totalDeductions: number,
 *   netSalary: number,
 * }}
 */
function calculateEarningsDeductionsBreakdown(basicSalary) {
  const basic = Math.round(Number(basicSalary) || 0);

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

  const earnings = [
    { label: 'BASIC SALARY', amount: basic },
    { label: 'HRA', amount: hra },
    { label: 'SPECIAL ALLOWANCE', amount: specialAllowance },
    { label: 'LTA', amount: lta },
    { label: 'TELEPHONE AND INTERNET ALLOWANCE', amount: telephoneAndInternet },
    { label: 'MEDICAL ALLOWANCE', amount: medicalAllowance },
    { label: 'CONVEYANCE ALLOWANCE', amount: conveyanceAllowance },
    { label: 'BONUS', amount: bonus },
    { label: 'INCENTIVES', amount: incentives },
    { label: 'ARREARS', amount: arrears },
    { label: 'OTHER EARNINGS', amount: otherEarnings },
  ];

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  // PF: 12% of Basic, capped at the statutory ₹15,000/month wage ceiling.
  const pf = Math.round(Math.min(basic, 15000) * 0.12);

  // Professional tax: flat ₹200/month (common state slab for this income band).
  const professionalTax = 200;

  // Income tax: old-regime slab tax + 4% education cess on the annualised
  // gross earnings, spread evenly across the 12 months of the financial year.
  const grossAnnual = totalEarnings * 12;
  const pfAnnual = pf * 12;
  const taxableIncome = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax = slabTax(taxableIncome);
  const educationCess = Math.round(annualTax * 0.04);
  const incomeTax = Math.round((annualTax + educationCess) / 12);

  const deductions = [
    { label: 'PF', amount: pf },
    { label: 'PROF TAX', amount: professionalTax },
    { label: 'INCOME TAX', amount: incomeTax },
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  // Employer's PF contribution (12% of Basic, capped at ₹15,000 statutory wage ceiling).
  // Not part of the employee's take-home but included in CTC.
  const employerPf = Math.round(Math.min(basic, 15000) * 0.12);

  return { earnings, deductions, totalEarnings, totalDeductions, netSalary, employerPf };
}

module.exports = { calculateEarningsDeductionsBreakdown };
