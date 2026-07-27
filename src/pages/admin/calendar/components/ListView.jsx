import React from 'react';
import { CalendarDays } from 'lucide-react';
import { DAYS } from '../constants/eventTypes';
import EventChip from './EventChip';

const ListView = React.memo(function ListView({
  year,
  month,
  loading,
  filteredMap,
  onDeleteEvent,
}) {
  const monthEntries = Object.entries(filteredMap).filter(([k]) => {
    const d = new Date(k);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-400 text-center py-8">Loading events…</p>
      </div>
    );
  }

  if (monthEntries.length === 0) {
    return (
      <div className="p-4">
        <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
          <CalendarDays size={36} className="opacity-30" />
          <p className="text-sm">No events this month.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {monthEntries
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateStr, events]) => (
            <div
              key={dateStr}
              className="flex gap-4 items-start py-3 border-b border-slate-100 last:border-b-0"
            >
              <div className="w-16 shrink-0 text-center">
                <p className="text-xs text-slate-400">{DAYS[new Date(dateStr).getDay()]}</p>
                <p className="text-lg font-bold text-slate-800">{new Date(dateStr).getDate()}</p>
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {events.map((evt, i) => (
                  <EventChip
                    key={evt.id || i}
                    type={evt.type}
                    label={evt.label}
                    onDelete={evt.deletable ? () => onDeleteEvent(evt.event_id) : null}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
});

export default ListView;
