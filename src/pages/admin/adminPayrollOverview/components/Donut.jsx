import React from "react";
import { cssClass } from "../../../../utils/classStyles";

// Reusable SVG ring gauge. Used by Payroll Health and Process Overview.
export default function Donut({ percent = 0, size = 132, stroke = 13, color = "#16a34a", track = "#eef2f7", center, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className={cssClass({ position: "relative", width: size, height: size })}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={cssClass({ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
        <div className={cssClass({ fontSize: 22, fontWeight: 900, color: "#111827" })}>{center}</div>
        {sub && <div className={cssClass({ fontSize: 11, color: "#98a2b3", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" })}>{sub}</div>}
      </div>
    </div>
  );
}
