import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const STAT_ITEMS = (stats) => [
  { label: "Total",       value: stats.total,       color: BRAND },
  { label: "Submitted",   value: stats.submitted,   color: "#1d4ed8" },
  { label: "Approved",    value: stats.approved,    color: "#15803d" },
  { label: "Rejected",    value: stats.rejected,    color: "#dc2626" },
  { label: "Not Started", value: stats.not_started, color: "#94a3b8" },
];

const StatsBar = React.memo(function StatsBar({ stats }) {
  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 })}>
      {STAT_ITEMS(stats).map((s) => (
        <div key={s.label}
          className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: "14px 16px", textAlign: "center" })}>
          <p className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 })}>{s.value}</p>
          <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{s.label}</p>
        </div>
      ))}
    </div>
  );
});

export default StatsBar;
