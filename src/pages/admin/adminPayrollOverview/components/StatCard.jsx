import React from "react";
import { cssClass } from "../../../../utils/classStyles";

// KPI tile used across the top row.
export default function StatCard({ icon, label, value, sub, accent = "#f18200", tint = "#fff7ed", alert = false }) {
  return (
    <div className={cssClass({
      background: "#fff", border: `1px solid ${alert ? "#fee2e2" : "#eef0f3"}`,
      borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column",
      gap: 8, boxShadow: "0 1px 2px rgba(16,24,40,.04)",
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
        <div className={cssClass({ width: 34, height: 34, borderRadius: 9, background: tint, color: accent, display: "flex", alignItems: "center", justifyContent: "center" })}>{icon}</div>
        <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#667085" })}>{label}</div>
      </div>
      <div className={cssClass({ fontSize: 24, fontWeight: 900, lineHeight: 1.1, color: alert ? "#dc2626" : "#111827" })}>{value}</div>
      {sub && <div className={cssClass({ fontSize: 11.5, color: alert ? "#dc2626" : "#98a2b3" })}>{sub}</div>}
    </div>
  );
}
