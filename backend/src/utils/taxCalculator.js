











const STANDARD_DEDUCTION = 50000;


function slabTax(taxableIncome) {
  let income = Math.max(0, Number(taxableIncome) || 0);


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
}

const FY_MONTH_ORDER = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];


function fyMonthIndex(month) {
  const m = Number(month);
  return m >= 4 ? m - 3 : m + 9;
}










function computeTdsSection({ earnings = [], pfMonthly = 0, professionTaxMonthly = 0, approvedProofs = [], taxRegime = 'old', month, year }) {
  const tdsRows = earnings.
  filter((e) => Number(e.amount) > 0).
  map((e) => {
    const gross = Math.round(Number(e.amount) * 12);
    return { label: e.label, gross, exempt: 0, taxable: gross };
  });

  const grossSalary = tdsRows.reduce((sum, r) => sum + r.gross, 0);

  const pfAnnual = Math.round((Number(pfMonthly) || 0) * 12);
  const proofTotals = approvedProofs.reduce((totals, proof) => {
    const key = String(proof.section_key || '').toUpperCase();
    const type = String(proof.investment_type || '').toLowerCase();
    const section = key || (type.includes('medical') ? '80D' : type.includes('nps') ? '80CCD(1B)' : '80C');
    totals[section] = (totals[section] || 0) + Number(proof.actual_amount || 0);
    return totals;
  }, {});
  const oldRegime = String(taxRegime || 'old').toLowerCase() !== 'new';
  const chapterVIA = oldRegime ? [
    { label: '80C / PF', amount: Math.min(150000, pfAnnual + (proofTotals['80C'] || 0)) },
    { label: '80CCD(1B)', amount: Math.min(50000, proofTotals['80CCD(1B)'] || 0) },
    { label: '80D', amount: Math.min(50000, proofTotals['80D'] || 0) }
  ].filter(x => x.amount > 0) : [];
  const totalVIADeduction = chapterVIA.reduce((sum, r) => sum + r.amount, 0);

  const professionTax = Math.round((Number(professionTaxMonthly) || 0) * 12);

  const totalIncome = Math.max(0, grossSalary - STANDARD_DEDUCTION - totalVIADeduction);
  const totalTax = slabTax(totalIncome);
  const educationCess = Math.round(totalTax * 0.04);

  const taxDeductedPrevEmployer = 0;
  const monthsElapsed = fyMonthIndex(month);


  const monthlyProjectedTax = Math.round((totalTax + educationCess) / 12);
  const taxDeductedTillDate = monthlyProjectedTax * monthsElapsed;
  const taxToBeDeducted = totalTax + educationCess - taxDeductedPrevEmployer;

  const taxPaidByMonth = {};
  FY_MONTH_ORDER.forEach((m, idx) => {
    taxPaidByMonth[m] = idx < monthsElapsed ? monthlyProjectedTax : null;
  });

  return {
    rows: tdsRows,
    chapterVIA,
    grossSalary,
    incomeTax: {
      grossSalary,
      professionTax,
      totalVIADeduction,
      totalIncome,
      totalTax,
      educationCess,
      taxDeductedPrevEmployer,
      taxDeductedTillDate,
      taxToBeDeducted,
      monthlyProjectedTax
    },
    taxPaidByMonth
  };
}

module.exports = { computeTdsSection, slabTax, fyMonthIndex, FY_MONTH_ORDER };
