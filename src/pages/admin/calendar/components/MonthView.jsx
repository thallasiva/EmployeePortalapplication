import React, { useMemo } from 'react';
import { DAYS } from '../constants/eventTypes';
import { buildMonthGrid } from '../utils/calendarUtils';
import EventChip from './EventChip';

const MonthView = React.memo(function MonthView({
  year,
  month,
  today,
  filteredMap,
  onDayClick,
  onDeleteEvent,
}) {
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayDay = today.getDate();
  const isCurrentMonthView =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
          {week.map((cell, di) => {
            const key = cell.current
              ? `${year}-${String(month).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
              : null;
            const dayEvents = key ? filteredMap[key] || [] : [];
            const isToday = isCurrentMonthView && cell.current && cell.day === todayDay;

            return (
              <div
                key={di}
                className={`min-h-[90px] p-1.5 border-r border-slate-100 last:border-r-0 ${
                  !cell.current ? 'bg-slate-50/50' : ''
                } hover:bg-slate-50 cursor-pointer transition-colors`}
                onClick={() => { if (cell.current) onDayClick(key); }}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full mb-1 ${
                    isToday
                      ? 'bg-brand text-white'
                      : cell.current
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((evt, ei) => (
                    <EventChip
                      key={evt.id || ei}
                      type={evt.type}
                      label={evt.label}
                      onDelete={evt.deletable ? () => onDeleteEvent(evt.event_id) : null}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-1">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default MonthView;
