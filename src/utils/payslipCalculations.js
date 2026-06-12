/** Shared payslip earnings/deductions calculation + currency formatting helpers. */

export const formatCurrency = (value) => {
  if (value === "" || value == null || Number.isNaN(Number(value))) return "—";
  return `$${Number(value).toLocaleString()}`;
};

export const calculatePayslip = (salaryValue) => {
  const base = Number(salaryValue) || 0;
  const basic = Math.round(base);
  const da = Math.round(basic * 0.4);
  const hra = Math.round(basic * 0.15);
  const conveyance = Math.round(basic * 0.05);
  const allowance = Math.round(basic * 0.025);
  const medicalAllowance = Math.round(basic * 0.05);
  const earningOthers = Math.round(basic * 0.01);
  const tds = Math.round(basic * 0.1);
  const esi = Math.round(basic * 0.05);
  const pf = Math.round(basic * 0.075);
  const leave = Math.round(basic * 0.025);
  const profTax = Math.round(basic * 0.02);
  const labourWelfare = Math.round(basic * 0.0125);
  const deductionOthers = Math.round(basic * 0.0025);
  const totalEarnings = basic + da + hra + conveyance + allowance + medicalAllowance + earningOthers;
  const totalDeductions = tds + esi + pf + leave + profTax + labourWelfare + deductionOthers;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    basic,
    da,
    hra,
    conveyance,
    allowance,
    medicalAllowance,
    earningOthers,
    tds,
    esi,
    pf,
    leave,
    profTax,
    labourWelfare,
    deductionOthers,
    totalEarnings,
    totalDeductions,
    netSalary,
  };
};
