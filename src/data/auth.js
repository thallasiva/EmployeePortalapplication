import {
  STATIC_USERS,
  STATIC_ROLES,
  STATIC_COMPANIES,
  STATIC_DEPARTMENTS,
  STATIC_DESIGNATIONS,
} from "./staticData";

export function authenticateUser(email, password) {
  const key = email?.trim().toLowerCase();
  const account = STATIC_USERS[key];
  if (!account || account.password !== password) {
    return null;
  }
  return {
    user: {
      email: account.email,
      role: account.role,
      name: account.name,
    },
    token: "static-local-token",
  };
}

export function registerUser() {
  return { message: "Registration saved (static mode)" };
}

export function getRolesForSelect() {
  return STATIC_ROLES.map((item) => ({
    id: item.role_id,
    label: item.role_name,
    value: item.role_id,
  }));
}

export function getCompaniesForSelect() {
  return STATIC_COMPANIES.map((item) => ({
    id: item.company_id,
    label: item.company_name,
    value: item.company_id,
  }));
}

export function getDepartmentsForSelect() {
  return STATIC_DEPARTMENTS.map((item) => ({
    id: item.department_id,
    label: item.department_name,
    value: item.department_id,
  }));
}

export function getDesignationsForSelect(departmentId) {
  const deptId = Number(departmentId);
  const list = deptId
    ? STATIC_DESIGNATIONS.filter((d) => d.department_id === deptId)
    : STATIC_DESIGNATIONS;
  return list.map((item) => ({
    id: item.designation_id,
    label: item.designation_name,
    value: item.designation_id,
  }));
}
