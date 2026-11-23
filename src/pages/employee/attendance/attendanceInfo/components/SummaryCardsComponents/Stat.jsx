import React from "react";
const Stat = ({
  icon,
  iconBg,
  label,
  value,
  sub,
  accent
}) => <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4 min-w-0 flex-1">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest truncate">{label}</p>
      <p className={`text-[26px] font-extrabold leading-tight ${accent || "text-slate-800"}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>;
export { Stat };
