import { DEPT_COLORS } from "../constants";

export function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

export function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? String(val)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function deptColor(dept, depts) {
  const i = depts.indexOf(dept);
  return DEPT_COLORS[i % DEPT_COLORS.length];
}
