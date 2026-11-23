import React from "react";
/* ---------- small pieces ---------- */
const Kpi = ({
  icon,
  label,
  value,
  sub,
  tone = " text-[#e87500]"
}) => <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-xl font-black tabular-nums mt-0.5 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>;
export { Kpi };
