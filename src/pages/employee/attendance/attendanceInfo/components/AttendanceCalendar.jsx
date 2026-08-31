import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toISODateString } from "../../../../../lib/dateUtils";
import { WEEKDAYS } from "../constants";

const STATUS_STYLES = {
  P:   { bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500",  text: "text-emerald-700",  badge: "bg-emerald-100 text-emerald-700" },
  "P:A": { bg: "bg-amber-50", border: "border-amber-200",   dot: "bg-amber-400",    text: "text-amber-700",    badge: "bg-amber-100 text-amber-700" },
  A:   { bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500",      text: "text-red-700",      badge: "bg-red-100 text-red-700" },
  H:   { bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-400",     text: "text-blue-700",     badge: "bg-blue-100 text-blue-700" },
  L:   { bg: "bg-purple-50",  border: "border-purple-200",  dot: "bg-purple-400",   text: "text-purple-700",   badge: "bg-purple-100 text-purple-700" },
  WO:  { bg: "bg-slate-50",   border: "border-slate-150",   dot: "bg-slate-300",    text: "text-slate-400",    badge: "bg-slate-100 text-slate-500" },
};

const getStyle = (record) => {
  if (record.isWeekend || record.isHoliday) return STATUS_STYLES.WO;
  return STATUS_STYLES[record.status?.code] || {};
};

const AttendanceCalendar = React.memo(function AttendanceCalendar({
  grid, dayMap, monthLabel, selectedIso, today, onSelectDay, onPrevMonth, onNextMonth
}) {
  const todayIso = toISODateString(today);

  return (
    <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#f18200] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-base font-extrabold text-slate-800 tracking-tight">{monthLabel}</p>
        </div>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#f18200] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="p-4 flex-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase tracking-widest">
              {wd}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date, idx) => {
            if (!date) return <div key={`e-${idx}`} />;

            const record = dayMap.get(toISODateString(date));
            const iso = record?.iso || toISODateString(date);
            const isSelected = selectedIso === iso;
            const isToday = todayIso === iso;
            const style = getStyle(record);
            const code = record?.pending ? "" : (record?.status?.code || "");
            const isWeekendOrHoliday = record?.isWeekend || record?.isHoliday;
            const workedMins = record?.status?.workMinutes ?? 0;
            const needsReg = !isWeekendOrHoliday && !record?.pending && workedMins > 0 && workedMins < 360;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDay(iso)}
                className={`relative rounded-xl border transition-all text-left p-2 min-h-[70px] flex flex-col
                  ${isWeekendOrHoliday ? "bg-slate-50 border-slate-100" : (style.bg || "bg-white") + " " + (style.border || "border-slate-200")}
                  ${isSelected
                    ? "ring-2 ring-[#f18200] border-[#f18200] shadow-md shadow-orange-100 z-10"
                    : "hover:shadow-sm hover:border-slate-300"
                  }
                `}
              >
                {/* Date number */}
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0
                  ${isToday
                    ? "bg-[#f18200] text-white shadow-sm"
                    : isSelected
                    ? "bg-orange-100 text-[#f18200]"
                    : isWeekendOrHoliday ? "text-slate-400" : (style.text || "text-slate-700")
                  }`}
                >
                  {record?.day ?? date.getDate()}
                </span>

                {/* Status badge */}
                {code && !isWeekendOrHoliday && (
                  <span className={`mt-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md self-start ${style.badge || "bg-slate-100 text-slate-500"}`}>
                    {code}
                  </span>
                )}

                {/* Weekend / Holiday label */}
                {isWeekendOrHoliday && (
                  <span className="mt-auto text-[9px] font-semibold text-slate-300 self-start">
                    {record?.isHoliday ? "HOL" : "OFF"}
                  </span>
                )}

                {/* Regularization dot */}
                {needsReg && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" title="Eligible for regularization" />
                )}

                {/* Today ring */}
                {isToday && !isSelected && (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-orange-300 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-slate-100">
          {[
            { dot: "bg-emerald-500", label: "P — Present (≥9h)" },
            { dot: "bg-amber-400",   label: "P:A — Partial (6–9h)" },
            { dot: "bg-red-500",     label: "A — Absent" },
            { dot: "bg-blue-400",    label: "H — Holiday" },
            { dot: "bg-purple-400",  label: "L — Leave" },
            { dot: "bg-amber-400 ring-2 ring-white ring-offset-1", label: "<6h — regularize" },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default AttendanceCalendar;
