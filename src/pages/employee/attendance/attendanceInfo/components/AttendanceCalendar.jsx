import React from "react";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { toISODateString } from "../../../../../lib/dateUtils";
import { CELL_STYLES } from "../../../../../lib/attendanceUtils";
import { WEEKDAYS } from "../constants";
import LegendDot from "./LegendDot";

const AttendanceCalendar = React.memo(function AttendanceCalendar({
  grid,
  dayMap,
  monthLabel,
  selectedIso,
  today,
  onSelectDay,
  onPrevMonth,
  onNextMonth
}) {
  return (
    <div className="xl:col-span-7 bg-white border border-[#dce3eb] rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8edf2]">
        <button
          type="button"
          onClick={onPrevMonth}
          className="text-sm text-[#64748b] hover:text-brand flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <span className="text-base font-semibold text-[#1f2937]">{monthLabel}</span>
        <button
          type="button"
          onClick={onNextMonth}
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
                onClick={() => onSelectDay(record.iso)}
                className={`relative min-h-[72px] rounded border border-[#e8edf2] text-left p-1.5 transition-all hover:ring-2 hover:ring-brand/40 ${cellStyle} ${
                  isSelected ? "ring-2 ring-brand z-[1]" : ""
                }`}
              >
                {record.hasRemote && (
                  <Monitor size={12} className="absolute top-1 right-1 text-[#64748b]" />
                )}
                {record.hasWarning && (
                  <span className="absolute bottom-1 left-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-amber-500" />
                )}
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full ${
                    isSelected || isToday ? "bg-brand text-white" : "text-[#334155]"
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
  );
});

export default AttendanceCalendar;
