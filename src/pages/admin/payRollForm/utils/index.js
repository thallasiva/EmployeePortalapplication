export const getFullName = (emp) =>
  `${emp.first_name || ""} ${emp.last_name || emp.lasst_name || ""}`.trim();

export const getInitials = (emp) => {
  const name = getFullName(emp);
  const parts = name.split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatCurrency = (value) => {
  if (value === "" || value == null || isNaN(Number(value))) return "—";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
};

const _slabTax = (income) => {
  income = Math.max(0, Number(income) || 0);
  if (income <= 500000) return 0;
  let tax = 0;
  if (income > 1000000) { tax += (income - 1000000) * 0.3; income = 1000000; }
  if (income > 500000) { tax += (income - 500000) * 0.2; income = 500000; }
  if (income > 250000) { tax += (income - 250000) * 0.05; }
  return Math.round(tax);
};

export const calculatePayslip = (basicSalary) => {
  const basic = Math.round(Number(basicSalary) || 0);

  const hra = Math.round(basic * 0.40);
  const specialAllowance = Math.round(basic * 0.25);
  const lta = Math.round(basic * 0.045);
  const telephoneAndInternet = Math.round(basic * 0.02);
  const medicalAllowance = Math.round(basic * 0.05);
  const conveyance = Math.round(basic * 0.03);
  const bonus = Math.round(basic * 0.05);
  const incentives = Math.round(basic * 0.05);
  const arrears = Math.round(basic * 0.075);
  const otherEarnings = Math.round(basic * 0.01);

  const totalEarnings =
    basic + hra + specialAllowance + lta + telephoneAndInternet +
    medicalAllowance + conveyance + bonus + incentives + arrears + otherEarnings;

  const pfWage = Math.min(basic, 15000);
  const pf = Math.round(pfWage * 0.12);
  const eps = Math.round(pfWage * 0.0833);
  const epf = Math.round(pfWage * 0.0367);
  const employerPf = eps + epf;
  const edli = Math.min(Math.round(pfWage * 0.005), 75);

  const esiApplicable = totalEarnings <= 21000;
  const esiEmployee = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;
  const esiEmployer = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;

  const professionalTax = totalEarnings <= 15000 ? 0 : totalEarnings <= 20000 ? 150 : 200;

  const grossAnnual = totalEarnings * 12;
  const taxableIncome = Math.max(0, grossAnnual - 50000 - pf * 12);
  const annualTax = _slabTax(taxableIncome);
  const tds = Math.round((annualTax + Math.round(annualTax * 0.04)) / 12);

  const totalDeductions = pf + esiEmployee + professionalTax + tds;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);
  const gross = totalEarnings;
  const ctc = totalEarnings + employerPf + edli + esiEmployer;

  return {
    basic, hra, specialAllowance, lta, telephoneAndInternet,
    medicalAllowance, conveyance, bonus, incentives, arrears, otherEarnings,
    pf, esiEmployee, professionalTax, tds,
    eps, epf, employerPf, edli, esiEmployer,
    gross, totalEarnings, totalDeductions, netSalary, ctc,
    esi: esiEmployee
  };
};
