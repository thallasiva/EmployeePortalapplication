import React from "react";
import { Check } from "lucide-react";
import { toISODateString } from "../../../../../lib/dateUtils";
import { WEEKDAYS } from "../constants";

const CalendarPanel = React.memo(function CalendarPanel({
  grid,
  monthLabel,
  todayIso,
  selectedIso,
  isException,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}) {
  return (
    <div className="lg:w-[240px] shrink-0 bg-white border border-slate-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={onPrevMonth} className="text-xs text-slate-500 hover:text-sky-600">
          &lt; Prev
        </button>
        <span className="text-xs font-semibold text-slate-700">{monthLabel}</span>
        <button type="button" onClick={onNextMonth} className="text-xs text-slate-500 hover:text-sky-600">
          Next &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-slate-400 mb-1">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((date, idx) => {
          if (!date) return <div key={`e-${idx}`} className="h-8" />;
          const iso = toISODateString(date);
          const selected = selectedIso === iso;
          const isToday = iso === todayIso;
          const exception = isException(date);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`relative h-8 text-xs rounded flex items-center justify-center ${
                selected || isToday
                  ? "bg-sky-500 text-white font-semibold"
                  : "text-slate-700 hover:bg-sky-50"
              }`}
            >
              {date.getDate()}
              {exception && !selected && (
                <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-t-amber-500 border-l-[5px] border-l-transparent" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 px-2 py-2 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-700">
        <Check size={14} className="shrink-0" />
        All exception days are regularized
      </div>
    </div>
  );
});

export default CalendarPanel;
