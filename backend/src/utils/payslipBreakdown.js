const { slabTax } = require('./taxCalculator');

const STANDARD_DEDUCTION = 50000;

/**
 * Computes the earnings / deductions breakdown for a payslip from an
 * employee's monthly Basic salary.
 *
 * Earnings (all as % of Basic):
 *   Basic (100%), HRA (40%), Special Allowance (25%), LTA (4.5%),
 *   Telephone & Internet (2%), Medical Allowance (5%),
 *   Conveyance Allowance (3%), Bonus (5%), Incentives (5%), Arrears (7.5%),
 *   Other Earnings (1%).
 *
 * Statutory Deductions (employee side):
 *   PF  = 12% of min(basic, ₹15,000) — statutory wage ceiling
 *   ESI = 0.75% of gross if gross ≤ ₹21,000 (ESI applicability limit)
 *   PT  = slab-based:
 *           Gross ≤ ₹15,000  → ₹0
 *           ₹15,001–₹20,000  → ₹150
 *           ₹20,001+          → ₹200
 *   TDS = Old-regime slab tax + 4% cess, spread across 12 months
 *
 * Employer Contributions (CTC components, not employee deductions):
 *   Employer PF  = 12% of min(basic, ₹15,000)
 *     ↳ EPS   = 8.33% of min(basic, ₹15,000)  (pension fund)
 *     ↳ EPF   = 3.67% of min(basic, ₹15,000)  (PF trust)
 *   EDLI       = 0.5%  of min(basic, ₹15,000), max ₹75
 *   Employer ESI = 3.25% of gross if gross ≤ ₹21,000
 */
function calculateEarningsDeductionsBreakdown(basicSalary) {
  const basic = Math.round(Number(basicSalary) || 0);

  // ── Earnings ────────────────────────────────────────────────────────────────
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

  const earnings = [
    { label: 'BASIC SALARY',                  amount: basic },
    { label: 'HRA',                            amount: hra },
    { label: 'SPECIAL ALLOWANCE',             amount: specialAllowance },
    { label: 'LTA',                            amount: lta },
    { label: 'TELEPHONE AND INTERNET ALLOWANCE', amount: telephoneAndInternet },
    { label: 'MEDICAL ALLOWANCE',             amount: medicalAllowance },
    { label: 'CONVEYANCE ALLOWANCE',          amount: conveyanceAllowance },
    { label: 'BONUS',                          amount: bonus },
    { label: 'INCENTIVES',                     amount: incentives },
    { label: 'ARREARS',                        amount: arrears },
    { label: 'OTHER EARNINGS',                 amount: otherEarnings },
  ];

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  // ── PF / EPS / EPF / EDLI ───────────────────────────────────────────────────
  const pfWage     = Math.min(basic, 15000);                            // statutory PF wage ceiling
  const pf         = Math.round(pfWage * 0.12);                        // employee PF (12%)
  const eps        = Math.round(pfWage * 0.0833);                      // employer EPS (8.33%)
  const epf        = Math.round(pfWage * 0.0367);                      // employer EPF (3.67%)
  const employerPf = eps + epf;                                         // = 12% of pfWage
  const edli       = Math.min(Math.round(pfWage * 0.005), 75);        // EDLI, max ₹75

  // ── ESI ─────────────────────────────────────────────────────────────────────
  // Applicable when gross salary ≤ ₹21,000/month
  const esiApplicable  = totalEarnings <= 21000;
  const esiEmployee    = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;  // 0.75%
  const esiEmployer    = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;  // 3.25%

  // ── Professional Tax (PT) ───────────────────────────────────────────────────
  // Telangana / AP slab (most common):
  //   Gross ≤ ₹15,000  → ₹0
  //   ₹15,001–₹20,000  → ₹150/month
  //   ₹20,001+          → ₹200/month
  const professionalTax = totalEarnings <= 15000 ? 0
                        : totalEarnings <= 20000 ? 150
                        : 200;

  // ── Income Tax (TDS) ────────────────────────────────────────────────────────
  const grossAnnual    = totalEarnings * 12;
  const pfAnnual       = pf * 12;
  const taxableIncome  = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax      = slabTax(taxableIncome);
  const educationCess  = Math.round(annualTax * 0.04);
  const incomeTax      = Math.round((annualTax + educationCess) / 12);

  // ── Deductions (employee side only) ─────────────────────────────────────────
  const deductions = [
    { label: 'PF',         amount: pf },
    ...(esiEmployee > 0 ? [{ label: 'ESI', amount: esiEmployee }] : []),
    { label: 'PROF TAX',   amount: professionalTax },
    { label: 'INCOME TAX', amount: incomeTax },
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    // ── Employer / statutory detail (for CTC, reports, payslip footer) ────────
    employerPf,    // 12% of pfWage
    eps,           // 8.33% of pfWage
    epf,           // 3.67% of pfWage
    edli,          // 0.5% of pfWage, max ₹75
    esiEmployee,   // employee ESI (0 if gross > ₹21k)
    esiEmployer,   // employer ESI (0 if gross > ₹21k)
    professionalTax,
  };
}

module.exports = { calculateEarningsDeductionsBreakdown };
