import React from "react";
import { Link } from "react-router-dom";
function KpiCard({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
  to
}) {
  const inner = <div className="admin-dash-card flex items-center gap-4 h-full">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="admin-dash-stat-value">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>;
  return to ? <Link to={to}>{inner}</Link> : inner;
}
export { KpiCard };
