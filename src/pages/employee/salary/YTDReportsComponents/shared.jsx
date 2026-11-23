const tblFmt = n => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
const fmt = n => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FISCAL_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];
/* ── Summary stat card ── */
export { tblFmt, fmt, MONTH_LABELS, FISCAL_ORDER };
