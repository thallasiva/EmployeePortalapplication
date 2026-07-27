import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS } from "../constants";

const ShiftLegend = React.memo(() => (
  <div className={cssClass({ marginTop: 18, padding: "14px 18px", borderRadius: 10,
    background: "#fff8f0", border: "1px solid #fed7aa",
    display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 })}>
    {SHIFTS.map((s) => (
      <div key={s.key} className={cssClass({ display: "flex", gap: 10 })}>
        <span className={cssClass({ color: s.color, marginTop: 1 })}>{s.icon}</span>
        <div>
          <div className={cssClass({ fontSize: 12, fontWeight: 700, color: s.color })}>{s.label}</div>
          <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>
            {s.key === "general" && "Standard 9–6 employees — national + state public holidays"}
            {s.key === "mid"     && "Afternoon–evening shift — may skip AM-only public events"}
            {s.key === "night"   && "Overnight shift — holiday carries over to next calendar day"}
          </div>
        </div>
      </div>
    ))}
  </div>
));

ShiftLegend.displayName = "ShiftLegend";
export default ShiftLegend;
