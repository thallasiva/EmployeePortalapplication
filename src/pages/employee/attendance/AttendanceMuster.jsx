import { useMemo, useState } from "react";
import { Download, Info } from "lucide-react";
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
  { code: "P", label: "Present", className: "bg-emerald-500" },
  { code: "A", label: "Absent", className: "bg-red-500" },
  { code: "L", label: "Leave", className: "bg-sky-500" },
  { code: "H", label: "Holiday", className: "bg-violet-500" },
  { code: "WO", label: "Week Off", className: "bg-slate-400" },
  { code: "HD", label: "Half Day", className: "bg-amber-500" },
];

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
  const item = LEGEND.find((l) => l.code === code) || LEGEND[0];
  return (
    <span
      className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-white text-xs font-bold ${item.className}`}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Monthly Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.name || "Employee"} · Muster roll
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            className="h-10 min-w-[9rem] border border-gray-200 rounded-lg bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            {MONTHS.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <YearPicker value={year} onChange={setYear} />
          <button
            type="button"
            className="h-10 px-4 rounded-lg bg-brand hover:bg-brand-600 text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {LEGEND.map((item) => (
          <div
            key={item.code}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${item.className}`} />
              <span className="text-sm font-medium text-slate-600">{item.label}</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {summary[item.code] || 0}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-brand-50 border border-brand-100 rounded-lg text-sm text-slate-700">
        <Info size={18} className="text-brand shrink-0" />
        <span>
          Showing attendance for <strong>{MONTHS[monthIndex]} {year}</strong>.
          Select month and year from the calendar controls above.
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="text-left text-slate-600 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold w-16">Day</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold w-20">Code</th>
                <th className="px-4 py-3 font-semibold">Check In</th>
                <th className="px-4 py-3 font-semibold">Check Out</th>
                <th className="px-4 py-3 font-semibold">Hours</th>
              </tr>
            </thead>
            <tbody>
              {muster.map((row) => {
                const iso = toISODateString(
                  new Date(Number(year), monthIndex, row.day)
                );
                const isToday = iso === toISODateString(new Date());

                return (
                  <tr
                    key={row.day}
                    className={`border-t border-gray-100 ${
                      isToday ? "bg-brand-50/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {row.day}
                      {isToday && (
                        <span className="ml-1 text-[10px] text-brand font-bold">
                          •
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {row.weekday}, {row.dateLabel}
                    </td>
                    <td className="px-4 py-2.5">{codeBadge(row.code)}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.checkIn}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.checkOut}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.hours}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
