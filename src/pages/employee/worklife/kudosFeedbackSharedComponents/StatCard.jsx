import React from "react";
const StatCard = ({
  icon,
  label,
  value,
  hint,
  accent = "bg-orange-50"
}) => <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-3xl font-black  text-[#e87500] mt-0.5">{value ?? "–"}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  </div>;
export { StatCard };
