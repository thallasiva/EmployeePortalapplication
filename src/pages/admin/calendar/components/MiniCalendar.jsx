import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTHS } from '../constants/eventTypes';
import { buildMonthGrid } from '../utils/calendarUtils';

const MiniCalendar = React.memo(function MiniCalendar({
  year,
  month,
  today,
  filteredMap,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}) {
  const miniGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayDay = today.getDate();
  const isCurrentMonthView =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  const daysWithEvents = useMemo(() => {
    const days = new Set();
    Object.keys(filteredMap).forEach((key) => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        days.add(d.getDate());
      }
    });
    return days;
  }, [filteredMap, year, month]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onPrevMonth} className="p-1 hover:bg-slate-100 rounded">
          <ChevronLeft size={14} />
        </button>
        <p className="text-sm font-semibold text-slate-700">
          {MONTHS[month - 1]} {year}
        </p>
        <button type="button" onClick={onNextMonth} className="p-1 hover:bg-slate-100 rounded">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">
            {d}
          </div>
        ))}
      </div>
      {miniGrid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, di) => {
            const isToday = isCurrentMonthView && cell.current && cell.day === todayDay;
            const hasEvt = cell.current && daysWithEvents.has(cell.day);
            return (
              <div
                key={di}
                className={`relative flex flex-col items-center justify-center h-7 text-[11px] rounded cursor-pointer transition-colors ${
                  isToday
                    ? 'bg-brand text-white font-bold'
                    : cell.current
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-300'
                }`}
                onClick={() => {
                  if (cell.current) {
                    const key = `${year}-${String(month).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                    onDayClick(key);
                  }
                }}
              >
                {cell.day}
                {hasEvt && !isToday && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default MiniCalendar;
