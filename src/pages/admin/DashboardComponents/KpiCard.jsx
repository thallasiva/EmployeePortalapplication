import React from "react";
import { ArrowRight } from "lucide-react";
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
  onClick
}) {
  return <button type="button" onClick={onClick} className={`admin-dash-kpi ${className} p-4 rounded-xl shadow-sm flex justify-between items-start text-left w-full`}>
      <div>
        <p className="text-sm opacity-90">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        <p className="admin-dash-kpi__link">View details <ArrowRight size={12} className="inline -mt-0.5" /></p>
      </div>
      <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
        <Icon size={22} />
      </div>
    </button>;
}
export { KpiCard };
