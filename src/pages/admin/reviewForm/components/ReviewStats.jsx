import React from "react";
import { joinClasses, cssClass } from "../../../../utils/classStyles";

const ReviewStats = React.memo(function ReviewStats({ stats }) {
  const items = [
    { label: "Total Reviews", value: stats.total, color: "#f18200" },
    { label: "Completed", value: stats.completed, color: "#16a34a" },
    { label: "In Progress", value: stats.inProgress, color: "#f97316" },
    { label: "Pending", value: stats.pending, color: "#6b7280" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((s) => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className={joinClasses("text-2xl font-bold", cssClass({ color: s.color }))}>{s.value}</p>
          <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
});

export default ReviewStats;
