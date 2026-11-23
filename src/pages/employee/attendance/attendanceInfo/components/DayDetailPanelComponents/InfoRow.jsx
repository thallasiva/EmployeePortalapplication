import React from "react";
const InfoRow = ({
  label,
  value,
  accent
}) => <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className={`text-sm font-bold ${accent || "text-slate-800"}`}>{value || "—"}</span>
  </div>;
export { InfoRow };
