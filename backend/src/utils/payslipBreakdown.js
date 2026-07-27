const { slabTax } = require('./taxCalculator');

const STANDARD_DEDUCTION = 50000;



























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
  { label: 'OTHER EARNINGS', amount: otherEarnings }];


  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);


  const pfWage = Math.min(basic, 15000);
  const pf = Math.round(pfWage * 0.12);
  const eps = Math.round(pfWage * 0.0833);
  const epf = Math.round(pfWage * 0.0367);
  const employerPf = eps + epf;
  const edli = Math.min(Math.round(pfWage * 0.005), 75);



  const esiApplicable = totalEarnings <= 21000;
  const esiEmployee = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;
  const esiEmployer = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;






  const professionalTax = totalEarnings <= 15000 ? 0 :
  totalEarnings <= 20000 ? 150 :
  200;


  const grossAnnual = totalEarnings * 12;
  const pfAnnual = pf * 12;
  const taxableIncome = Math.max(0, grossAnnual - STANDARD_DEDUCTION - pfAnnual);
  const annualTax = slabTax(taxableIncome);
  const educationCess = Math.round(annualTax * 0.04);
  const incomeTax = Math.round((annualTax + educationCess) / 12);


  const deductions = [
  { label: 'PF', amount: pf },
  ...(esiEmployee > 0 ? [{ label: 'ESI', amount: esiEmployee }] : []),
  { label: 'PROF TAX', amount: professionalTax },
  { label: 'INCOME TAX', amount: incomeTax }];


  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netSalary,

    employerPf,
    eps,
    epf,
    edli,
    esiEmployee,
    esiEmployer,
    professionalTax
  };
}

module.exports = { calculateEarningsDeductionsBreakdown };
