import React from "react";
import { NAVY } from "./shared";
// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({
  slices
}) {
  const R = 52,
    CX = 68,
    CY = 68,
    stroke = 19;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return <svg width={136} height={136} viewBox="0 0 136 136">
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
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={9} fill="#6b7280">CTC</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={12} fontWeight="bold" fill={NAVY}>Live</text>
    </svg>;
}
// ─── Accordion section ─────────────────────────────────────────────────────────
export { DonutChart };
