import React from "react";
import { X, ChevronDown } from "lucide-react";
import { getPeopleFilterOptions } from "../../../data/peopleDirectory";

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-slate-200 rounded-md bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

export default function PeopleFilterPanel({
  draft,
  onDraftChange,
  onApply,
  onReset,
  onClose,
}) {
  const options = getPeopleFilterOptions();

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[280px] flex flex-col bg-white border-l border-slate-200 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 border-b border-slate-200">
        <span className="text-sm font-medium text-slate-500">Apply Filter</span>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Close filter"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-4 pb-4 min-h-0">
        <div className="space-y-4">
          <FilterSelect
            label="Location"
            value={draft.location}
            onChange={(v) => onDraftChange({ ...draft, location: v })}
            options={options.locations}
          />
          <FilterSelect
            label="Department"
            value={draft.department}
            onChange={(v) => onDraftChange({ ...draft, department: v })}
            options={options.departments}
          />
          <FilterSelect
            label="Holiday Calendar"
            value={draft.holidayCalendar}
            onChange={(v) => onDraftChange({ ...draft, holidayCalendar: v })}
            options={options.holidayCalendars}
          />
        </div>

        <div className="flex-1" />

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-2.5 text-sm font-medium rounded-md border border-sky-500 text-sky-600 bg-white hover:bg-sky-50 transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 text-sm font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
