import { useEffect, useState } from "react";
import { getDashboardStats, getAttendanceDashboard, getRecentActivities } from "../api/dashboard.api";
import { listLeaveRequests } from "../api/leaveRequest.api";
import { listAttendance } from "../api/attendance.api";
import { getAdminDashboardMetrics } from "../data/adminDashboardData";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_LIST = { data: [], meta: { total: 0 } };















export function useAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const date = todayIso();

    async function load() {
      const [statsR, attendanceR, pendingR, onLeaveR, lateR, absentR, recentR] = await Promise.allSettled([
      getDashboardStats(),
      getAttendanceDashboard(date),
      listLeaveRequests({ status: "Pending", limit: 5 }),
      listAttendance({ from_date: date, to_date: date, status: "leave", limit: 50 }),
      listAttendance({ from_date: date, to_date: date, status: "late", limit: 50 }),
      listAttendance({ from_date: date, to_date: date, status: "absent", limit: 50 }),
      getRecentActivities(6)]
      );

      if (cancelled) return;

      const results = [statsR, attendanceR, pendingR, onLeaveR, lateR, absentR, recentR];
      const failures = results.filter((r) => r.status === "rejected");

      failures.forEach((f) => {

        console.error("[useAdminDashboard] a dashboard request failed:", f.reason);
      });



      if (failures.length === results.length) {
        setError(failures[0]?.reason || new Error("Failed to load dashboard data"));
        setMetrics(getAdminDashboardMetrics());
        setLoading(false);
        return;
      }

      const stats = statsR.status === "fulfilled" ? statsR.value || {} : {};
      const attendance = attendanceR.status === "fulfilled" ? attendanceR.value || {} : {};
      const pending = pendingR.status === "fulfilled" ? pendingR.value : EMPTY_LIST;
      const onLeave = onLeaveR.status === "fulfilled" ? onLeaveR.value : EMPTY_LIST;
      const late = lateR.status === "fulfilled" ? lateR.value : EMPTY_LIST;
      const absent = absentR.status === "fulfilled" ? absentR.value : EMPTY_LIST;
      const recent = recentR.status === "fulfilled" ? recentR.value : [];

      const totalEmployees = Number(stats?.employees_count) || 0;
      const presentToday = Number(attendance?.present_today) || 0;
      const absentToday = Number(attendance?.absent_today) || 0;
      const lateToday = Number(attendance?.late_today) || 0;
      const checkedIn = Number(attendance?.checked_in_today) || 0;
      const attendanceRate = totalEmployees ?
      Math.round(presentToday / totalEmployees * 100) :
      0;

      setMetrics({
        totalEmployees,
        companies: Number(stats?.companies_count) || 0,
        pendingLeave: pending.meta?.total ?? pending.data.length,
        onLeaveToday: Number(attendance?.on_leave_today) || onLeave.data.length,
        onLeaveList: onLeave.data.map((r) => ({
          id: r.attendance_id,
          employee: r.employee_name,
          department: r.department_name,
          type: "Leave",
          from: r.attendance_date,
          to: r.attendance_date,
          days: 1
        })),
        pendingList: pending.data.map((r) => ({
          id: r.leave_request_id,
          employee: r.employee_name,
          type: r.leave_type_name,
          from: r.from_date,
          to: r.to_date,
          days: r.days,
          reason: r.reason
        })),
        approvedCount: undefined,
        rejectedCount: undefined,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate,
        checkedIn,
        lateEmployees: late.data.map((r) => ({
          id: r.attendance_id,
          name: r.employee_name,
          checkIn: r.check_in,
          lateBy: r.late_by_minutes ? `${r.late_by_minutes}m late` : ""
        })),
        absentEmployees: absent.data.map((r) => ({
          id: r.attendance_id,
          name: r.employee_name,
          department: r.department_name
        })),
        presentEmployees: [],
        openTickets: Number(stats?.open_tickets_count) || 0,
        openJobs: Number(stats?.open_jobs_count) || 0,
        salariesCount: Number(stats?.salaries_count) || 0
      });

      setActivities(
        (recent || []).map((a) => ({
          id: a.id,
          text: `${a.performed_by_name || "System"} ${a.action?.toLowerCase() || "updated"} ${a.entity}${a.entity_id ? ` #${a.entity_id}` : ""}`,
          time: a.created_at
        }))
      );

      setError(failures.length ? failures[0].reason : null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { metrics: metrics ?? getAdminDashboardMetrics(), activities, loading, error };
}
