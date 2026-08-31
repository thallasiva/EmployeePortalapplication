import React, { useMemo } from "react";
import { X, MapPin, Clock, Coffee, AlertCircle } from "lucide-react";

function fmt(t) {
  if (!t || t === "—") return "—";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function DayDrawer({ selected, onClose }) {
  const raw = selected?.raw || {};
  const punches = useMemo(() => {
    const arr = raw.punches || [];
    return arr.map((p) => ({
      type: p.punch_type || p.type,
      time: p.punch_time || p.time,
      location: p.location,
    }));
  }, [raw.punches]);

  if (!selected) return null;

  const proc = selected.processed || {};
  const { firstIn, lastOut, workHours } = proc;
  const breakMins = raw.break_minutes ?? 0;
  const status = selected.status || {};

  const dateLabel = new Date(selected.date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* ── Orange header ── */}
      <div className="bg-gradient-to-br from-[#f18200] to-[#d97000] px-5 pt-5 pb-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-orange-200 uppercase tracking-widest">{dateLabel}</p>
            {status.label && (
              <span className="mt-1 inline-block text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                {status.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Big time display */}
        <div className="flex items-end gap-6 mt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200">Check In</p>
            <p className="text-3xl font-black tracking-tight tabular-nums">{fmt(firstIn)}</p>
          </div>
          {lastOut && lastOut !== "—" && (
            <>
              <div className="w-6 h-px bg-orange-300 mb-3" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200">Check Out</p>
                <p className="text-3xl font-black tracking-tight tabular-nums">{fmt(lastOut)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { icon: Clock,        color: "text-green-600",  bg: "bg-green-50",  label: "Work",  val: workHours || "—" },
          { icon: Coffee,       color: "text-amber-600",  bg: "bg-amber-50",  label: "Break", val: breakMins ? `${breakMins}m` : "—" },
          { icon: AlertCircle,  color: "text-[#f18200]",  bg: "bg-orange-50", label: "Late",  val: raw.late_by_minutes ? `${raw.late_by_minutes}m` : "—" },
        ].map(({ icon: Icon, color, bg, label, val }) => (
          <div key={label} className="flex flex-col items-center py-4 gap-1">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-base font-black text-slate-800 tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      {/* ── Punch timeline ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {punches.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No punch records for this day.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Punch Timeline</p>
            {punches.map((p, i) => {
              const isIn = p.type === "IN";
              return (
                <div key={i} className="flex items-start gap-3">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-3 h-3 rounded-full border-2 ${isIn ? "border-green-500 bg-green-100" : "border-[#f18200] bg-orange-100"}`} />
                    {i < punches.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" style={{ minHeight: 24 }} />}
                  </div>
                  {/* Card */}
                  <div className={`flex-1 rounded-xl border px-3 py-2.5 mb-1 ${isIn ? "border-green-100 bg-green-50/50" : "border-orange-100 bg-orange-50/50"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isIn ? "text-green-700" : "text-[#f18200]"}`}>
                        {isIn ? "▶ Check In" : "⏸ Check Out"}
                      </span>
                      <span className="text-sm font-black text-slate-800 tabular-nums">{fmt(p.time)}</span>
                    </div>
                    {p.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-400 truncate">{p.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
