import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const StatChip = React.memo(function StatChip({ color, label, count }) {
  return (
    <div className={cssClass({
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8,
      background: "#f8fafc", border: "1px solid #e8edf2",
    })}>
      <span className={cssClass({ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" })} />
      <span className={cssClass({ fontSize: 12, color: "#555", fontWeight: 500 })}>{label}</span>
      <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1a2233" })}>{count}</span>
    </div>
  );
});

export default StatChip;
