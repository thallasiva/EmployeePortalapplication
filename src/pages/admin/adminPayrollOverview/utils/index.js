export function fmtINR(n, short = false) {
  if (!n && n !== 0) return "—";
  const abs = Math.abs(Number(n));
  if (short) {
    if (abs >= 10000000) return "₹" + (abs / 10000000).toFixed(1) + "Cr";
    if (abs >= 100000)   return "₹" + (abs / 100000).toFixed(1) + "L";
    if (abs >= 1000)     return "₹" + (abs / 1000).toFixed(1) + "K";
    return "₹" + abs;
  }
  if (abs >= 10000000) return "₹ " + (abs / 10000000).toFixed(2) + " Cr";
  if (abs >= 100000)   return "₹ " + (abs / 100000).toFixed(2) + " L";
  return "₹ " + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function buildMonthList() {
  const now = new Date();
  const list = [];
  for (let i = -3; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    list.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return list;
}
