import { useMemo, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  CircleDot,
  CircleX,
  Clock3,
  Download,
  Palmtree,
  Sun,
  Timer,
} from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const LEGEND = [
  { code: "P", label: "Present", color: "emerald" },
  { code: "A", label: "Absent", color: "rose" },
  { code: "L", label: "Leave", color: "sky" },
  { code: "H", label: "Holiday", color: "violet" },
  { code: "WO", label: "Week Off", color: "slate" },
  { code: "HD", label: "Half Day", color: "amber" },
];
const STATUS_STYLES = {
  P: "border-emerald-200 bg-emerald-50 text-emerald-700",
  A: "border-rose-200 bg-rose-50 text-rose-700",
  L: "border-sky-200 bg-sky-50 text-sky-700",
  H: "border-violet-200 bg-violet-50 text-violet-700",
  WO: "border-slate-200 bg-slate-100 text-slate-600",
  HD: "border-amber-200 bg-amber-50 text-amber-700",
};
const COLOR_STYLES = {
  emerald: { dot: "bg-emerald-500", icon: <CircleCheck size={18} />, iconBg: "bg-emerald-50", value: "text-emerald-700", border: "border-t-emerald-500", sub: "Days attended" },
  rose: { dot: "bg-rose-500", icon: <CircleX size={18} />, iconBg: "bg-rose-50", value: "text-rose-700", border: "border-t-rose-500", sub: "Days missed" },
  sky: { dot: "bg-sky-500", icon: <Palmtree size={18} />, iconBg: "bg-sky-50", value: "text-sky-700", border: "border-t-sky-500", sub: "Leave days" },
  violet: { dot: "bg-violet-500", icon: <Sun size={18} />, iconBg: "bg-violet-50", value: "text-violet-700", border: "border-t-violet-500", sub: "This month" },
  slate: { dot: "bg-slate-400", icon: <CalendarDays size={18} />, iconBg: "bg-slate-100", value: "text-slate-700", border: "border-t-slate-400", sub: "Scheduled days off" },
  amber: { dot: "bg-amber-500", icon: <Timer size={18} />, iconBg: "bg-amber-50", value: "text-amber-700", border: "border-t-amber-500", sub: "Short days" },
};
function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
function buildMuster(year, monthIndex) {
  const days = getDaysInMonth(year, monthIndex);
  const rows = [];
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dow = date.getDay();
    let code = "P";
    if (dow === 0 || dow === 6) code = "WO";
    else if (day === 1 && monthIndex === 4) code = "H";
    else if (day % 17 === 0) code = "L";
    else if (day % 23 === 0) code = "A";
    rows.push({
      day,
      weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
      dateLabel: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      checkIn: code === "WO" || code === "H" ? "—" : "09:05 AM",
      checkOut: code === "WO" || code === "H" ? "—" : "06:10 PM",
      hours: code === "WO" || code === "H" ? "—" : "9h 05m",
      code,
    });
  }
  return rows;
}
const codeBadge = (code) => {
  const item = LEGEND.find((legendItem) => legendItem.code === code) || LEGEND[0];
  return (
    <span
      className={`inline-flex min-w-9 h-8 items-center justify-center rounded-lg border px-2 text-xs font-bold ${STATUS_STYLES[item.code]}`}
      title={item.label}
    >
      {code}
    </span>
  );
};
export default function AttendanceMuster() {
  const user = getLoggedInUser();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const muster = useMemo(
    () => buildMuster(Number(year), monthIndex),
    [year, monthIndex]
  );
  const summary = useMemo(() => {
    const counts = { P: 0, A: 0, L: 0, H: 0, WO: 0, HD: 0 };
    muster.forEach((r) => {
      counts[r.code] = (counts[r.code] || 0) + 1;
    });
    return counts;
  }, [muster]);
  const workingDays = muster.length - summary.WO - summary.H;
  const attendanceRate = workingDays > 0
    ? Math.round((summary.P / workingDays) * 100)
    : 0;
  const monthLabel = `${MONTHS[monthIndex]} ${year}`;
  return (
    <div className="min-h-full space-y-5 rounded-2xl bg-slate-50/70 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#263956] px-5 py-6 text-white shadow-lg shadow-slate-900/10 sm:px-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border-[22px] border-orange-400/10" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[-100px] right-40 h-48 w-48 rounded-full border-[16px] border-white/[0.04]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">
              <CalendarDays size={14} />
              Attendance overview
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Monthly attendance
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {user?.name || "Employee"} <span className="mx-1.5 text-slate-500">·</span>
              Review your daily attendance and work hours.
            </p>
            <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attendance rate</p>
                <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">{attendanceRate}<span className="ml-0.5 text-lg text-slate-300">%</span></p>
              </div>
              <div className="mb-1 min-w-[180px] flex-1 xl:max-w-[260px]">
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-300">
                  <span>{summary.P} present</span>
                  <span>{workingDays} working days</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-white/15"
                  role="progressbar"
                  aria-label="Monthly attendance rate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={attendanceRate}
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-[width]" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-2 backdrop-blur-sm">
          <select
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            aria-label="Select attendance month"
            className="h-10 min-w-[9rem] rounded-lg border border-white/10 bg-slate-800 px-3 text-sm font-semibold text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30"
          >
            {MONTHS.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <div className="rounded-lg bg-white [&_button]:!h-10 [&_button]:!border-white/10 [&_button]:!bg-slate-800 [&_button]:!text-white [&_select]:!h-10 [&_select]:!border-white/10 [&_select]:!bg-slate-800 [&_select]:!text-white">
            <YearPicker value={year} onChange={setYear} />
          </div>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-bold text-white shadow-sm transition hover:from-orange-400 hover:to-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
          >
            <Download size={16} />
            Download
          </button>
          </div>
        </div>
      </section>

      <section aria-label={`Attendance summary for ${monthLabel}`} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {LEGEND.map((item) => (
          <div key={item.code} className={`min-w-0 rounded-xl border border-slate-200/80 border-t-[3px] ${COLOR_STYLES[item.color].border} bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${COLOR_STYLES[item.color].iconBg} ${COLOR_STYLES[item.color].value}`}>
                {COLOR_STYLES[item.color].icon}
              </div>
              <span className={`mt-1 h-2 w-2 rounded-full ${COLOR_STYLES[item.color].dot}`} />
            </div>
            <p className="mt-3 truncate text-xs font-semibold text-slate-500">{item.label}</p>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className={`text-2xl font-extrabold tracking-tight ${COLOR_STYLES[item.color].value}`}>{summary[item.code] || 0}</span>
              <span className="truncate text-[10px] text-slate-400">{COLOR_STYLES[item.color].sub}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Daily attendance</h2>
            <p className="mt-0.5 text-xs text-slate-500">Your check-in, check-out, and hours for {monthLabel}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Clock3 size={14} className="text-orange-500" />
            {muster.length} days
          </div>
        </div>
        <div className="max-h-[34rem] overflow-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th scope="col" className="w-20 px-5 py-3.5 font-bold">Day</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Date</th>
                <th scope="col" className="w-28 px-5 py-3.5 font-bold">Status</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Check in</th>
                <th scope="col" className="px-5 py-3.5 font-bold">Check out</th>
                <th scope="col" className="px-5 py-3.5 text-right font-bold">Work hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {muster.map((row) => {
                const iso = toISODateString(
                  new Date(Number(year), monthIndex, row.day)
                );
                const isToday = iso === toISODateString(new Date());
                return (
                  <tr
                    key={row.day}
                    className={`transition-colors ${
                      isToday ? "bg-orange-50/70" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        {String(row.day).padStart(2, "0")}
                      {isToday && (
                          <CircleDot size={12} className="text-orange-500" aria-label="Today" />
                      )}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-700">{row.weekday}, {row.dateLabel}</div>
                    </td>
                    <td className="px-5 py-3">{codeBadge(row.code)}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-slate-600">{row.checkIn}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-slate-600">{row.checkOut}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-700">{row.hours}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
