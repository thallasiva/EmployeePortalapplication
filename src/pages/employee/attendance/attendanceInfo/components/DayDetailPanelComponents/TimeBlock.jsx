import React from "react";
const TimeBlock = ({
  icon,
  label,
  time,
  color
}) => <div className={`flex-1 rounded-xl p-3 flex flex-col items-center gap-1 border ${color}`}>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">{icon}{label}</div>
    <span className="text-xl font-extrabold text-slate-800 tracking-tight">{time || "—"}</span>
  </div>;
export { TimeBlock };
