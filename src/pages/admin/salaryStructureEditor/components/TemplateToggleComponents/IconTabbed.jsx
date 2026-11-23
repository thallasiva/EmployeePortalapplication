import React from "react";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER, AMBER_INACT } from "./tokens";
// ─── Preview icon SVGs ────────────────────────────────────────────────────────
function IconTabbed({
  active
}) {
  const col = active ? NAVY : "#9ca3af";
  return <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Tab bar */}
      <rect x={1} y={1} width={34} height={5} rx={1.5} fill={active ? AMBER : AMBER_INACT} />
      <rect x={1} y={1} width={10} height={5} rx={1.5} fill={active ? NAVY : "#d1d5db"} />
      {/* 2-column content */}
      <rect x={1} y={8} width={16} height={10} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={19} y={8} width={16} height={10} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      {/* Summary sidebar */}
      <rect x={28} y={8} width={7} height={18} rx={1.5} fill={active ? AMBER + "55" : "#e5e7eb"} />
      {/* Lines */}
      <rect x={2} y={10} width={13} height={1} rx={0.5} fill={col} />
      <rect x={2} y={12} width={10} height={1} rx={0.5} fill={col} />
      <rect x={2} y={14} width={12} height={1} rx={0.5} fill={col} />
      <rect x={20} y={10} width={6} height={1} rx={0.5} fill={col} />
      <rect x={20} y={12} width={8} height={1} rx={0.5} fill={col} />
    </svg>;
}
export { IconTabbed };
