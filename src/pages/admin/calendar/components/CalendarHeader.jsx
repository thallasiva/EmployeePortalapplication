import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EVENT_TYPES, MONTHS } from '../constants/eventTypes';

const CalendarHeader = React.memo(function CalendarHeader({
  typeFilter,
  onTypeFilterChange,
  year,
  month,
  viewMode,
  onViewModeChange,
  onPrevMonth,
  onNextMonth,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="all">All Events</option>
        {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-2 ml-auto">
        <button type="button" onClick={onPrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-slate-800 min-w-[110px] text-center">
          {MONTHS[month - 1]} {year}
        </span>
        <button type="button" onClick={onNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
        {['month', 'week', 'list'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewModeChange(v)}
            className={`px-4 py-1.5 capitalize font-medium ${
              viewMode === v ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
});

export default CalendarHeader;
