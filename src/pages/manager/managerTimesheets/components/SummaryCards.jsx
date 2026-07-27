import React from "react";
import { SUMMARY_STATS } from "../constants";

const SummaryCards = React.memo(function SummaryCards({ counts }) {
  if (!counts) return null;
  return (
    <div className="grid grid-cols-3 gap-3">
      {SUMMARY_STATS.map(({ key, label, color }) => (
        <div key={label} className="admin-dash-card py-4 text-center">
          <p className={`text-2xl font-bold ${color}`}>{counts[key] ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
});

export default SummaryCards;
