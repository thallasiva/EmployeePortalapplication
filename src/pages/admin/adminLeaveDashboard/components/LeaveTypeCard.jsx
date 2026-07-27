import React from 'react';
import { Calendar } from 'lucide-react';
import { cssClass } from '../../../../utils/classStyles';
import { LEAVE_ICON, LEAVE_COLOR } from '../constants/leaveConstants';

const LeaveTypeCard = React.memo(function LeaveTypeCard({ item }) {
  const Icon = LEAVE_ICON[item.icon] || Calendar;
  const colors = LEAVE_COLOR[item.color] || LEAVE_COLOR.green;
  const pct = item.totalQuota
    ? Math.round((item.usedThisMonth / item.totalQuota) * 100)
    : 0;

  return (
    <div className="admin-dash-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
        <span className="text-xs font-medium text-gray-500">
          {item.onLeaveToday} on leave today
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600">{item.label}</p>
      <p className="admin-dash-stat-value mt-1">
        {item.usedThisMonth}
        <span className="text-base font-normal text-gray-400"> / {item.totalQuota} days used</span>
      </p>
      <div className="admin-dash-progress mt-3">
        <span className={cssClass({ width: `${pct}%`, background: colors.bar })} />
      </div>
    </div>
  );
});

export default LeaveTypeCard;
