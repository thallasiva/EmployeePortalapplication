import React from "react";
const Stat = ({
  label,
  value,
  tone = "text-slate-800"
}) => <div className="flex justify-between gap-3 py-1 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-semibold tabular-nums ${tone}`}>{value}</span>
  </div>;
export { Stat };
