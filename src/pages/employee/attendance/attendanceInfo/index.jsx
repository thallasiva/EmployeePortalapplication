import React, { useState, useEffect, useMemo, useCallback } from "react";
import MonthNav from "./components/MonthNav";
import StatStrip from "./components/StatStrip";
import CalendarGrid from "./components/CalendarGrid";
import DayDrawer from "./components/DayDrawer";
import {
  getMyMonthlyAttendance,
  getMyTodayAttendance,
  getMyAttendanceSwipes,
} from "../../../../api/attendance.api";
import { formatMinutesAsHrs } from "../../../../lib/attendanceUtils";

/* ─────────── helpers ─────────── */
function padDate(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseTime(t) {
  if (!t) return null;
  const s = String(t);
  if (s.includes("T")) return s.slice(11, 16);
  const parts = s.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function minsToHM(mins) {
  if (!mins || mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
}

function hoursToHM(hrs) {
  if (!hrs || hrs <= 0) return "—";
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function buildDayMap(records = [], year, month) {
  const map = new Map();
  const today = new Date();

  for (let d = 1; d <= new Date(year, month, 0).getDate(); d++) {
    const dateStr = padDate(year, month, d);
    const dt = new Date(year, month - 1, d);
    const dow = dt.getDay();
    const isFuture = dt > today;
    map.set(dateStr, {
      date: dateStr,
      isWeekend: dow === 0 || dow === 6,
      isHoliday: false,
      pending: isFuture,
      status: { code: null, label: null },
      processed: { firstIn: "—", lastOut: "—", workHours: "—" },
      raw: {},
      canRegularize: false,
    });
  }

  for (const rec of records) {
    const dateStr = String(rec.attendance_date || rec.date || "").slice(0, 10);
    if (!map.has(dateStr)) continue;
    const existing = map.get(dateStr);

    const status = rec.status || "P";
    const codeMap = {
      present: "P", half_day: "P:A", absent: "A", on_leave: "L", holiday: "H", weekend: "WO",
    };
    const code = codeMap[status] || status.toUpperCase();

    const firstIn = parseTime(rec.check_in);
    const lastOut = parseTime(rec.check_out);

    const worked = rec.work_hours;
    map.set(dateStr, {
      ...existing,
      isHoliday: code === "H",
      status: {
        code,
        label: code === "P" ? "Present" : code === "A" ? "Absent" : code === "L" ? "Leave" : code === "H" ? "Holiday" : code === "P:A" ? "Half Day" : code,
      },
      processed: {
        firstIn: firstIn || "—",
        lastOut: lastOut || "—",
        workHours: hoursToHM(worked),
      },
      canRegularize: !firstIn && !existing.isWeekend && !existing.pending && code !== "H" && code !== "L",
      raw: rec,
    });
  }

  return map;
}

/* ─────────── component ─────────── */
export default function AttendanceInfo() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(8);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState(null);
  const [swipes, setSwipes] = useState([]);
  const [swipesLoading, setSwipesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => `${now.getFullYear()}-08-01`);

  /* fetch monthly records */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyMonthlyAttendance({ year, month }).catch(() => []),
      getMyTodayAttendance().catch(() => null),
    ]).then(([recs, td]) => {
      setRecords(Array.isArray(recs) ? recs : recs?.data ?? []);
      setToday(td);
    }).finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => {
    if (!selectedDate) {
      setSwipes([]);
      setSwipesLoading(false);
      return undefined;
    }
    setSwipesLoading(true);
    getMyAttendanceSwipes(selectedDate)
      .then((data) => setSwipes(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setSwipes([]))
      .finally(() => setSwipesLoading(false));
    return undefined;
  }, [selectedDate]);

  const dayMap = useMemo(() => buildDayMap(records, year, month), [records, year, month]);

  const summary = useMemo(() => {
    let totalMinutes = 0;
    let workedDays = 0;
    dayMap.forEach((entry) => {
      if (entry.isWeekend || entry.isHoliday || entry.pending) return;
      const workHours = Number(entry.raw?.work_hours || 0);
      if (workHours > 0) {
        totalMinutes += Math.round(workHours * 60);
        workedDays += 1;
      }
    });
    return {
      avgWork: workedDays ? formatMinutesAsHrs(Math.round(totalMinutes / workedDays)) : "—",
    };
  }, [dayMap]);

  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    const rec = dayMap.get(selectedDate);
    return rec ? { ...rec, date: selectedDate, raw: { ...rec.raw, punches: swipes } } : null;
  }, [selectedDate, dayMap, swipes]);

  const refreshToday = useCallback(async () => {
    const td = await getMyTodayAttendance().catch(() => null);
    setToday(td);
  }, []);

  const prevMonth = useCallback(() => {
    setMonth((m) => { if (m === 1) { setYear((y) => y - 1); return 12; } return m - 1; });
    setSelectedDate(null);
  }, []);
  const nextMonth = useCallback(() => {
    setMonth((m) => { if (m === 12) { setYear((y) => y + 1); return 1; } return m + 1; });
    setSelectedDate(null);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#fff7ed_52%,#f1f5f9_100%)]">
      {/* Top navigation bar */}
      <MonthNav
        month={month}
        year={year}
        today={today}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onTodayRefresh={refreshToday}
      />

      {/* Page body */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-5 py-5 sm:px-7 sm:py-6 shadow-lg shadow-slate-900/10">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[18px] border-orange-400/20" />
          <div className="absolute right-20 -bottom-24 h-40 w-40 rounded-full border-[14px] border-white/5" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">Attendance overview</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Your August, at a glance
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-300">
                Review every day, punch time, and attendance status from one clear monthly view.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,.12)]" />
              Daily record
            </div>
          </div>
        </div>

        {/* Stats row */}
        <StatStrip loading={loading} dayMap={dayMap} summary={summary} />

        {/* Calendar + Drawer */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarGrid
              month={month}
              year={year}
              dayMap={dayMap}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-1">
            {selectedEntry ? (
              <DayDrawer entry={selectedEntry} swipesLoading={swipesLoading} onClose={() => setSelectedDate(null)} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center h-full min-h-[240px]">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <p className="text-sm font-semibold text-slate-600">Select a day</p>
                <p className="text-xs text-slate-400 mt-1">Tap any date on the calendar to see punch details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
