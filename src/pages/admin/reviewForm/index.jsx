import React from "react";
import { User } from "lucide-react";
import { useReviewForm } from "./hooks/useReviewForm";
import ReviewStats from "./components/ReviewStats";
import CycleSection from "./components/CycleSection";

export default function ReviewForm() {
  const { filterStatus, filteredCycles, stats, statuses, handleFilterChange } = useReviewForm();

  return (
    <div className="space-y-5">
      <ReviewStats stats={stats} />

      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-500 font-medium">Filter:</span>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleFilterChange(s)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
              filterStatus === s
                ? "bg-[#f18200] text-white border-[#f18200]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filteredCycles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No reviews match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCycles.map((cycle) => (
            <CycleSection key={cycle.id} cycle={cycle} />
          ))}
        </div>
      )}
    </div>
  );
}
