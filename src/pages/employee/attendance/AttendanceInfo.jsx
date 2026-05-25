import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Power,
  Monitor,
} from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
import {
  getAttendanceCode,
  formatMinutesAsHrs,
  formatMinutesDisplay,
  REQUIRED_WORK_MINUTES,
  PARTIAL_EXAMPLE_MINUTES,
  CELL_STYLES,
} from "../../../lib/attendanceUtils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_CODE = "GS";
const SHIFT_NAME = "General Shift";
const SHIFT_TIME = "10:00 to 19:00";
const SCHEME = "Attendance Scheme";

/** Demo holidays: month-day keys */
const HOLIDAYS = {
  "5-1": "May Day",
};

function getMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

/** Sample work minutes per day for demo calendar */
function getDemoWorkMinutes(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const key = `${m}-${d}`;
  const dow = date.getDay();
  const iso = toISODateString(date);
  const todayIso = toISODateString(new Date());

  if (HOLIDAYS[key]) return { holiday: true, minutes: 0 };
  if (dow === 0 || dow === 6) return { holiday: false, minutes: 0 };
  if (iso > todayIso) return { holiday: false, minutes: 0, pending: true };
  if (iso === todayIso) return { holiday: false, minutes: 0, pending: true };

  if (d === 15) return { holiday: false, minutes: PARTIAL_EXAMPLE_MINUTES };
  if (d === 4) return { holiday: false, minutes: REQUIRED_WORK_MINUTES, hasWarning: true };

  return { holiday: false, minutes: REQUIRED_WORK_MINUTES + (d % 3) * 5 };
}

function buildDayRecord(date) {
  const { holiday: isHoliday, minutes, hasWarning, pending } = getDemoWorkMinutes(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const status = pending
    ? { code: "—", label: "In progress", workMinutes: 0 }
    : getAttendanceCode(minutes, { isWeekend, isHoliday });

  const hasData = minutes > 0 && !isWeekend && !isHoliday;
  const firstIn = hasData ? "10:02" : "—";
  const lastOut = hasData && minutes >= REQUIRED_WORK_MINUTES ? "19:05" : hasData ? "14:32" : "—";
  const totalWork = hasData ? formatMinutesAsHrs(minutes) : "—";
  const actualWork = hasData ? formatMinutesAsHrs(minutes) : "—";

  return {
    iso: toISODateString(date),
    day: date.getDate(),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    status,
    shiftCode: SHIFT_CODE,
    isHoliday,
    isWeekend,
    hasWarning,
    pending: Boolean(pending),
    hasRemote: date.getDate() % 7 === 0 && !isWeekend && !pending,
    processed: {
      firstIn,
      lastOut,
      lateIn: hasData && minutes < REQUIRED_WORK_MINUTES ? "00:12" : "—",
      earlyOut: hasData && minutes < REQUIRED_WORK_MINUTES ? "04:28" : "—",
      totalWorkHrs: totalWork,
      breakHrs: hasData ? "1:00" : "—",
      actualWorkHrs: actualWork,
    },
    statusRemarks:
      status.code === "P:A"
        ? `Partial presence — ${formatMinutesDisplay(minutes)} worked (required 9h)`
        : status.code === "P"
        ? "Full day present — 9 hours completed"
        : status.code === "H"
        ? HOLIDAYS[`${date.getMonth() + 1}-${date.getDate()}`] || "Holiday"
        : status.code === "O"
        ? "Weekly off"
        : "—",
    sessions: hasData
      ? [
          {
            session: "Session 1",
            timing: minutes < REQUIRED_WORK_MINUTES ? "10:00 - 14:30" : "10:00 - 14:30",
            firstIn: "10:02",
            lastOut: minutes < REQUIRED_WORK_MINUTES ? "14:30" : "14:28",
          },
          ...(minutes >= REQUIRED_WORK_MINUTES
            ? [
                {
                  session: "Session 2",
                  timing: "14:30 - 19:00",
                  firstIn: "14:35",
                  lastOut: "19:05",
                },
              ]
            : []),
        ]
      : [],
  };
}

export default function AttendanceInfo() {
  const navigate = useNavigate();
  const user = getLoggedInUser();
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedIso, setSelectedIso] = useState(toISODateString(today));

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const dayMap = useMemo(() => {
    const map = new Map();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, monthIndex, d);
      const record = buildDayRecord(date);
      map.set(record.iso, record);
    }
    return map;
  }, [year, monthIndex]);

  const grid = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);

  const selected =
    dayMap.get(selectedIso) ||
    buildDayRecord(new Date(selectedIso + "T12:00:00"));

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
      penaltyDays: penalty,
    };
  }, [dayMap]);

  const prevMonth = () => {
    setViewDate(new Date(year, monthIndex - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, monthIndex + 1, 1));
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] -m-6 md:-m-8 p-4 md:p-6 space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold text-[#1f2937]">Attendance Info</h1>
        <div className="flex items-center gap-4">
          <button type="button" className="text-sm text-[#64748b] hover:text-brand">
            Quick Links
          </button>
          <button type="button" className="text-[#94a3b8] hover:text-slate-600" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button type="button" className="text-[#94a3b8] hover:text-slate-600" aria-label="Logout">
            <Power size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate("/employee/attendance/regularizations")}
            className="h-10 px-5 rounded bg-brand hover:bg-brand-600 text-white text-sm font-semibold shadow-sm"
          >
            My Regularizations
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex flex-wrap items-stretch gap-4">
        <div className="flex flex-wrap gap-4 flex-1">
          <SummaryCard
            title="AVG. WORK HRS"
            value={summary.avgWork}
            trend="+2% From April"
          />
          <SummaryCard
            title="AVG. ACTUAL WORK HRS"
            value={summary.avgActual}
            trend="+2% From April"
          />
          <SummaryCard title="PENALTY DAYS" value={String(summary.penaltyDays)} />
        </div>
        <button type="button" className="text-sm font-semibold text-brand self-center">
          +3 INSIGHTS
        </button>
      </div>

      {/* Calendar + details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Calendar */}
        <div className="xl:col-span-7 bg-white border border-[#dce3eb] rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8edf2]">
            <button
              type="button"
              onClick={prevMonth}
              className="text-sm text-[#64748b] hover:text-brand flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-base font-semibold text-[#1f2937]">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="text-sm text-[#64748b] hover:text-brand flex items-center gap-1"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-xs font-semibold text-[#94a3b8] py-2"
                >
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="min-h-[72px]" />;
                }

                const record = dayMap.get(toISODateString(date));
                const isSelected = selectedIso === record.iso;
                const isToday = toISODateString(today) === record.iso;
                const code = record.pending ? "" : record.status.code;
                const cellStyle = record.pending
                  ? "bg-white text-[#64748b]"
                  : CELL_STYLES[record.status.code] || CELL_STYLES.O;

                return (
                  <button
                    key={record.iso}
                    type="button"
                    onClick={() => setSelectedIso(record.iso)}
                    className={`relative min-h-[72px] rounded border border-[#e8edf2] text-left p-1.5 transition-all hover:ring-2 hover:ring-brand/40 ${cellStyle} ${
                      isSelected ? "ring-2 ring-brand z-[1]" : ""
                    }`}
                  >
                    {record.hasRemote && (
                      <Monitor
                        size={12}
                        className="absolute top-1 right-1 text-[#64748b]"
                      />
                    )}
                    {record.hasWarning && (
                      <span className="absolute bottom-1 left-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-amber-500" />
                    )}
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full ${
                        isSelected || isToday
                          ? "bg-brand text-white"
                          : "text-[#334155]"
                      }`}
                    >
                      {record.day}
                    </span>
                    {code && (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold pointer-events-none pt-3">
                        {code}
                      </span>
                    )}
                    {!record.isWeekend && !record.isHoliday && (
                      <span className="absolute bottom-1 right-1 text-[10px] text-[#94a3b8] font-medium">
                        {record.shiftCode}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[#e8edf2] text-xs text-[#64748b]">
              <LegendDot color="bg-[#d8f3dc]" label="P — 9 hrs complete" />
              <LegendDot color="bg-[#ffddd2]" label="P:A — partial (e.g. 4:30)" />
              <LegendDot color="bg-[#d7e3fc]" label="H — Holiday" />
              <LegendDot color="bg-white border" label="O — Off" />
            </div>
          </div>
        </div>

        {/* Day detail */}
        <div className="xl:col-span-5 bg-white border border-[#dce3eb] rounded-lg shadow-sm flex flex-col min-h-[420px]">
          <div className="px-4 py-4 border-b border-[#e8edf2]">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1f2937]">{selected.day}</span>
              <span className="text-lg text-[#64748b]">{selected.weekday}</span>
            </div>
            <p className="text-sm text-[#475569] mt-2">
              {SHIFT_NAME}({SHIFT_CODE}) · {SHIFT_TIME}
            </p>
            <p className="text-xs text-[#94a3b8] mt-1">{SCHEME}</p>
            {!selected.pending && (
              <span
                className={`inline-flex mt-3 px-3 py-1 rounded text-xs font-bold border ${
                  CELL_STYLES[selected.status.code] || CELL_STYLES.O
                } border-transparent`}
              >
                {selected.status.code} — {selected.status.label}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
            <section>
              <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
                Processed on
              </h3>
              <DetailTable
                headers={[
                  "First In",
                  "Last Out",
                  "Late In",
                  "Early Out",
                  "Total Work Hrs",
                  "Break Hrs",
                  "Actual Work Hrs",
                ]}
                values={[
                  selected.processed.firstIn,
                  selected.processed.lastOut,
                  selected.processed.lateIn,
                  selected.processed.earlyOut,
                  selected.processed.totalWorkHrs,
                  selected.processed.breakHrs,
                  selected.processed.actualWorkHrs,
                ]}
              />
            </section>

            <section>
              <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
                Status details
              </h3>
              <table className="w-full border border-[#e8edf2] text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b]">
                    <th className="px-3 py-2 text-left font-semibold border-b">Status</th>
                    <th className="px-3 py-2 text-left font-semibold border-b">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-[#1f2937] border-b">
                      {selected.status.code}
                    </td>
                    <td className="px-3 py-2 text-[#475569] border-b">
                      {selected.statusRemarks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
                Session details
              </h3>
              {selected.sessions.length === 0 ? (
                <p className="text-[#94a3b8] py-4 text-center border border-dashed border-[#dce3eb] rounded">
                  No session data for this day
                </p>
              ) : (
                <table className="w-full border border-[#e8edf2] text-sm">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#64748b]">
                      <th className="px-3 py-2 text-left font-semibold border-b">Session</th>
                      <th className="px-3 py-2 text-left font-semibold border-b">Session Timing</th>
                      <th className="px-3 py-2 text-left font-semibold border-b">First In</th>
                      <th className="px-3 py-2 text-left font-semibold border-b">Last Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.sessions.map((s) => (
                      <tr key={s.session} className="border-b border-[#e8edf2]">
                        <td className="px-3 py-2 font-medium">{s.session}</td>
                        <td className="px-3 py-2">{s.timing}</td>
                        <td className="px-3 py-2">{s.firstIn}</td>
                        <td className="px-3 py-2">{s.lastOut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>

          <p className="px-4 py-2 text-[11px] text-[#94a3b8] border-t border-[#e8edf2]">
            {user?.name || "Employee"} · Rule: ≥9h = P · partial (e.g. 4h 30m) = P:A
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, trend }) {
  return (
    <div className="min-w-[160px] flex-1 bg-white border border-[#dce3eb] rounded-lg px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold text-[#94a3b8] tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-[#1f2937] mt-1">{value}</p>
      {trend && (
        <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      {label}
    </span>
  );
}

function DetailTable({ headers, values }) {
  return (
    <div className="overflow-x-auto border border-[#e8edf2] rounded">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="bg-[#f8fafc]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-2 text-left font-semibold text-[#64748b] border-b whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {values.map((v, i) => (
              <td key={headers[i]} className="px-2 py-2 text-[#334155] border-b">
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
