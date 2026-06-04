import { INITIAL_LEAVE_REQUESTS, ADMIN_TOTAL_EMPLOYEES } from "./adminLeaveData";
import {
  ADMIN_ATTENDANCE_SUMMARY,
  ADMIN_ALL_EMPLOYEES,
} from "./adminAttendanceData";
import { STATIC_DASHBOARD_STATS } from "./staticData";
import { getApprovedLeavesToday } from "../utils/adminLeaveUtils";

export function getAdminDashboardMetrics() {
  const today = new Date();
  const pending = INITIAL_LEAVE_REQUESTS.filter((r) => r.status === "Pending");
  const approved = INITIAL_LEAVE_REQUESTS.filter((r) => r.status === "Approved");
  const rejected = INITIAL_LEAVE_REQUESTS.filter((r) => r.status === "Rejected");
  const onLeaveToday = getApprovedLeavesToday(INITIAL_LEAVE_REQUESTS, today);
  const att = ADMIN_ATTENDANCE_SUMMARY;
  const lateEmployees = ADMIN_ALL_EMPLOYEES.filter((e) => e.status === "late");
  const absentEmployees = ADMIN_ALL_EMPLOYEES.filter((e) => e.status === "absent");
  const presentEmployees = ADMIN_ALL_EMPLOYEES.filter((e) => e.status === "present");

  return {
    totalEmployees: STATIC_DASHBOARD_STATS.employees_count ?? ADMIN_TOTAL_EMPLOYEES,
    companies: STATIC_DASHBOARD_STATS.companies_count,
    pendingLeave: pending.length,
    onLeaveToday: onLeaveToday.length,
    onLeaveList: onLeaveToday,
    pendingList: pending.slice(0, 5),
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    presentToday: att.presentToday,
    absentToday: att.absentToday,
    lateToday: att.lateToday,
    attendanceRate: att.attendanceRate,
    checkedIn: att.checkedInToday,
    lateEmployees,
    absentEmployees,
    presentEmployees,
  };
}

export const ADMIN_QUICK_ACTIONS = [
  { label: "Manage Leave", path: "/dashboard/leave", color: "bg-emerald-500" },
  { label: "View Attendance", path: "/dashboard/attendance", color: "bg-blue-500" },
  { label: "Add Employee", path: "/dashboard/create-employee", color: "bg-violet-500" },
  { label: "Company Calendar", path: "/dashboard/calendar", color: "bg-orange-500" },
  { label: "Run Reports", path: "/dashboard/report", color: "bg-rose-500" },
  { label: "Review Hub", path: "/dashboard/review", color: "bg-cyan-600" },
];
