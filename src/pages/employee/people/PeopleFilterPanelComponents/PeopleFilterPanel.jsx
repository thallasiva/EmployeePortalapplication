import React from "react";
import { X } from "lucide-react";
import { getPeopleFilterOptions } from "../../../../data/peopleDirectory";
import { FilterSelect } from "./FilterSelect";
function PeopleFilterPanel({
  draft,
  onDraftChange,
  onApply,
  onReset,
  onClose
}) {
  const options = getPeopleFilterOptions();
  return <div className="absolute inset-y-0 right-0 z-30 w-[280px] flex flex-col bg-white border-l border-slate-200 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100/90 border-b border-slate-200">
        <span className="text-sm font-medium text-slate-500">Apply Filter</span>
        <button type="button" onClick={onClose} className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50" aria-label="Close filter">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 flex flex-col px-4 pt-4 pb-4 min-h-0">
        <div className="space-y-4">
          <FilterSelect label="Location" value={draft.location} onChange={v => onDraftChange({
          ...draft,
          location: v
        })} options={options.locations} />
          <FilterSelect label="Department" value={draft.department} onChange={v => onDraftChange({
          ...draft,
          department: v
        })} options={options.departments} />
          <FilterSelect label="Holiday Calendar" value={draft.holidayCalendar} onChange={v => onDraftChange({
          ...draft,
          holidayCalendar: v
        })} options={options.holidayCalendars} />
        </div>
        <div className="flex-1" />
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onApply} className="flex-1 py-2.5 text-sm font-medium rounded-md border border-sky-500 text-sky-600 bg-white hover:bg-sky-50 transition-colors">
            Apply
          </button>
          <button type="button" onClick={onReset} className="flex-1 py-2.5 text-sm font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors">
            Reset
          </button>
        </div>
      </div>
    </div>;
}
export { PeopleFilterPanel };
