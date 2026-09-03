import React, { useState, useEffect, useMemo, useCallback } from "react";
import MonthNav from "./components/MonthNav";
import StatStrip from "./components/StatStrip";
import CalendarGrid from "./components/CalendarGrid";
import DayDrawer from "./components/DayDrawer";
import {
  getMyMonthlyAttendance,
  getMyTodayAttendance,
} from "../../../../api/attendance.api";

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
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState(null);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));

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

  const dayMap = useMemo(() => buildDayMap(records, year, month), [records, year, month]);

  const selectedEntry = useMemo(() => {
    if (!selectedDate) return null;
    const rec = dayMap.get(selectedDate);
    return rec ? { ...rec, date: selectedDate } : null;
  }, [selectedDate, dayMap]);

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
    <div className="min-h-screen bg-slate-100">
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
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Stats row */}
        <StatStrip loading={loading} dayMap={dayMap} />

        {/* Calendar + Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
              <DayDrawer selected={selectedEntry} onClose={() => setSelectedDate(null)} />
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
