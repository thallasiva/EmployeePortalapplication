import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getAttendanceDashboard, listAttendance } from "../../../../api/attendance.api";
import { toISODateString } from "../../../../lib/dateUtils";
import { enrichAdminEmployee } from "../../../../utils/attendanceRegularization";
import { applyAttendanceRegularization } from "../../../../utils/attendanceRegularization";
import { DEFAULT_SUMMARY } from "../constants";
import { mapAttendanceRow } from "../utils";

export function useAttendanceDashboard() {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [employeeTab, setEmployeeTab] = useState("all");
  const lateSectionRef = useRef(null);

  useEffect(() => {
    const todayStr = toISODateString(new Date());
    const monthStart = toISODateString(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    setLoading(true);
    Promise.all([
      getAttendanceDashboard(todayStr).catch(() => null),
      listAttendance({ from_date: todayStr, to_date: todayStr, limit: 100 }).catch(() => ({ data: [] })),
      listAttendance({ status: "late", from_date: monthStart, to_date: todayStr, limit: 1 }).catch(() => ({ meta: { total: 0 } })),
    ]).then(([dash, todayList, lateMonthList]) => {
      const presentToday = Number(dash?.present_today || 0);
      const totalEmployees = Number(dash?.total_employees || 0);
      setSummary({
        checkedInToday: Number(dash?.checked_in_today || 0),
        totalEmployees,
        presentToday,
        absentToday: Number(dash?.absent_today || 0),
        onLeaveToday: Number(dash?.on_leave_today || 0),
        lateToday: Number(dash?.late_today || 0),
        metNineHourRule: Number(dash?.met_nine_hour_rule || 0),
        avgHoursPerDay: dash?.avg_hours_per_day != null ? Number(dash.avg_hours_per_day) : 0,
        lateThisMonth: Number(lateMonthList?.meta?.total || 0),
        attendanceRate: totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0,
      });
      setEmployees(
        (todayList?.data || []).map(mapAttendanceRow).map(enrichAdminEmployee)
      );
    }).finally(() => setLoading(false));
  }, []);

  const statusChart = useMemo(
    () => [
      { label: "Present", value: summary.presentToday, color: "#22c55e" },
      { label: "Absent", value: summary.absentToday, color: "#f472b6" },
      { label: "Late", value: summary.lateToday, color: "#f97316" },
      { label: "On Leave", value: summary.onLeaveToday, color: "#3b82f6" },
    ],
    [summary]
  );

  const handleRegularize = useCallback((id) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? applyAttendanceRegularization(emp) : emp))
    );
  }, []);

  const lateEmployees = useMemo(
    () => employees.filter((e) => e.status === "late"),
    [employees]
  );

  const tabCounts = useMemo(
    () => ({
      all: employees.length,
      present: employees.filter((e) => e.status === "present").length,
      absent: employees.filter((e) => e.status === "absent").length,
      late: employees.filter((e) => e.status === "late").length,
      leave: employees.filter((e) => e.status === "leave").length,
    }),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    if (employeeTab === "all") return employees;
    return employees.filter((e) => e.status === employeeTab);
  }, [employeeTab, employees]);

  return {
    employees, summary, loading,
    lateSectionRef, statusChart,
    lateEmployees, tabCounts,
    employeeTab, setEmployeeTab, filteredEmployees,
    handleRegularize,
  };
}
