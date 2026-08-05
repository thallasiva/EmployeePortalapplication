import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Sun, Moon, Sunset } from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
import { getShiftForUser } from "../../../data/auth";

const SHIFTS = {
  general: { id: "general", name: "General Shift", time: "09:00 AM – 06:00 PM", break: "1h lunch", icon: Sun,  color: "text-amber-500",  bg: "bg-amber-50",  ring: "ring-amber-300",  badge: "bg-amber-100 text-amber-800" },
  mid:     { id: "mid",     name: "Mid Shift",     time: "01:00 PM – 10:00 PM", break: "1h dinner",  icon: Sunset, color: "text-indigo-500", bg: "bg-indigo-50", ring: "ring-indigo-300", badge: "bg-indigo-100 text-indigo-800" },
  night:   { id: "night",  name: "Night Shift",   time: "10:00 PM – 07:00 AM", break: "1h break",  icon: Moon,  color: "text-slate-500",  bg: "bg-slate-50",  ring: "ring-slate-300",  badge: "bg-slate-100 text-slate-700" },
};

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d;
}

function buildWeekRoster(weekStart, userShift) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    return {
      iso: toISODateString(date),
      weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
      shortDay: date.toLocaleDateString("en-GB", { weekday: "short" }),
      dateNum: date.getDate(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
      isWeekend,
      isToday: toISODateString(new Date()) === toISODateString(date),
      shift: isWeekend ? { name: "Week Off", time: "—", break: "—" } : userShift,
    };
  });
}

export default function ShiftRoster() {
  const user = getLoggedInUser();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const userShift = useMemo(() => {
    const shiftId = getShiftForUser(user);
    return SHIFTS[shiftId] || SHIFTS.general;
  }, []);

  const week = useMemo(() => buildWeekRoster(weekStart, userShift), [weekStart, userShift]);

  const weekLabel = `${week[0].dateNum} ${week[0].month} – ${week[6].dateNum} ${week[6].month} ${weekStart.getFullYear()}`;
  const goWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(getWeekStart(next));
  };

  const todayEntry = week.find((d) => d.isToday);
  const currentShift = todayEntry && !todayEntry.isWeekend ? userShift : null;

  const ShiftIcon = userShift.icon;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Roster</h1>
          <p className="text-sm text-slate-500 mt-1">{user?.name || "Employee"} · Weekly schedule</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button type="button" onClick={() => goWeek(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Prev week">
            <ChevronLeft size={20} />
          </button>
          <span className="px-3 text-sm font-semibold text-slate-800 min-w-[10rem] text-center">{weekLabel}</span>
          <button type="button" onClick={() => goWeek(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Next week">
            <ChevronRight size={20} />
          </button>
          <button type="button" onClick={() => setWeekStart(getWeekStart(new Date()))} className="ml-1 px-3 py-1.5 text-xs font-semibold text-[#f18200] hover:bg-orange-50 rounded-lg transition-colors">
            Today
          </button>
        </div>
      </div>

      {/* Assigned shift card */}
      <div className={`flex items-center gap-5 ${userShift.bg} border border-${userShift.id === 'general' ? 'amber' : userShift.id === 'mid' ? 'indigo' : 'slate'}-200 rounded-2xl p-5 shadow-sm`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${userShift.bg} ring-2 ${userShift.ring}`}>
          <ShiftIcon size={28} className={userShift.color} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">Your Assigned Shift</p>
          <p className="text-xl font-bold text-slate-900">{userShift.name}</p>
          <p className="text-sm text-slate-600 mt-0.5">{userShift.time} &nbsp;·&nbsp; Break: {userShift.break}</p>
        </div>
        <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-bold ${userShift.badge}`}>
          Active
        </span>
      </div>

      {/* Week grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[#f18200]" />
          This week's schedule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {week.map((day) => (
            <div
              key={day.iso}
              className={`rounded-xl border p-3 transition-all ${
                day.isToday
                  ? "border-[#f18200] bg-orange-50 ring-2 ring-[#f18200]/25 shadow-md"
                  : day.isWeekend
                  ? "border-gray-100 bg-slate-50"
                  : `border-gray-200 ${userShift.bg}`
              }`}
            >
              <p className="text-xs font-medium text-slate-500">{day.shortDay}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{day.dateNum}</p>
              <p className="text-[11px] text-slate-400">{day.month}</p>
              <p className={`mt-2 text-xs font-semibold ${day.isWeekend ? "text-slate-400" : userShift.color}`}>
                {day.shift.name}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{day.shift.time}</p>
              {day.isToday && (
                <span className="inline-block mt-2 text-[10px] font-bold text-[#f18200] uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today's shift details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-3">Today's shift details</h2>
        {currentShift ? (
          <div className={`rounded-xl ${currentShift.bg} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <ShiftIcon size={22} className={currentShift.color} />
              <p className="text-lg font-bold text-slate-900">{currentShift.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Timing</p>
                <p className="text-sm font-semibold text-slate-800">{currentShift.time}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Break</p>
                <p className="text-sm font-semibold text-slate-800">{currentShift.break}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 text-center text-slate-500 text-sm">
            Today is a week off 🎉
          </div>
        )}
      </div>
    </div>
  );
}
