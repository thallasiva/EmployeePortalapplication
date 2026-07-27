export function computeFromCTC(ctcMonthly) {
  ctcMonthly = Number(ctcMonthly) || 0;
  if (!ctcMonthly) return {};

  const basic_m = Math.round(ctcMonthly * 0.5);
  const hra_m = Math.round(basic_m * 0.4);
  const tel_m = 1500;
  const lta_m = 3333;
  const pf_m = Math.min(Math.round(basic_m * 0.12), 1800);
  const sb_m = basic_m <= 21000 ? 1400 : 0;
  const gross_m = ctcMonthly - pf_m - sb_m;
  const spl_m = gross_m - (basic_m + hra_m + tel_m + lta_m);
  const grat_m = Math.round(basic_m * 0.0481);

  return {
    basic: basic_m * 12,
    hra: hra_m * 12,
    telephoneAllowance: tel_m * 12,
    leaveTravel: lta_m * 12,
    specialAllowance: spl_m * 12,
    grossSalary: gross_m * 12,
    pfContribution: pf_m * 12,
    statutoryBonus: sb_m * 12,
    gratuity: grat_m * 12,
    esi: 0,
    ctc: ctcMonthly * 12,
    ctcMonthly
  };
}

export function numToWords(n) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (!n || n === 0) return "Zero";
  const lakh = Math.floor(n / 100000);
  const thousand = Math.floor(n % 100000 / 1000);
  const hundred = Math.floor(n % 1000 / 100);
  const rest = n % 100;
  let r = "";
  if (lakh) r += (lakh < 20 ? ones[lakh] : tens[Math.floor(lakh / 10)] + (lakh % 10 ? " " + ones[lakh % 10] : "")) + " Lakh ";
  if (thousand) r += (thousand < 20 ? ones[thousand] : tens[Math.floor(thousand / 10)] + (thousand % 10 ? " " + ones[thousand % 10] : "")) + " Thousand ";
  if (hundred) r += ones[hundred] + " Hundred ";
  if (rest) r += (rest < 20 ? ones[rest] : tens[Math.floor(rest / 10)] + (rest % 10 ? " " + ones[rest % 10] : "")) + " ";
  return r.trim() + " Rupees Only";
}

export function fmt(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  if (n === 0) return "—";
  return "Rs." + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

export function fmtM(annualVal) {
  const m = Math.round((Number(annualVal) || 0) / 12);
  if (m === 0) return "—";
  return "Rs." + m.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}
