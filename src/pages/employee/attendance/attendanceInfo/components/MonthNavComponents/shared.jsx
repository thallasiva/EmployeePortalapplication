/* ─── helpers ─── */
function fmt(t) {
  if (!t) return null;
  const s = String(t);
  const time = s.includes("T") ? s.slice(11, 16) : s.slice(0, 5);
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** Map raw API/DB messages to friendly ones */
/** Map raw API/DB messages to friendly ones */
function friendlyError(raw = "", action) {
  const r = raw.toLowerCase();
  if (r.includes("already checked in") || r.includes("duplicate entry") || r.includes("already exists")) return "You're already checked in for today.";
  if (r.includes("not checked in") || r.includes("no attendance")) return "You need to check in first before you can do that.";
  if (r.includes("already on break") || r.includes("on_break")) return "You're already on a break — end your current break first.";
  if (r.includes("not on break")) return "You're not currently on a break.";
  if (r.includes("already checked out") || r.includes("check_out_time")) return "You have already checked out for today.";
  if (r.includes("network") || r.includes("econnrefused") || r.includes("timeout")) return "Network error — please check your connection and try again.";
  if (r.includes("unauthorized") || r.includes("401")) return "Your session has expired. Please log in again.";
  // Fallback — still show something clear
  if (raw.trim()) return raw.charAt(0).toUpperCase() + raw.slice(1);
  return `Could not complete ${action}. Please try again.`;
}
/* ─── Mini toast component ─── */
export { fmt, MONTH_NAMES, friendlyError };
