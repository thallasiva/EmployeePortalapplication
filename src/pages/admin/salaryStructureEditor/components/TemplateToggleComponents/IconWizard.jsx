import React from "react";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER } from "./tokens";
function IconWizard({
  active
}) {
  const col = active ? NAVY : "#9ca3af";
  return <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Step circles */}
      {[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={3 + i * 6} cy={4} r={2} fill={i === 0 ? AMBER : i < 2 ? "#22c55e" : active ? "#e0e7f0" : "#e5e7eb"} />)}
      {/* Connectors */}
      {[0, 1, 2, 3, 4].map(i => <rect key={i} x={5 + i * 6} y={3.5} width={2} height={1} rx={0.3} fill={i < 1 ? "#22c55e" : active ? "#d1d5db" : "#e5e7eb"} />)}
      {/* Left sidebar */}
      <rect x={1} y={8} width={7} height={18} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={2} y={10} width={5} height={1} rx={0.4} fill={col} />
      <rect x={2} y={12} width={4} height={1} rx={0.4} fill={col} />
      <rect x={2} y={14} width={5} height={1} rx={0.4} fill={col} />
      {/* Main content */}
      <rect x={10} y={8} width={16} height={18} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={11} y={10} width={14} height={2} rx={0.5} fill={active ? NAVY + "33" : "#e5e7eb"} />
      <rect x={11} y={13} width={12} height={1} rx={0.4} fill={col} />
      <rect x={11} y={15} width={10} height={1} rx={0.4} fill={col} />
      <rect x={11} y={17} width={11} height={1} rx={0.4} fill={col} />
      {/* Right sidebar */}
      <rect x={28} y={8} width={7} height={18} rx={1.5} fill={active ? AMBER + "55" : "#e5e7eb"} />
    </svg>;
}
export { IconWizard };
