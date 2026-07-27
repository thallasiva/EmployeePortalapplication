import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ReviewRow from "./ReviewRow";

const CycleSection = React.memo(function CycleSection({ cycle }) {
  const [collapsed, setCollapsed] = useState(false);
  const completed = cycle.reviews.filter((r) => r.status === "Completed").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div>
            <p className="font-semibold text-[15px] text-gray-900">{cycle.cycle}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {cycle.period} · Due {cycle.dueDate}
            </p>
          </div>
          <StatusBadge status={cycle.status} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[12px] text-gray-500 hidden sm:block">
            {completed}/{cycle.reviews.length} completed
          </span>
          {collapsed ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[12px] text-gray-500 font-semibold">
                <th className="px-4 py-2.5 text-left">Employee</th>
                <th className="px-4 py-2.5 text-left">Reviewer</th>
                <th className="px-4 py-2.5 text-left">Rating</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cycle.reviews.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default CycleSection;
