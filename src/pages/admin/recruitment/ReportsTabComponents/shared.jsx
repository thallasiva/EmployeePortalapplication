const STATUS_COLORS = {
  "new": "#e87500",
  "applied": "#e87500",
  "screening": "#f59e0b",
  "schedule interview": "#f59e0b",
  "shortlisted": "#8b5cf6",
  "offer released": "#22c55e",
  "offer released and accepted": "#22c55e",
  "accepted": "#22c55e",
  "onboarded": "#e87500",
  "joined": "#e87500",
  "rejected": "#ef4444",
  "not selected": "#ef4444",
  "work in progress": "#64748b",
  "in progress": "#64748b"
};
const FALLBACK_COLORS = ["#e87500", "#f59e0b", "#8b5cf6", "#22c55e", "#e87500", "#ef4444", "#64748b", "#f97316"];
function statusColor(status, idx) {
  return STATUS_COLORS[(status || "").toLowerCase()] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}
const SRC_COLORS = ["#e87500", "#a855f7", "#14b8a6", "#f59e0b", "#ef4444", "#22c55e", "#64748b", "#f97316"];
function fmt(n) {
  return n == null ? "—" : Number(n).toLocaleString();
}
function fmtDays(n) {
  return n == null ? "—" : `${Math.round(n)} days`;
}
export { STATUS_COLORS, FALLBACK_COLORS, statusColor, SRC_COLORS, fmt, fmtDays };
