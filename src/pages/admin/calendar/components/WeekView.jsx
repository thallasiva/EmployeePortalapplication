import React from 'react';
import { CalendarDays } from 'lucide-react';

const WeekView = React.memo(function WeekView() {
  return (
    <div className="p-4 text-center text-sm text-slate-400 py-10">
      <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
      Switch to Month or List view to see all events.
    </div>
  );
});

export default WeekView;
