import { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "../../../../../api/auth.api";
import { getMyPayslips, getMySalaryStructure } from "../../../../../api/payroll.api";
import { listHolidays } from "../../../../../api/holiday.api";
import { getMyLeaveBalances } from "../../../../../api/leaveRequest.api";
import { getMyTodayAttendance, getMyMonthlyAttendance } from "../../../../../api/attendance.api";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { getCurrentPayslipMonthLabel } from "../../../../../lib/dateUtils";

export function useDashboardData({ month, year }) {
  const [user, setUser] = useState(null);
  const [structure, setStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [monthAtt, setMonthAtt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    Promise.all([
      getCurrentUser().catch(() => null),
      getMySalaryStructure().catch(() => null),
      getMyPayslips({ limit: 3 }).then((r) => Array.isArray(r) ? r : r?.data ?? []).catch(() => []),
      listHolidays({ year, limit: 20 }).then((r) => Array.isArray(r) ? r : r?.data ?? []).catch(() => []),
      getMyLeaveBalances().then((r) => Array.isArray(r) ? r : r?.data ?? []).catch(() => []),
      getMyTodayAttendance().catch(() => null),
      getMyMonthlyAttendance({ month, year }).catch(() => null),
    ]).then(([u, s, p, h, lb, att, mAtt]) => {
      setUser(u);
      setStructure(s);
      setPayslips(Array.isArray(p) ? p : []);
      const todayMs = new Date(today).getTime();
      const upcoming = (Array.isArray(h) ? h : [])
        .filter((hol) => {
          const d = new Date(hol.holiday_date || hol.date);
          return !isNaN(d) && d.getTime() >= todayMs;
        })
        .sort((a, b) => new Date(a.holiday_date || a.date) - new Date(b.holiday_date || b.date))
        .slice(0, 4);
      setHolidays(upcoming);
      setLeaveBalance(Array.isArray(lb) ? lb : []);
      setTodayAtt(att);
      setMonthAtt(mAtt);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentSlip = useMemo(
    () => payslips.find((p) => Number(p.month) === month && Number(p.year) === year),
    [payslips, month, year]
  );

  const sal = useMemo(() => buildSalaryBreakdown(structure, currentSlip), [structure, currentSlip]);

  const payslipLabel = useMemo(() => getCurrentPayslipMonthLabel(), []);

  return {
    user,
    structure,
    payslips,
    holidays,
    leaveBalance,
    todayAtt,
    setTodayAtt,
    monthAtt,
    loading,
    sal,
    payslipLabel,
  };
}
