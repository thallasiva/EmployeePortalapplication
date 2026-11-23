import React from "react";
function Badge({
  children,
  color = "green"
}) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-600 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-[#e87500] border-blue-200",
    gray: "bg-slate-100 text-slate-500 border-slate-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    orange: "bg-[#fff8f0] text-[#e87500] border-[#fed7aa]"
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[color] || map.gray}`}>
      {children}
    </span>;
}
export { Badge };
