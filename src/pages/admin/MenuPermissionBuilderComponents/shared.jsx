import { MENU_TREE } from "./MENU_TREE";
const BRAND = "#e87500";
const ROLES = ["Admin", "HR Manager", "Manager", "Employee", "Recruiter", "Finance"];
const ROLE_COLORS = ["#e87500", "#e87500", "#8b5cf6", "#10b981", "#e87500", "#64748b"];
// Build default: Admin=all, others restricted
const buildDefault = () => {
  const perms = {};
  ROLES.forEach((role, ri) => {
    const getAllIds = items => items.flatMap(m => [m.id, ...(m.children || []).map(c => c.id)]);
    const allIds = getAllIds(MENU_TREE);
    perms[role] = {};
    allIds.forEach(id => {
      if (role === "Admin") {
        perms[role][id] = true;
        return;
      }
      if (role === "Employee") {
        perms[role][id] = ["dashboard", "attendance", "leave", "leave-req", "leave-bal", "timesheets", "payroll", "pay-payslips", "pay-ytd", "documents", "helpdesk"].includes(id);
        return;
      }
      if (role === "Manager") {
        perms[role][id] = !["set-email", "set-audit", "role-mgmt", "form-builder", "report-builder", "dash-builder", "menu-perm", "pay-comply", "pay-inputs"].includes(id);
        return;
      }
      if (role === "Recruiter") {
        perms[role][id] = ["dashboard", "recruitment", "rec-jobs", "rec-cands", "rec-inter", "documents", "helpdesk"].includes(id);
        return;
      }
      if (role === "Finance") {
        perms[role][id] = ["dashboard", "payroll", "pay-overview", "pay-payslips", "pay-ytd", "pay-inputs", "pay-comply", "reports", "documents"].includes(id);
        return;
      }
      perms[role][id] = true; // HR Manager gets all
    });
  });
  return perms;
};
export { BRAND, ROLES, ROLE_COLORS, buildDefault };
