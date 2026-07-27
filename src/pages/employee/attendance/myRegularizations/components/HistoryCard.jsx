import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const HistoryCard = React.memo(function HistoryCard({ record, expanded, onToggle, onViewDetails }) {
  return (
    <div className="border border-sky-200 rounded-lg bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-6 text-left hover:bg-slate-50/50"
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-w-0">
          <div>
            <p className="text-xs text-slate-400">Regularized by</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{record.regularizedBy}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">No. of days</p>
            <p className="text-sm font-semibold text-slate-800">{record.days}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400 tracking-wide">{record.status}</span>
          <span className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <>
          <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Dates applied</p>
              <p className="text-sm font-semibold text-slate-800">{record.datesApplied}</p>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Regularized on</p>
              <p className="text-sm font-semibold text-slate-800">{record.regularizedOn}</p>
            </div>
            <button
              type="button"
              onClick={onViewDetails}
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              View Details
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default HistoryCard;
