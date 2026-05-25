import {
  STATIC_USERS,
  STATIC_ROLES,
  STATIC_COMPANIES,
  STATIC_DEPARTMENTS,
  STATIC_DESIGNATIONS,
} from "./staticData";

export const ROLE_ADMIN = 1;
export const ROLE_EMPLOYEE = 2;

/** Coerce role from API/form/localStorage to 1 (admin) or 2 (employee). */
export function normalizeRole(role) {
  const n = Number(role);
  if (n === ROLE_ADMIN || n === ROLE_EMPLOYEE) return n;
  return null;
}

/** Prefer static account role by email so stale localStorage cannot swap portals */
export function resolveRoleForUser(user) {
  if (!user) return null;
  const key = user.email?.trim().toLowerCase();
  const account = key ? STATIC_USERS[key] : null;
  if (account) return normalizeRole(account.role);
  return normalizeRole(user.role);
}

export function getHomePath(user) {
  const role = resolveRoleForUser(user);
  if (role === ROLE_ADMIN) return "/dashboard";
  if (role === ROLE_EMPLOYEE) return "/employee/home";
  return "/login";
}

export function isAdmin(user) {
  return resolveRoleForUser(user) === ROLE_ADMIN;
}

export function isEmployee(user) {
  return resolveRoleForUser(user) === ROLE_EMPLOYEE;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const role = resolveRoleForUser(user);
    if (!role) return null;
    return { ...user, role };
  } catch {
    return null;
  }
}

export function persistUser(user) {
  const role = normalizeRole(user?.role);
  if (!role) return;
  localStorage.setItem("user", JSON.stringify({ ...user, role }));
}

export function authenticateUser(email, password) {
  const key = email?.trim().toLowerCase();
  const account = STATIC_USERS[key];
  if (!account || account.password !== password) {
    return null;
  }
  return {
    user: {
      email: account.email,
      role: normalizeRole(account.role),
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
