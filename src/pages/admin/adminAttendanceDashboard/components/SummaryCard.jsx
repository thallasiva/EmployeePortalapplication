import React from "react";

const SummaryCard = React.memo(function SummaryCard({
  icon: Icon, value, label, suffix, iconBg, iconColor,
}) {
  return (
    <div className="admin-dash-card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="admin-dash-stat-value">
          {value}
          {suffix && (
            <span className="text-base font-normal text-gray-400">{suffix}</span>
          )}
        </p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
});

export default SummaryCard;
