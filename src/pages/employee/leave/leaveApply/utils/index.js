import { LEAVE_COLORS } from "../constants";

export function calcDays(from, to, fromSession, toSession) {
  if (!from || !to) return 0;
  const fromD = new Date(from);
  const toD = new Date(to);
  if (toD < fromD) return 0;
  const diffDays = Math.round((toD - fromD) / 86400000) + 1;
  if (diffDays === 1)
    return fromSession === "First Half" || fromSession === "Second Half" ? 0.5 : 1;
  let days = diffDays;
  if (fromSession === "Second Half") days -= 0.5;
  if (toSession === "First Half") days -= 0.5;
  return Math.max(days, 0);
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtISO(date) {
  return date instanceof Date ? date.toISOString().split("T")[0] : date;
}

export function getLeaveColor(idx) {
  return LEAVE_COLORS[idx % LEAVE_COLORS.length];
}
