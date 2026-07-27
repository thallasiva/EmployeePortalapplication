export const toArr = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

export function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d)
    ? String(v)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function empName(r) {
  if (r.employee_name) return r.employee_name;
  const p = [r.first_name, r.last_name].filter(Boolean);
  return p.length ? p.join(" ") : r.emp_code || `#${r.employee_id}`;
}
