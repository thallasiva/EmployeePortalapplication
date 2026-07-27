import React from 'react';
import { MONTHS, EVENT_TYPES } from '../constants/eventTypes';
import { cssClass, joinClasses } from '../../../../utils/classStyles';

const UpcomingEvents = React.memo(function UpcomingEvents({ loading, upcomingEvents, today }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Upcoming Events</p>
      </div>
      {loading ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : upcomingEvents.length === 0 ? (
        <p className="text-xs text-slate-400">No upcoming events.</p>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((evt, i) => {
            const cfg = EVENT_TYPES[evt.type] || EVENT_TYPES.training;
            const d = evt.dateObj;
            const isUpcoming = d > today;
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={joinClasses(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0',
                    cssClass({ background: cfg.bg })
                  )}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{evt.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}
                  </p>
                </div>
                <span
                  className={joinClasses(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                    cssClass({ background: cfg.bg, color: cfg.color })
                  )}
                >
                  {evt.type === 'leave'
                    ? 'Approved'
                    : evt.type === 'holiday'
                    ? 'Holiday'
                    : isUpcoming
                    ? 'Upcoming'
                    : 'Today'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default UpcomingEvents;
