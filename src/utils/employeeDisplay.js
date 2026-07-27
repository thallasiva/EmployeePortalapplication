import { getDepartments } from "../data/employees";

const DEPT_BADGE = {
  Engineering: "emp-card__dept--engineering",
  "Human Resources": "emp-card__dept--hr",
  Finance: "emp-card__dept--finance",
  Design: "emp-card__dept--design"
};

export function getDepartmentName(employeeOrId) {



  if (employeeOrId && typeof employeeOrId === "object") {
    if (employeeOrId.department_name) return employeeOrId.department_name;
    const dept = getDepartments().find((d) => d.department_id === Number(employeeOrId.department_id));
    return dept?.department_name || "General";
  }
  const dept = getDepartments().find((d) => d.department_id === Number(employeeOrId));
  return dept?.department_name || "General";
}

export function getEmployeeDisplayName(emp) {
  return `${emp.first_name || ""} ${emp.lasst_name || emp.last_name || ""}`.trim();
}

export function getEmployeeInitials(emp) {
  const name = getEmployeeDisplayName(emp);
  return name.
  split(" ").
  filter(Boolean).
  map((p) => p[0]).
  join("").
  slice(0, 2).
  toUpperCase();
}

export function getDeptBadgeClass(departmentName) {
  return DEPT_BADGE[departmentName] || "emp-card__dept--default";
}

export function formatEmployeeId(emp) {
  if (emp.emp_code) return emp.emp_code;
  if (typeof emp.employee_id === "string" && emp.employee_id.startsWith("EMP")) {
    return emp.employee_id;
  }
  return `EMP${String(emp.employee_id).padStart(3, "0")}`;
}
