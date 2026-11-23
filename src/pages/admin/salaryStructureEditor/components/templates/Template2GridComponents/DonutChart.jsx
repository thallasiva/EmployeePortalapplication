import React from "react";
import { NAVY } from "./shared";
// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({
  slices
}) {
  const R = 48,
    CX = 64,
    CY = 64,
    stroke = 18;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      {slices.map((s, i) => {
      const dash = s.pct / 100 * circ;
      const el = <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} style={{
        transform: "rotate(-90deg)",
        transformOrigin: `${CX}px ${CY}px`
      }} />;
      offset += dash;
      return el;
    })}
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={8} fill="#9ca3af">CTC</text>
      <text x={CX} y={CY + 9} textAnchor="middle" fontSize={10} fontWeight="bold" fill={NAVY}>Total</text>
    </svg>;
}
// ─── Mini section panel ───────────────────────────────────────────────────────
export { DonutChart };
