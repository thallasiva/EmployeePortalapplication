import React from "react";

const KPICard = React.memo(function KPICard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="admin-dash-card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
});

export default KPICard;
