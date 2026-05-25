import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";

const SHIFTS = [
  {
    id: "general",
    name: "General Shift",
    time: "09:00 AM – 06:00 PM",
    break: "1h lunch",
  },
  {
    id: "flex",
    name: "Flexible Shift",
    time: "10:00 AM – 07:00 PM",
    break: "1h lunch",
  },
  {
    id: "night",
    name: "Night Shift",
    time: "06:00 PM – 03:00 AM",
    break: "45m break",
  },
];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  d.setHours(12, 0, 0, 0);
  return d;
}

function buildWeekRoster(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const shift = isWeekend ? null : SHIFTS[i % 2 === 0 ? 0 : 0];

    return {
      iso: toISODateString(date),
      weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
      shortDay: date.toLocaleDateString("en-GB", { weekday: "short" }),
      dateNum: date.getDate(),
      month: date.toLocaleDateString("en-GB", { month: "short" }),
      isWeekend,
      isToday: toISODateString(new Date()) === toISODateString(date),
      shift: isWeekend
        ? { name: "Week Off", time: "—", break: "—" }
        : shift || SHIFTS[0],
    };
  });
}

const teamRoster = [
  { name: "Alex Kumar", shift: "General Shift", dept: "Engineering" },
  { name: "Priya Sharma", shift: "General Shift", dept: "HR" },
  { name: "Rahul Mehta", shift: "Flexible Shift", dept: "Support" },
  { name: "Neha Reddy", shift: "General Shift", dept: "Finance" },
];

export default function ShiftRoster() {
  const user = getLoggedInUser();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const week = useMemo(() => buildWeekRoster(weekStart), [weekStart]);

  const weekLabel = `${week[0].dateNum} ${week[0].month} – ${week[6].dateNum} ${week[6].month} ${weekStart.getFullYear()}`;

  const goWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(getWeekStart(next));
  };

  const todayEntry = week.find((d) => d.isToday);
  const currentShift =
    todayEntry && !todayEntry.isWeekend ? todayEntry.shift : SHIFTS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Shift Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.name || "Employee"} · Weekly schedule
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => goWeek(-1)}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-3 text-sm font-semibold text-slate-800 min-w-[10rem] text-center">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => goWeek(1)}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="ml-1 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-50 rounded-md"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-brand" />
            Your shift this week
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {week.map((day) => (
              <div
                key={day.iso}
                className={`rounded-xl border p-3 ${
                  day.isToday
                    ? "border-brand bg-brand-50 ring-2 ring-brand/30"
                    : day.isWeekend
                    ? "border-gray-100 bg-slate-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <p className="text-xs font-medium text-slate-500">{day.shortDay}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {day.dateNum}
                </p>
                <p className="text-[11px] text-slate-400">{day.month}</p>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    day.isWeekend ? "text-slate-500" : "text-brand"
                  }`}
                >
                  {day.shift.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {day.shift.time}
                </p>
                {day.isToday && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-brand uppercase">
                    Today
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            Today&apos;s shift
          </h2>
          <div className="rounded-xl bg-brand text-white p-4">
            <p className="text-lg font-bold">{currentShift.name}</p>
            <p className="text-sm opacity-90 mt-1">{currentShift.time}</p>
            <p className="text-xs opacity-75 mt-2">Break: {currentShift.break}</p>
          </div>
          <ul className="mt-4 space-y-2">
            {SHIFTS.map((s) => (
              <li
                key={s.id}
                className={`text-sm px-3 py-2 rounded-lg border ${
                  s.name === currentShift.name
                    ? "border-brand bg-brand-50 text-brand-800 font-medium"
                    : "border-gray-100 text-slate-600"
                }`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="block text-xs text-slate-500">{s.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users size={18} className="text-brand" />
          <h2 className="text-base font-semibold text-slate-800">Team roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-600">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Assigned shift</th>
              </tr>
            </thead>
            <tbody>
              {teamRoster.map((row) => (
                <tr
                  key={row.name}
                  className="border-t border-gray-100 hover:bg-slate-50/80"
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {row.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{row.dept}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-100">
                      {row.shift}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
