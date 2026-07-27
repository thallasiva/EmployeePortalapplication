import { PALETTE } from "../constants";

export function deptColor(deptId) {
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

export function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}

export function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function fmtDate(d) {
  if (!d || d === "—") return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

export function normalize(emp) {
  return {
    id: emp.employee_id,
    empCode: emp.emp_code || `EMP${String(emp.employee_id).padStart(3, "0")}`,
    name: fullName(emp),
    email: emp.email || "—",
    mobile: emp.mobile || emp.phone || "—",
    jobTitle: emp.emp_job_title || emp.designation_name || "—",
    reportingToId: emp.reporting_to || null,
    departmentId: emp.department_id,
    departmentName: emp.department_name || "—",
    status: emp.employee_status || "Active",
    gender: emp.gender || "—",
    dob: emp.dob || "—",
    bloodGroup: emp.blood_group || "—",
    joiningDate: emp.emp_joining_date || emp.joining_date || "—",
    location: emp.location || "—",
    color: deptColor(emp.department_id),
  };
}
