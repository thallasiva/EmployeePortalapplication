import React from "react";
import { C } from "./shared";
/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({
  current,
  total
}) {
  if (!total) return null;
  const pct = Math.round(current / total * 100);
  return <div style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 160
  }}>
      <span style={{
      fontSize: 12,
      color: C.muted,
      fontWeight: 600,
      whiteSpace: "nowrap"
    }}>Q{current}/{total}</span>
      <div style={{
      flex: 1,
      height: 4,
      background: C.border,
      borderRadius: 2,
      overflow: "hidden"
    }}>
        <div style={{
        width: `${pct}%`,
        height: "100%",
        background: `linear-gradient(90deg,${C.accent},${C.teal})`,
        borderRadius: 2,
        transition: "width .5s ease"
      }} />
      </div>
      <span style={{
      fontSize: 12,
      color: C.muted
    }}>{pct}%</span>
    </div>;
}
/* ─── MCQ ────────────────────────────────────────────────────────────────── */
export { ProgressBar };
