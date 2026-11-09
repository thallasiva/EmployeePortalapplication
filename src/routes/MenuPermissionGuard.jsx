import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredUser } from "../data/auth";
import { useMenuPermissions } from "../hooks/useMenuPermissions";

// Keep direct URL access aligned with the Menu Permission Builder. Sidebar
// filtering alone is cosmetic: users can otherwise paste a protected URL.
const ROUTE_RULES = [
  [/^\/dashboard\/create-employee(?:\/|$)/, "emp-create"],
  [/^\/dashboard\/employee(?:\/|$)/, "employees"],
  [/^\/dashboard\/company(?:\/|$)/, "employees"],
  [/^\/dashboard\/offices(?:\/|$)/, "employees"],
  [/^\/dashboard\/attendance(?:\/|$)/, "attendance"],
  [/^\/dashboard\/leave\?tab=requests(?:&|$)/, "leave-req"],
  [/^\/dashboard\/leave\?tab=balances(?:&|$)/, "leave-bal"],
  [/^\/dashboard\/leave\?tab=types(?:&|$)/, "leave-type"],
  [/^\/dashboard\/leave(?:\/|$)/, "leave"],
  [/^\/dashboard\/timesheets(?:\/|$)/, "timesheets"],
  [/^\/dashboard\/documents?(?:\/|$)/, "documents"],
  [/^\/dashboard\/payroll\/payslips(?:\/|$)/, "pay-payslips"],
  [/^\/dashboard\/payroll\/ytd(?:\/|$)/, "pay-ytd"],
  [/^\/dashboard\/payroll\/inputs(?:\/|$)/, "pay-inputs"],
  [/^\/dashboard\/payroll\/compliance(?:\/|$)/, "pay-comply"],
  [/^\/dashboard\/payroll(?:\/|$)/, "payroll"],
  [/^\/dashboard\/it-declaration(?:\/|$)/, "payroll"],
  [/^\/dashboard\/performance(?:\/|$)/, "performance"],
  [/^\/dashboard\/recruitment(?:\/|$)/, "recruitment"],
  [/^\/dashboard\/report(?:\/|$)/, "reports"],
  [/^\/dashboard\/onboarding(?:\/|$)/, "onboarding"],
  [/^\/dashboard\/helpdesk(?:\/|$)/, "helpdesk"],
  [/^\/dashboard\/(workflow-delegation|manage)(?:\/|$)/, "workflow"],
  [/^\/dashboard\/role-management(?:\/|$)/, "role-mgmt"],
  [/^\/dashboard\/settings\/email-configuration(?:\/|$)/, "set-email"],
  [/^\/dashboard\/notification-settings(?:\/|$)/, "set-notif"],
  [/^\/dashboard\/audit-logs(?:\/|$)/, "set-audit"],
  [/^\/dashboard\/settings(?:\/|$)/, "settings"],
  [/^\/dashboard\/form-builder(?:\/|$)/, "form-builder"],
  [/^\/dashboard\/dash-builder(?:\/|$)/, "dash-builder"],
  [/^\/dashboard\/menu-perm(?:\/|$)/, "menu-perm"],
  [/^\/dashboard\/report-builder(?:\/|$)/, "report-builder"],
];

function menuIdForPath(pathname) {
  return ROUTE_RULES.find(([pattern]) => pattern.test(pathname))?.[1];
}

export default function MenuPermissionGuard({ children }) {
  const { pathname, search } = useLocation();
  const { isAllowed, loading } = useMenuPermissions(getStoredUser());
  const menuId = menuIdForPath(`${pathname}${search}`);

  if (loading) return null;
  if (menuId && !isAllowed(menuId)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
