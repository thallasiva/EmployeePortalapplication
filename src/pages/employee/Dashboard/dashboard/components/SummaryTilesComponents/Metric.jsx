import React from "react";
const Metric = ({
  icon: Icon,
  label,
  children,
  color = "text-[#e87500]",
  tint = "bg-orange-50",
  className = ""
}) => <div className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm ${className}`}>
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tint} ${color}`}><Icon size={18} /></span>
    <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-semibold text-slate-500">{label}</div>{children}</div>
  </div>;
export { Metric };
