import {
  STATIC_DASHBOARD_STATS,
  STATIC_EMPLOYEES,
  STATIC_DEPARTMENTS,
  STATIC_DESIGNATIONS,
} from "./staticData";
import { mapCsvRowToEmployee, parseEmployeeCsv } from "../utils/employeeCsvImport";

let employeeStore = [...STATIC_EMPLOYEES];

export function getDashboardStats() {
  return STATIC_DASHBOARD_STATS;
}

export function getEmployeeList() {
  return employeeStore;
}

export function getDepartments() {
  return STATIC_DEPARTMENTS;
}

export function getDesignations() {
  return STATIC_DESIGNATIONS;
}

export function getDepartmentNameById(departmentId) {
  const dept = STATIC_DEPARTMENTS.find((d) => d.department_id === Number(departmentId));
  return dept?.department_name || "General";
}

export function addEmployee(payload) {
  const newEmployee = {
    employee_id: payload.employee_id || Date.now(),
    emp_code: payload.emp_code || payload.employee_id || `EMP${Date.now()}`,
    first_name: payload.first_name,
    lasst_name: payload.last_name,
    email: payload.email,
    mobile: payload.mobile,
    reporting_to: payload.reporting_to || "Admin User",
    emp_job_title: payload.emp_job_title || "Employee",
    role: Number(payload.role) || 2,
    employee_status: payload.employee_status || "Active",
    department_id: Number(payload.department_id) || 1,
    designation_id: payload.designation_id ? Number(payload.designation_id) : undefined,
    employee_type: payload.employee_type || payload.employment_type || "Full-Time",
    assigned_member: payload.assigned_member || "",
    benefits_plan: payload.benefits_plan || "standard",
    ctc: payload.ctc || "",
    emp_joining_date: payload.emp_joining_date || "",
  };
  employeeStore = [...employeeStore, newEmployee];
  return { message: "Employee created successfully", data: newEmployee };
}

export function importEmployeesFromCsv(text) {
  const rows = parseEmployeeCsv(text);
  const created = rows
    .filter((row) => row.first_name || row.firstname)
    .map((row) => addEmployee(mapCsvRowToEmployee(row)));
  return created.length;
}

export function addCompany(payload) {
  return { message: "Company saved successfully", data: payload };
}
