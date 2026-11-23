const fmtAmt = n => Number(n || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
function parseDateStr(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}
function formatDateLabel(d) {
  if (!d) return "—";
  const dt = parseDateStr(d);
  if (!dt) return d;
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatPayoutMonth(d) {
  if (!d) return "—";
  const dt = parseDateStr(d);
  if (!dt) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[dt.getMonth()]}, ${dt.getFullYear()}`;
}
function getDurationLabel(ms) {
  if (ms <= 0) return "—";
  const days = Math.floor(ms / 86400000);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  const parts = [`${months} month${months !== 1 ? "s" : ""}`];
  if (remDays > 0) parts.push(`${remDays} day${remDays !== 1 ? "s" : ""}`);
  return parts.join(" ");
}
export { fmtAmt, parseDateStr, formatDateLabel, formatPayoutMonth, getDurationLabel };
