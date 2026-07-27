import React from "react";
import { LEVEL_ORDER } from "../constants";

const COLORS = ["#6d28d9", "#0369a1", "#f18200", "#d97706", "#dc2626"];
const BGS = ["#ede9fe", "#e0f2fe", "#fff7ed", "#fef3c7", "#fee2e2"];

const RoundBadge = React.memo(function RoundBadge({ level }) {
  const idx = LEVEL_ORDER.indexOf(level);
  const num = idx >= 0 ? idx + 1 : "?";
  const c = COLORS[idx] || "#6b7280";
  const b = BGS[idx] || "#f3f4f6";
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{ background: c }}
      >
        {num}
      </span>
      <span
        className="text-[12px] font-semibold px-2 py-[2px] rounded-full"
        style={{ background: b, color: c }}
      >
        {level}
      </span>
    </div>
  );
});

export default RoundBadge;
