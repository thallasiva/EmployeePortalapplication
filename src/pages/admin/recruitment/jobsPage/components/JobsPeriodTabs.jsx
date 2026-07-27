import React from "react";
import { PERIODS } from "../constants";

function JobsPeriodTabs({ period, setPeriod, periodCounts }) {
  return (
    <div className="flex items-center gap-1 px-4 pt-3.5 border-b border-gray-100">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => setPeriod(p.key)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer bg-transparent ${
            period === p.key
              ? "border-[#f18200] text-[#f18200]"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          {p.label}
          <span
            className={`text-[10px] font-bold px-1.5 py-px rounded-full ${
              period === p.key ? "bg-[#f18200] text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {periodCounts[p.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

export default React.memo(JobsPeriodTabs);
