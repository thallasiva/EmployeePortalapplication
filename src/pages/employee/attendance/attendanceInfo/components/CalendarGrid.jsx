import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_STYLES = {
  "P":   { bg: "bg-green-100",  text: "text-green-700",  label: "Present" },
  "P:A": { bg: "bg-teal-100",   text: "text-teal-700",   label: "Half Day" },
  "A":   { bg: "bg-red-100",    text: "text-red-600",    label: "Absent" },
  "H":   { bg: "bg-blue-100",   text: "text-blue-700",   label: "Holiday" },
  "L":   { bg: "bg-purple-100", text: "text-purple-700", label: "Leave" },
  "WO":  { bg: "bg-slate-100",  text: "text-slate-400",  label: "Weekend" },
};

export default function CalendarGrid({ month, year, dayMap, selectedDate, onSelect, onPrevMonth, onNextMonth, loading }) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const pad = String(d).padStart(2, "0");
    const mon = String(month).padStart(2, "0");
    cells.push(`${year}-${mon}-${pad}`);
  }

  const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-bold text-slate-800 tracking-tight">
          {monthName} {year}
        </span>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DOW.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`blank-${idx}`} className="min-h-[72px] border-b border-r border-slate-100 bg-slate-50/50" />;
          }

          const rec = dayMap?.get(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const code = rec?.status?.code || (rec?.isWeekend ? "WO" : rec?.isHoliday ? "H" : null);
          const style = STATUS_STYLES[code] || {};
          const dayNum = parseInt(dateStr.slice(8), 10);
          const canRegularize = rec?.canRegularize;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              disabled={loading}
              className={[
                "min-h-[72px] border-b border-r border-slate-100 p-2 text-left flex flex-col gap-1 transition-all",
                isSelected
                  ? "bg-[#f18200] text-white shadow-inner"
                  : "hover:bg-orange-50/70",
              ].join(" ")}
            >
              {/* Day number row */}
              <div className="flex items-center justify-between">
                <span
                  className={[
                    "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isSelected
                      ? "bg-white text-[#f18200]"
                      : isToday
                      ? "ring-2 ring-[#f18200] text-[#f18200]"
                      : "text-slate-700",
                  ].join(" ")}
                >
                  {dayNum}
                </span>
                {canRegularize && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Eligible for regularization" />
                )}
              </div>

              {/* Status pill */}
              {code && code !== "WO" && (
                <span
                  className={[
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-block leading-tight",
                    isSelected ? "bg-white/25 text-white" : `${style.bg} ${style.text}`,
                  ].join(" ")}
                >
                  {code}
                </span>
              )}

              {/* Check-in time */}
              {rec?.processed?.firstIn && rec.processed.firstIn !== "—" && (
                <span className={`text-[9px] font-medium leading-none ${isSelected ? "text-orange-100" : "text-slate-400"}`}>
                  {rec.processed.firstIn}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        {Object.entries(STATUS_STYLES)
          .filter(([k]) => k !== "WO")
          .map(([code, st]) => (
            <span key={code} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`inline-block w-2 h-2 rounded-sm ${st.bg}`} />
              {st.label}
            </span>
          ))}
      </div>
    </div>
  );
}
