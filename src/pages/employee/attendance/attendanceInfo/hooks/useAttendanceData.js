import { useEffect, useMemo, useState, useCallback } from "react";
import { toISODateString } from "../../../../../lib/dateUtils";
import { formatMinutesAsHrs } from "../../../../../lib/attendanceUtils";
import { getMyMonthlyAttendance, getMyTodayAttendance, checkIn, checkOut } from "../../../../../api/attendance.api";
import { getLoggedInUser } from "../../../../../lib/dateUtils";
import { errorToast, successToast } from "../../../../../utils/ToastControllers";
import { getMonthGrid, buildDayRecord } from "../utils/calendarUtils";

export function useAttendanceData() {
  const user = getLoggedInUser();
  const today = new Date();

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedIso, setSelectedIso] = useState(toISODateString(today));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [punching, setPunching] = useState(false);

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  useEffect(() => {
    setLoading(true);
    getMyMonthlyAttendance({ month: monthIndex + 1, year })
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [year, monthIndex]);

  useEffect(() => {
    getMyTodayAttendance()
      .then((data) => setTodayRecord(data))
      .catch(() => setTodayRecord(null));
  }, []);

  const recordsByDate = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      map.set(toISODateString(new Date(r.attendance_date)), r);
    });
    return map;
  }, [records]);

  const dayMap = useMemo(() => {
    const map = new Map();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, monthIndex, d);
      const iso = toISODateString(date);
      const record = buildDayRecord(date, recordsByDate.get(iso));
      map.set(record.iso, record);
    }
    return map;
  }, [year, monthIndex, recordsByDate]);

  const grid = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);

  const selected = useMemo(
    () =>
      dayMap.get(selectedIso) ||
      buildDayRecord(new Date(selectedIso + "T12:00:00"), recordsByDate.get(selectedIso)),
    [dayMap, selectedIso, recordsByDate]
  );

  const summary = useMemo(() => {
    let totalMinutes = 0;
    let count = 0;
    let penalty = 0;
    dayMap.forEach((rec) => {
      if (rec.isWeekend || rec.isHoliday) return;
      if (rec.status.workMinutes > 0) {
        totalMinutes += rec.status.workMinutes;
        count += 1;
      }
      if (rec.status.code === "P:A" || rec.status.code === "A") penalty += 1;
    });
    const avg = count ? Math.round(totalMinutes / count) : 0;
    return {
      avgWork: formatMinutesAsHrs(avg) || "09:00",
      avgActual: formatMinutesAsHrs(avg) || "09:00",
      penaltyDays: penalty
    };
  }, [dayMap]);

  const refreshMonthly = useCallback(() => {
    getMyMonthlyAttendance({ month: monthIndex + 1, year })
      .then((d) => setRecords(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [monthIndex, year]);

  const handleCheckIn = useCallback(() => {
    setPunching(true);
    checkIn({})
      .then((data) => {
        setTodayRecord(data);
        successToast("Checked in successfully.");
        refreshMonthly();
      })
      .catch((err) => errorToast(err?.response?.data?.message || "Unable to check in."))
      .finally(() => setPunching(false));
  }, [refreshMonthly]);

  const handleCheckOut = useCallback(() => {
    setPunching(true);
    checkOut({})
      .then((data) => {
        setTodayRecord(data);
        successToast("Checked out successfully.");
        refreshMonthly();
      })
      .catch((err) => errorToast(err?.response?.data?.message || "Unable to check out."))
      .finally(() => setPunching(false));
  }, [refreshMonthly]);

  const prevMonth = useCallback(() => {
    setViewDate(new Date(year, monthIndex - 1, 1));
  }, [year, monthIndex]);

  const nextMonth = useCallback(() => {
    setViewDate(new Date(year, monthIndex + 1, 1));
  }, [year, monthIndex]);

  return {
    user,
    today,
    year,
    monthIndex,
    monthLabel,
    grid,
    dayMap,
    recordsByDate,
    selected,
    selectedIso,
    setSelectedIso,
    summary,
    loading,
    todayRecord,
    punching,
    handleCheckIn,
    handleCheckOut,
    prevMonth,
    nextMonth
  };
}
