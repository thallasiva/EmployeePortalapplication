import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

export const Grid = React.memo(function Grid({ children, cols = 3 }) {
  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: "4px 16px" })}>
      {children}
    </div>
  );
});

export const SectionLabel = React.memo(function SectionLabel({ label, color = "#64748b" }) {
  return (
    <div className={cssClass({ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color, marginBottom: 10, marginTop: 14 })}>
      {label}
    </div>
  );
});

export const Badge = React.memo(function Badge({ children, color = "#16a34a" }) {
  return (
    <span className={cssClass({ background: color + "18", color, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 })}>
      {children}
    </span>
  );
});
