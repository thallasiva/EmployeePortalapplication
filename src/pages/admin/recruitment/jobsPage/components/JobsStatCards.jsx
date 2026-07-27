import React from "react";
import { Card } from "../shared";

const STATS_CONFIG = [
  { label: "Total Jobs", colorClass: "text-[#1a2535]", key: "totalCount" },
  { label: "Open", colorClass: "text-green-600", key: "totalOpen" },
  { label: "Completed", colorClass: "text-purple-600", key: "totalCompleted" },
  { label: "Total Openings", colorClass: "text-[#f18200]", key: "totalCount" },
];

function JobsStatCards({ totalCount, totalOpen, totalCompleted }) {
  const values = { totalCount, totalOpen, totalCompleted };
  return (
    <div className="grid grid-cols-4 gap-3.5 mb-5">
      {STATS_CONFIG.map((s) => (
        <Card key={s.label} style={{ padding: "14px 18px" }}>
          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
            {s.label}
          </div>
          <div className={`text-[26px] font-bold ${s.colorClass}`}>{values[s.key]}</div>
        </Card>
      ))}
    </div>
  );
}

export default React.memo(JobsStatCards);
