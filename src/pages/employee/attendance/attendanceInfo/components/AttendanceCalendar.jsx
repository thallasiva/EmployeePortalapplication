import React from "react";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { toISODateString } from "../../../../../lib/dateUtils";
import { CELL_STYLES } from "../../../../../lib/attendanceUtils";
import { WEEKDAYS } from "../constants";
import LegendDot from "./LegendDot";

const SIX_HOURS_MINUTES = 360;

const AttendanceCalendar = React.memo(function AttendanceCalendar({
  grid, dayMap, monthLabel, selectedIso, today, onSelectDay, onPrevMonth, onNextMonth
}) {
  return (
    <div className="xl:col-span-7 bg-white border border-[#dce3eb] rounded-xl shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8edf2] bg-[#fafbfc]">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#f18200] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[15px] font-bold text-[#1f2937]">{monthLabel}</span>
        <button
          type="button"
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#f18200] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[11px] font-bold text-[#94a3b8] py-1.5 uppercase tracking-wider">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="min-h-[76px]" />;

            const record = dayMap.get(toISODateString(date));
            const isSelected = selectedIso === record.iso;
            const isToday = toISODateString(today) === record.iso;
            const code = record.pending ? "" : record.status.code;
            const workedMinutes = record?.status?.workMinutes ?? 0;
            const needsRegularize =
              !record.isWeekend && !record.isHoliday && !record.pending &&
              workedMinutes > 0 && workedMinutes < SIX_HOURS_MINUTES;

            let cellBg = "bg-white";
            let textCol = "text-[#334155]";
            if (record.isWeekend || record.isHoliday) { cellBg = "bg-[#f8fafc]"; textCol = "text-[#94a3b8]"; }
            if (record.status.code === "P") { cellBg = "bg-[#ecfdf5]"; textCol = "text-[#065f46]"; }
            if (record.status.code === "P:A") { cellBg = "bg-[#fff7ed]"; textCol = "text-[#9a3412]"; }
            if (record.status.code === "A") { cellBg = "bg-[#fff1f2]"; textCol = "text-[#9f1239]"; }
            if (record.status.code === "H") { cellBg = "bg-[#eff6ff]"; textCol = "text-[#1e40af]"; }
            if (record.status.code === "L") { cellBg = "bg-[#faf5ff]"; textCol = "text-[#6b21a8]"; }

            return (
              <button
                key={record.iso}
                type="button"
                onClick={() => onSelectDay(record.iso)}
                className={`relative min-h-[76px] rounded-xl border text-left p-2 transition-all
                  hover:shadow-md hover:border-[#f18200]/40
                  ${cellBg}
                  ${isSelected ? "ring-2 ring-[#f18200] border-[#f18200] z-[1] shadow-md" : "border-[#e8edf2]"}
                `}
              >
                {record.hasRemote && (
                  <Monitor size={11} className="absolute top-1.5 right-1.5 text-[#64748b]" />
                )}
                {/* Warning triangle for late/regularize eligible */}
                {needsRegularize && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" title="Regularization eligible" />
                )}

                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full
                    ${isToday ? "bg-[#f18200] text-white" : isSelected ? "bg-[#f18200] text-white" : textCol}
                  `}
                >
                  {record.day}
                </span>

                {code && (
                  <span className={`block mt-1 text-[11px] font-bold ${textCol}`}>
                    {code}
                  </span>
                )}
                {!record.isWeekend && !record.isHoliday && (
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-[#94a3b8] font-medium">
                    {record.shiftCode}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[#e8edf2] text-xs text-[#64748b]">
          <LegendDot color="bg-[#ecfdf5] border border-[#bbf7d0]" label="P — Full day (≥9h)" />
          <LegendDot color="bg-[#fff7ed] border border-[#fed7aa]" label="P:A — Partial (6–9h)" />
          <LegendDot color="bg-[#fff1f2] border border-[#fecdd3]" label="A — Absent" />
          <LegendDot color="bg-[#eff6ff] border border-[#bfdbfe]" label="H — Holiday" />
          <LegendDot color="bg-[#faf5ff] border border-[#e9d5ff]" label="L — Leave" />
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span>&lt;6h — needs regularization</span>
          </span>
        </div>
      </div>
    </div>
  );
});

export default AttendanceCalendar;
