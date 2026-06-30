import {
  STATIC_USERS,
  STATIC_ROLES,
  STATIC_COMPANIES,
  STATIC_DEPARTMENTS,
  STATIC_DESIGNATIONS,
} from "./staticData";
import { setAuthTokens, clearAuthSession as clearTokens } from "../api/client";

export const ROLE_ADMIN = 1;
export const ROLE_EMPLOYEE = 2;
export const ROLE_REPORTING_MANAGER = 3;
export const ROLE_RECRUITER_LEAD = 4;
export const ROLE_RECRUITER = 5;

const ALL_ROLES = [ROLE_ADMIN, ROLE_EMPLOYEE, ROLE_REPORTING_MANAGER, ROLE_RECRUITER_LEAD, ROLE_RECRUITER];

/** Coerce role from API/form/localStorage to a valid role number. */
export function normalizeRole(role) {
  const n = Number(role);
  if (ALL_ROLES.includes(n)) return n;
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
  if (role === ROLE_REPORTING_MANAGER) return "/manager";
  if (role === ROLE_RECRUITER_LEAD || role === ROLE_RECRUITER) return "/recruiter/recruitment";
  if (role === ROLE_EMPLOYEE) return "/employee/home";
  return "/login";
}

export function isAdmin(user) {
  return resolveRoleForUser(user) === ROLE_ADMIN;
}

export function isEmployee(user) {
  return resolveRoleForUser(user) === ROLE_EMPLOYEE;
}

export function isReportingManager(user) {
  return resolveRoleForUser(user) === ROLE_REPORTING_MANAGER;
}

export function isRecruiterLead(user) {
  return resolveRoleForUser(user) === ROLE_RECRUITER_LEAD;
}

export function isRecruiter(user) {
  return resolveRoleForUser(user) === ROLE_RECRUITER;
}

export function isRecruitmentRole(user) {
  const role = resolveRoleForUser(user);
  return role === ROLE_RECRUITER_LEAD || role === ROLE_RECRUITER;
}

/** Shift assigned to the logged-in employee/RM (defaults to "general"). */
export function getShiftForUser(user) {
  const shift = user?.shift;
  if (shift === "mid" || shift === "night") return shift;
  return "general";
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

/**
 * Persists the result of a successful `POST /api/auth/login` (or refresh)
 * call: stores the JWT access/refresh tokens and the normalized user object.
 */
export function persistAuthSession({ accessToken, refreshToken, user } = {}) {
  setAuthTokens({ accessToken, refreshToken });
  if (user) persistUser(user);
}

/** Clears tokens + cached user, logging the user out locally. */
export function logoutUser() {
  clearTokens();
  // Bust the /auth/me module-level cache so stale profile is not served after re-login
  try { require('../api/auth.api').bustMeCache?.(); } catch {}
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
