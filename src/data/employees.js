import {
  STATIC_DASHBOARD_STATS,
  STATIC_EMPLOYEES,
  STATIC_DEPARTMENTS,
  STATIC_DESIGNATIONS,
} from "./staticData";

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

export function addEmployee(payload) {
  const newEmployee = {
    employee_id: Date.now(),
    first_name: payload.first_name,
    lasst_name: payload.last_name,
    email: payload.email,
    mobile: payload.mobile,
    reporting_to: payload.reporting_to || "Admin User",
    emp_job_title: payload.emp_job_title || "Employee",
    role: Number(payload.role) || 2,
    employee_status: payload.employee_status || "Active",
    department_id: payload.department_id,
    designation_id: payload.designation_id,
  };
  employeeStore = [...employeeStore, newEmployee];
  return { message: "Employee created successfully", data: newEmployee };
}

export function addCompany(payload) {
  return { message: "Company saved successfully", data: payload };
}
