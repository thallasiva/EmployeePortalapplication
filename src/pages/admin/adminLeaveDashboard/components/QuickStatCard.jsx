import React from 'react';

const QuickStatCard = React.memo(function QuickStatCard({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-dash-card admin-stat-card-clickable flex items-center gap-4 text-left w-full ${
        active ? 'active' : ''
      }`}
    >
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="admin-dash-stat-value">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-emerald-600 mt-1">Click to view list</p>
      </div>
    </button>
  );
});

export default QuickStatCard;
