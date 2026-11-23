import { lazy } from "react";
const ProjectReport = lazy(() => import("../../../pages/admin/reports/ProjectReport"));
const TaskReport = lazy(() => import("../../../pages/admin/reports/TaskReport"));
const EmployeeReport = lazy(() => import("../../../pages/admin/reports/EmployeeReport"));
const AttendanceReport = lazy(() => import("../../../pages/admin/reports/AttendanceReport"));
const LeaveReport = lazy(() => import("../../../pages/admin/reports/LeaveReport"));
const DailyReport = lazy(() => import("../../../pages/admin/reports/DailyReport"));
const DownloadReports = lazy(() => import("../../../pages/admin/reports/DownloadReports"));
const PayslipReport = lazy(() => import("../../../pages/admin/reports/PayslipReport"));
const UserReport = lazy(() => import("../../../pages/admin/reports/UserReport"));
const EmptyStateReport = lazy(() => import("../../../pages/admin/reports/EmptyStateReport"));
function getInitials(name) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
function getAvatarColor(name) {
  const colors = ["#e87500", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#e87500"];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
export { ProjectReport, TaskReport, EmployeeReport, AttendanceReport, LeaveReport, DailyReport, DownloadReports, PayslipReport, UserReport, EmptyStateReport, getInitials, getAvatarColor };
