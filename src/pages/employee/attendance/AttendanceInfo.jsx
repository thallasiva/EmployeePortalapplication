import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,

  Monitor,
} from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
import {
  getAttendanceCode,
  formatMinutesAsHrs,
  CELL_STYLES,
} from "../../../lib/attendanceUtils";
import { getMyMonthlyAttendance, getMyTodayAttendance, checkIn, checkOut } from "../../../api/attendance.api";
import { errorToast, successToast } from "../../../utils/ToastControllers";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_CODE = "GS";
const SHIFT_NAME = "General Shift";
const SHIFT_TIME = "10:00 to 19:00";
const SCHEME = "Attendance Scheme";

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

/** Build a calendar-day record from a real attendance row (or null if none exists). */
function buildDayRecord(date, record) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const key = `${m}-${d}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const iso = toISODateString(date);
  const todayIso = toISODateString(new Date());
  const isHoliday = record?.status === "holiday" || Boolean(HOLIDAYS[key]);
  const isLeave = record?.status === "leave";
  const pending = !record && !isWeekend && !isHoliday && iso >= todayIso;

  const workMinutes = record?.work_hours ? Math.round(Number(record.work_hours) * 60) : 0;

  let status;
  if (isHoliday) {
    status = { code: "H", label: "Holiday", workMinutes: 0 };
  } else if (isLeave) {
    status = { code: "L", label: "On Leave", workMinutes: 0 };
  } else if (isWeekend && !record) {
    status = { code: "O", label: "Off", workMinutes: 0 };
  } else if (pending) {
    status = { code: "—", label: "In progress", workMinutes: 0 };
  } else {
    status = getAttendanceCode(workMinutes, { isWeekend: false, isHoliday: false });
  }

  const hasData = Boolean(record) && !isHoliday && !isLeave;
  const firstIn = record?.check_in ? record.check_in.slice(0, 5) : "—";
  const lastOut = record?.check_out ? record.check_out.slice(0, 5) : "—";
  const totalWork = hasData ? formatMinutesAsHrs(workMinutes) : "—";
  const lateBy = record?.late_by_minutes || 0;

  return {
    iso,
    day: date.getDate(),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
    status,
    shiftCode: SHIFT_CODE,
    isHoliday,
    isWeekend: isWeekend && !record,
    hasWarning: lateBy > 0,
    pending: Boolean(pending),
    hasRemote: false,
    processed: {
      firstIn,
      lastOut,
      lateIn: lateBy > 0 ? `00:${String(lateBy).padStart(2, "0")}` : "—",
      earlyOut: "—",
      totalWorkHrs: totalWork,
      breakHrs: hasData ? "—" : "—",
      actualWorkHrs: totalWork,
    },
    statusRemarks:
      status.code === "P:A"
        ? `Partial presence — ${totalWork} worked (required 9h)`
        : status.code === "P"
        ? "Full day present"
        : status.code === "H"
        ? HOLIDAYS[key] || "Holiday"
        : status.code === "L"
        ? "On approved leave"
        : status.code === "O"
        ? "Weekly off"
        : status.code === "A"
        ? "Absent"
        : "—",
    sessions:
      hasData && (record?.check_in || record?.check_out)
        ? [
            {
              session: "Session 1",
              timing: `${firstIn} - ${lastOut}`,
              firstIn,
              lastOut,
            },
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

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyMonthlyAttendance({ month: monthIndex + 1, year })
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [year, monthIndex]);

  const loadToday = () => {
    getMyTodayAttendance()
      .then((data) => setTodayRecord(data))
      .catch(() => setTodayRecord(null));
  };

  useEffect(() => {
    loadToday();
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

  const selected =
    dayMap.get(selectedIso) ||
    buildDayRecord(new Date(selectedIso + "T12:00:00"), recordsByDate.get(selectedIso));

  const handleCheckIn = () => {
    setPunching(true);
    checkIn({})
      .then((data) => {
        setTodayRecord(data);
        successToast("Checked in successfully.");
        getMyMonthlyAttendance({ month: monthIndex + 1, year })
          .then((d) => setRecords(Array.isArray(d) ? d : []))
          .catch(() => {});
      })
      .catch((err) => errorToast(err?.response?.data?.message || "Unable to check in."))
      .finally(() => setPunching(false));
  };

  const handleCheckOut = () => {
    setPunching(true);
    checkOut({})
      .then((data) => {
        setTodayRecord(data);
        successToast("Checked out successfully.");
        getMyMonthlyAttendance({ month: monthIndex + 1, year })
          .then((d) => setRecords(Array.isArray(d) ? d : []))
          .catch(() => {});
      })
      .catch((err) => errorToast(err?.response?.data?.message || "Unable to check out."))
      .finally(() => setPunching(false));
  };

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
          {/* <button type="button" className="text-[#94a3b8] hover:text-slate-600" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button type="button" className="text-[#94a3b8] hover:text-slate-600" aria-label="Logout">
            <Power size={18} />
          </button> */}
          {!todayRecord?.check_in ? (
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={punching}
              className="h-10 px-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {punching ? "Please wait..." : "Check In"}
            </button>
          ) : !todayRecord?.check_out ? (
            <button
              type="button"
              onClick={handleCheckOut}
              disabled={punching}
              className="h-10 px-5 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {punching ? "Please wait..." : "Check Out"}
            </button>
          ) : (
            <span className="h-10 px-4 inline-flex items-center rounded bg-[#f1f5f9] text-[#64748b] text-sm font-medium">
              Checked out at {todayRecord.check_out.slice(0, 5)}
            </span>
          )}
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
            value={loading ? "—" : summary.avgWork}
            trend={loading ? "" : `${recordsByDate.size} day(s) recorded`}
          />
          <SummaryCard
            title="AVG. ACTUAL WORK HRS"
            value={loading ? "—" : summary.avgActual}
          />
          <SummaryCard title="PENALTY DAYS" value={loading ? "—" : String(summary.penaltyDays)} />
        </div>
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
