import React from "react";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER } from "./tokens";
function IconGrid({
  active
}) {
  const col = active ? NAVY : "#9ca3af";
  return <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Header strip */}
      <rect x={1} y={1} width={34} height={4} rx={1.5} fill={active ? NAVY : "#d1d5db"} />
      {/* 5 columns */}
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={1 + i * 7} y={7} width={6} height={19} rx={1} fill={active ? "#e0e7f0" : "#f3f4f6"} />)}
      {/* Lines in each column */}
      {[0, 1, 2, 3, 4].map(i => <React.Fragment key={i}>
          <rect x={2 + i * 7} y={9} width={4} height={1} rx={0.4} fill={col} />
          <rect x={2 + i * 7} y={11} width={3} height={1} rx={0.4} fill={col} />
          <rect x={2 + i * 7} y={13} width={4} height={1} rx={0.4} fill={col} />
        </React.Fragment>)}
      {/* Summary on far right (overlap last col) */}
      <rect x={29} y={7} width={6} height={19} rx={1} fill={active ? AMBER + "55" : "#e5e7eb"} />
    </svg>;
}
export { IconGrid };
