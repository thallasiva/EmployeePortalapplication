import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Clock, AlertCircle, CheckCircle2, CalendarX, Umbrella, Coffee, ArrowRightLeft } from "lucide-react";

const SIX_HOURS_MINUTES = 360;

const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className={`text-sm font-bold ${accent || "text-slate-800"}`}>{value || "—"}</span>
  </div>
);

const TimeBlock = ({ icon, label, time, color }) => (
  <div className={`flex-1 rounded-xl p-3 flex flex-col items-center gap-1 border ${color}`}>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">{icon}{label}</div>
    <span className="text-xl font-extrabold text-slate-800 tracking-tight">{time || "—"}</span>
  </div>
);

const STATUS_META = {
  P:    { label: "Full Day Present",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "P:A":{ label: "Partial Attendance", color: "bg-amber-50 text-amber-700 border-amber-200" },
  A:    { label: "Absent",             color: "bg-red-50 text-red-700 border-red-200" },
  H:    { label: "Holiday",            color: "bg-blue-50 text-blue-700 border-blue-200" },
  L:    { label: "On Leave",           color: "bg-purple-50 text-purple-700 border-purple-200" },
};

function fmtMins(mins) {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function parsePunches(raw) {
  if (!raw) return [];
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return []; }
}

const DayDetailPanel = React.memo(function DayDetailPanel({ selected, user }) {
  const navigate = useNavigate();
  const isWorkday = !selected.isWeekend && !selected.isHoliday && !selected.pending;
  const workedMinutes = selected?.status?.workMinutes ?? 0;
  const canRegularize = isWorkday && workedMinutes > 0 && workedMinutes < SIX_HOURS_MINUTES;
  const code = selected?.status?.code || "";
  const meta = STATUS_META[code] || {};
  const raw = selected?.raw || {};

  const breakMins = raw.break_minutes ?? 0;
  const punches = useMemo(() => parsePunches(raw.punches), [raw.punches]);
  const breakSessions = Math.max(0, Math.floor(punches.length / 2) - 1);

  const weekdayFull = (() => {
    try { return new Date(selected.iso + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }); }
    catch { return selected.weekday; }
  })();

  return (
    <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Date header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Selected Day</p>
        <p className="text-xl font-extrabold text-slate-800">{weekdayFull}</p>
        {!selected.pending && code && (
          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${meta.color || "bg-slate-50 text-slate-600 border-slate-200"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {code} — {meta.label || selected.status?.label}
          </span>
        )}
        {(selected.isWeekend || selected.isHoliday) && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
            {selected.isHoliday ? <Umbrella size={11} /> : <Coffee size={11} />}
            {selected.isHoliday ? "Public Holiday" : "Weekend — Day Off"}
          </span>
        )}
      </div>

      {/* Punch times */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Punch Times</p>
        <div className="flex gap-3">
          <TimeBlock icon={<LogIn size={12} className="text-emerald-500" />} label="Check In"  time={selected.processed?.firstIn}  color="bg-emerald-50 border-emerald-200" />
          <TimeBlock icon={<LogOut size={12} className="text-[#f18200]" />}  label="Check Out" time={selected.processed?.lastOut} color="bg-orange-50 border-orange-200" />
        </div>
      </div>

      {/* Break summary strip */}
      {isWorkday && (workedMinutes > 0 || breakMins > 0) && (
        <div className="mx-5 mt-3 grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Work</p>
            <p className="text-base font-extrabold text-emerald-700">{selected.processed?.totalWorkHrs || fmtMins(workedMinutes)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Break</p>
            <p className="text-base font-extrabold text-amber-700">{fmtMins(breakMins)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Sessions</p>
            <p className="text-base font-extrabold text-blue-700">{breakSessions > 0 ? breakSessions : (workedMinutes > 0 ? 1 : 0)}</p>
          </div>
        </div>
      )}

      {/* Alert banners */}
      {canRegularize && (
        <div className="mx-5 mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
          <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800">Only {selected.processed?.totalWorkHrs} worked</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Less than 6 hours — eligible for regularization.</p>
          </div>
          <button onClick={() => navigate("/employee/attendance/regularizations", { state: { prefillDate: selected.iso } })} className="shrink-0 text-xs font-extrabold text-[#f18200] hover:underline">Apply →</button>
        </div>
      )}
      {isWorkday && workedMinutes >= SIX_HOURS_MINUTES && (
        <div className="mx-5 mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700">{selected.processed?.totalWorkHrs} worked — no regularization needed</p>
        </div>
      )}

      {/* Details & punch log */}
      <div className="flex-1 px-5 pt-4 pb-2 overflow-y-auto space-y-4">
        {/* Work details */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Details</p>
          <div className="bg-slate-50 rounded-xl px-4 py-1">
            <InfoRow label="Total Work Hours"  value={selected.processed?.totalWorkHrs}  accent="text-emerald-700" />
            <InfoRow label="Break Duration"    value={fmtMins(breakMins)}                accent={breakMins > 0 ? "text-amber-600" : undefined} />
            <InfoRow label="Late Arrival"      value={selected.processed?.lateIn}        accent={selected.processed?.lateIn && selected.processed.lateIn !== "—" ? "text-amber-600" : undefined} />
            <InfoRow label="Early Departure"   value={selected.processed?.earlyOut}      accent={selected.processed?.earlyOut && selected.processed.earlyOut !== "—" ? "text-red-600" : undefined} />
            <InfoRow label="Status"            value={code || (selected.isWeekend ? "Weekend" : selected.isHoliday ? "Holiday" : "—")} />
          </div>
        </div>

        {/* Punch timeline */}
        {punches.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Punch Timeline</p>
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-2">
                {punches.map((p, i) => {
                  const isIn = p.type === "IN";
                  return (
                    <div key={i} className="flex items-center gap-3 relative">
                      <span className={`absolute -left-5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm
                        ${isIn ? "bg-emerald-500" : "bg-[#f18200]"}`}>
                        {isIn ? <LogIn size={8} className="text-white" /> : <LogOut size={8} className="text-white" />}
                      </span>
                      <div className={`flex-1 flex items-center justify-between rounded-xl px-3 py-2 border
                        ${isIn ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isIn ? "text-emerald-700" : "text-orange-700"}`}>
                            {isIn ? "Check In" : "Check Out"}
                          </span>
                          {p.location && <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={p.location}>📍 {p.location}</span>}
                        </div>
                        <span className="text-sm font-extrabold text-slate-700 tabular-nums">{p.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {breakSessions > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                <ArrowRightLeft size={12} />
                {breakSessions} break session{breakSessions > 1 ? "s" : ""} · Total break: {fmtMins(breakMins)}
              </div>
            )}
          </div>
        )}

        {/* No data */}
        {!isWorkday && !selected.isHoliday && !selected.pending && (
          <div className="flex flex-col items-center justify-center py-6 text-slate-300">
            <CalendarX size={32} className="mb-2" />
            <p className="text-sm font-semibold">No attendance data</p>
          </div>
        )}
      </div>

      <p className="px-5 py-2.5 text-[10px] text-slate-300 border-t border-slate-100">
        {user?.name || "Employee"} · Break = time between check-out & re-check-in
      </p>
    </div>
  );
});

export default DayDetailPanel;
