import { NEW_SLABS, OLD_SLABS } from "../constants";

export function slabTax(income, slabs) {
  let tax = 0, rem = income;
  for (const [limit, rate] of slabs) {
    if (rem <= 0) break;
    tax += Math.min(rem, limit) * rate;
    rem -= Math.min(rem, limit);
  }
  return Math.round(tax);
}

/**
 * Compute all tax summary values from annual salary totals.
 * Returns a flat object with every intermediate value used in the statement.
 */
export function computeTaxSummary({ T, regime }) {
  const isNew = regime === "new";
  const grossSalary = T.gross;
  const hraExemption = 0;
  const prevEmployerInc = 0;
  const incAfterExempt = grossSalary - hraExemption + prevEmployerInc;

  const STD_DED = isNew ? 75000 : 50000;
  const stdDed = Math.min(STD_DED, incAfterExempt);
  const chargeableSal = Math.max(0, incAfterExempt - stdDed);
  const grossTotal = chargeableSal;

  const ch8Ded = isNew ? 0 : Math.min(T.pf, 150000);
  const taxableIncome = Math.max(0, grossTotal - ch8Ded);

  const rawTax = slabTax(taxableIncome, isNew ? NEW_SLABS : OLD_SLABS);
  const cess = Math.round(rawTax * 0.04);
  const totalTax = rawTax + cess;
  const monthlyTDS = Math.round(totalTax / 12);

  const now = new Date();
  const elapsed = now.getMonth() < 3 ? now.getMonth() + 9 : now.getMonth() - 3;
  const taxPaid = monthlyTDS * Math.min(elapsed, 12);
  const remaining = Math.max(0, totalTax - taxPaid);
  const remMonths = Math.max(1, 12 - elapsed);
  const monthlyCess = Math.round(cess / 12);
  const monthlyRaw = monthlyTDS - monthlyCess;

  return {
    isNew, grossSalary, hraExemption, prevEmployerInc, incAfterExempt,
    STD_DED, stdDed, chargeableSal, grossTotal,
    ch8Ded, taxableIncome, rawTax, cess, totalTax,
    monthlyTDS, taxPaid, remaining, remMonths, monthlyCess, monthlyRaw,
  };
}
