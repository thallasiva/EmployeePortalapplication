import React, { useMemo } from "react";
import { REC_CLS } from "../constants/recClasses";

const REC_LABELS = [
  { label: "Highly Suitable", key: "Highly Suitable" },
  { label: "Suitable", key: "Suitable" },
  { label: "Partial", key: "Partially Suitable" },
  { label: "Not Suitable", key: "Not Suitable" },
];

const RankStats = React.memo(function RankStats({ filtered }) {
  const stats = useMemo(
    () =>
      REC_LABELS.map(({ label, key }) => ({
        label,
        count: filtered.filter((m) => m.recommendation === key).length,
        ...REC_CLS[key],
      })),
    [filtered],
  );

  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {stats.map((s) => (
        <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${s.bg}`}>
          <span className={`text-[14px] font-extrabold ${s.text}`}>{s.count}</span>
          <span className={`text-[11px] font-semibold ${s.text}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
});

export default RankStats;
