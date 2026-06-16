import { useCallback, useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight, Search, Filter, Download } from "lucide-react";
import { getMyLeaveRequests, listLeaveRequests } from "../../../api/leaveRequest.api";
import { listHolidays } from "../../../api/holiday.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../data/auth";

const fmt = (d) => d.toISOString().split("T")[0];

// Expand a leave request into an array of "YYYY-MM-DD" strings it spans
function expandDates(from, to) {
  const dates = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(fmt(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];

const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const initials = (name = "") =>
  name.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const daysBetween = (from, to) => {
  const ms = new Date(to) - new Date(from);
  return Math.round(ms / 86400000) + 1;
};

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

export default function LeaveCalendar() {
  const user = getStoredUser();
  const canViewAll = isAdmin(user) || isReportingManager(user);

  const [viewDate, setViewDate]     = useState(new Date());
  const [selected, setSelected]     = useState(new Date());
  const [filterType, setFilterType] = useState("Me");
  const [search, setSearch]         = useState("");

  const [leaves, setLeaves]         = useState([]);
  const [holidays, setHolidays]     = useState([]);
  const [loading, setLoading]       = useState(true);

  const month = viewDate.getMonth() + 1;
  const year  = viewDate.getFullYear();

  // ── Fetch leave requests for the visible month ──────────────────────────
  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      // date range for the month
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      let data = [];
      if (filterType === "Me") {
        const res = await getMyLeaveRequests({ status: "Approved", limit: 200 });
        data = res.data || [];
      } else {
        // Team / Department — needs admin or manager role
        const res = await listLeaveRequests({ status: "Approved", limit: 200 });
        data = res.data || [];
      }

      // Filter to requests that overlap this month
      data = data.filter((lr) => {
        const lrFrom = lr.from_date?.split("T")[0] || lr.from_date;
        const lrTo   = lr.to_date?.split("T")[0]   || lr.to_date;
        return lrFrom <= to && lrTo >= from;
      });

      setLeaves(data);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [month, year, filterType]);

  // ── Fetch holidays for the year ────────────────────────────────────────
  const loadHolidays = useCallback(async () => {
    try {
      const res = await listHolidays({ year, limit: 100 });
      setHolidays(res.data || []);
    } catch {
      setHolidays([]);
    }
  }, [year]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);
  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  // ── Build lookup: date → list of leave requests ────────────────────────
  const leaveByDate = useMemo(() => {
    const map = {};
    leaves.forEach((lr) => {
      const from = lr.from_date?.split("T")[0];
      const to   = lr.to_date?.split("T")[0];
      if (!from || !to) return;
      expandDates(from, to).forEach((d) => {
        if (!map[d]) map[d] = [];
        map[d].push(lr);
      });
    });
    return map;
  }, [leaves]);

  // ── Holiday lookups ───────────────────────────────────────────────────
  const holidayByDate = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      const d = h.holiday_date?.split("T")[0];
      if (d) map[d] = h;
    });
    return map;
  }, [holidays]);

  // ── Selected date panel ────────────────────────────────────────────────
  const selectedStr = fmt(selected);
  const selectedHoliday = holidayByDate[selectedStr];
  const selectedLeaves  = leaveByDate[selectedStr] || [];

  // ── Filtered leave transactions (right panel list) ─────────────────────
  const monthLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaves;
    return leaves.filter((lr) =>
      (lr.employee_name || "").toLowerCase().includes(q) ||
      (lr.leave_type_name || "").toLowerCase().includes(q)
    );
  }, [leaves, search]);

  // Navigate months
  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-semibold text-[#1f2937]">Leave Calendar</h1>
        <button className="h-9 px-4 bg-[#2ea7ff] text-white rounded flex items-center gap-2 text-sm font-medium">
          <Download size={15} /> Export
        </button>
      </div>

      {/* Filter */}
      <div className="mb-5">
        <label className="block text-[13px] text-[#64748b] mb-1.5">Filter Type</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 w-44 border border-[#dbe2ea] rounded px-3 bg-white text-sm outline-none"
        >
          <option value="Me">Me</option>
          {canViewAll && <option value="Team">Team</option>}
          {canViewAll && <option value="Department">Department</option>}
        </select>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Left: Calendar ── */}
        <div className="col-span-7 bg-white border border-[#dce3eb] rounded overflow-hidden">
          <style>{`
            .react-calendar { width: 100%; border: none; font-family: inherit; }
            .react-calendar__navigation { height: 64px; margin-bottom: 0; border-bottom: 1px solid #e6edf5; }
            .react-calendar__navigation button { font-size: 16px; color: #334155; min-width: 44px; background: transparent; }
            .react-calendar__month-view__weekdays { text-align: center; border-bottom: 1px solid #e6edf5; }
            .react-calendar__month-view__weekdays__weekday { padding: 12px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .react-calendar__tile { height: 90px; text-align: left; padding: 10px; border-right: 1px solid #e6edf5 !important; border-bottom: 1px solid #e6edf5 !important; position: relative; background: white; }
            .react-calendar__tile:hover { background: #f8fbff !important; }
            .react-calendar__tile--active { background: #eef7ff !important; color: #1f2937 !important; }
            .react-calendar__tile--active abbr { background: #2ea7ff; color: white; border-radius: 999px; padding: 3px 7px; }
            .react-calendar__tile abbr { text-decoration: none; font-size: 13px; }
            .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.35; }
          `}</style>

          <Calendar
            value={selected}
            activeStartDate={new Date(year, month - 1, 1)}
            onActiveStartDateChange={({ activeStartDate }) => setViewDate(activeStartDate)}
            onChange={(d) => setSelected(d)}
            prevLabel={<ChevronLeft size={16} />}
            nextLabel={<ChevronRight size={16} />}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const d = fmt(date);
              const holiday = holidayByDate[d];
              const dayLeaves = leaveByDate[d] || [];

              return (
                <>
                  {/* Holiday dot */}
                  {holiday && (
                    <span
                      title={holiday.holiday_name}
                      className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                        holiday.is_restricted ? "bg-[#facc15]" : "bg-[#d9b8ff]"
                      }`}
                    />
                  )}
                  {/* Leave count badge */}
                  {dayLeaves.length > 0 && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2ea7ff] text-white text-[10px] font-semibold">
                      {dayLeaves.length}
                    </span>
                  )}
                  {/* Employee avatars (max 2) */}
                  {dayLeaves.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex -space-x-1.5">
                      {dayLeaves.slice(0, 2).map((lr, i) => (
                        <span
                          key={i}
                          title={lr.employee_name}
                          className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white ${avatarColor(lr.employee_name)}`}
                        >
                          {initials(lr.employee_name || "?")}
                        </span>
                      ))}
                      {dayLeaves.length > 2 && (
                        <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                          +{dayLeaves.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </>
              );
            }}
          />

          {/* Legend */}
          <div className="flex items-center gap-6 px-5 py-3 border-t border-[#e6edf5] text-[13px] text-[#64748b]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#2ea7ff]" /> Team on Leave {loading ? "" : `(${leaves.length})`}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#facc15]" /> Restricted Holiday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#d9b8ff]" /> General Holiday</span>
          </div>
        </div>

        {/* ── Right: Panel ── */}
        <div className="col-span-5 bg-white border border-[#dce3eb] rounded flex flex-col">

          {/* Selected day holiday info */}
          {selectedHoliday && (
            <div className="flex items-start gap-3 p-4 border-b border-[#e6edf5] bg-purple-50/50">
              <div className="text-center min-w-[40px]">
                <p className="text-xl font-bold text-gray-800">{selected.getDate().toString().padStart(2,"0")}</p>
                <p className="text-xs text-gray-500">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][selected.getDay()]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">{selectedHoliday.is_restricted ? "Restricted Holiday" : "General Holiday"}</p>
                <p className="text-sm font-semibold text-gray-800">{selectedHoliday.holiday_name}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="p-3 border-b border-[#e6edf5]">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee…"
                  className="w-full h-9 border border-[#dbe2ea] rounded pl-8 pr-3 text-sm outline-none"
                />
              </div>
              <button className="h-9 w-9 border border-[#dbe2ea] rounded flex items-center justify-center text-[#64748b]">
                <Filter size={14} />
              </button>
            </div>
          </div>

          {/* Selected day leaves */}
          {selectedLeaves.length > 0 && (
            <div className="border-b border-[#e6edf5] px-4 py-3 bg-blue-50/40">
              <p className="text-xs font-semibold text-blue-600 mb-2">
                On leave {selected.getDate()} {MONTH_NAMES[selected.getMonth()]}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedLeaves.map((lr, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 px-2.5 py-1 text-xs text-gray-700">
                    <span className={`w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${avatarColor(lr.employee_name)}`}>
                      {initials(lr.employee_name || "?")}
                    </span>
                    {lr.employee_name || "Employee"}
                    <span className="text-gray-400">· {lr.leave_type_name || lr.leave_type}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Leave Transactions for month */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e6edf5]">
            <p className="text-[13px] font-semibold text-[#334155]">
              Leave Transactions ({monthLeaves.length})
            </p>
            <span className="text-xs text-[#94a3b8]">{MONTH_NAMES[month - 1]} {year}</span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-3 bg-[#f8fafc] border-b border-[#e6edf5]">
            <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">Employee</div>
            <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">Days</div>
            <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">From – To</div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
            ) : monthLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center text-3xl mb-3">📄</div>
                <p className="text-[15px] font-medium text-[#64748b]">No employees on leave</p>
                <p className="mt-1 text-[13px] text-[#94a3b8]">Approved leaves for {MONTH_NAMES[month - 1]} will appear here.</p>
              </div>
            ) : (
              monthLeaves.map((lr, i) => {
                const from = lr.from_date?.split("T")[0];
                const to   = lr.to_date?.split("T")[0];
                const days = from && to ? daysBetween(from, to) : lr.days || "—";
                return (
                  <div key={lr.leave_request_id || i} className="grid grid-cols-3 border-b border-[#f1f5f9] hover:bg-[#f8fbff]">
                    <div className="px-4 py-3 flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${avatarColor(lr.employee_name)}`}>
                        {initials(lr.employee_name || "?")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-800 truncate">{lr.employee_name || "Employee"}</p>
                        <p className="text-[11px] text-gray-400 truncate">{lr.leave_type_name || lr.leave_type || "Leave"}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-[13px] font-semibold text-gray-700">{days}</span>
                      <span className="ml-1 text-[11px] text-gray-400">day{days !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center">
                      <p className="text-[12px] text-gray-600">
                        {from ? new Date(from).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                        {from !== to && to ? ` – ${new Date(to).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
