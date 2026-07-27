import React from 'react';
import { cssClass, joinClasses } from '../../../../utils/classStyles';
import { EVENT_TYPES } from '../constants/eventTypes';

const CalendarLegend = React.memo(function CalendarLegend({ typeFilter, onTypeFilterChange }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-sm font-semibold text-slate-700 mb-3">Calendar Legend</p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
          <div
            key={key}
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={() => onTypeFilterChange(typeFilter === key ? 'all' : key)}
          >
            <span
              className={joinClasses(
                'w-2.5 h-2.5 rounded-full shrink-0',
                cssClass({ background: cfg.color })
              )}
            />
            <span className={`text-[11px] ${typeFilter === key ? 'font-semibold' : 'text-slate-500'}`}>
              {cfg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CalendarLegend;
