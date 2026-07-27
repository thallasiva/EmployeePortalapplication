import React from 'react';
import { Clock, FileText, Users } from 'lucide-react';
import LeaveEmployeeDetailTable from '../../../../component/admin/LeaveEmployeeDetailTable';
import QuickStatCard from './QuickStatCard';

const QuickStatsSection = React.memo(function QuickStatsSection({
  pendingCount,
  onLeaveTodayCount,
  approvedThisMonth,
  statFilter,
  statDetailRef,
  statDetailTitle,
  statDetailRows,
  onOpenStat,
  onCloseStatFilter,
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Quick Stats — click to view full list
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStatCard
          icon={Clock}
          value={pendingCount}
          label="Pending Requests"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          active={statFilter === 'pending'}
          onClick={() => onOpenStat('pending')}
        />
        <QuickStatCard
          icon={Users}
          value={onLeaveTodayCount}
          label="Team Out Today"
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          active={statFilter === 'teamOut'}
          onClick={() => onOpenStat('teamOut')}
        />
        <QuickStatCard
          icon={FileText}
          value={approvedThisMonth}
          label="Approved This Month"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          active={statFilter === 'approved'}
          onClick={() => onOpenStat('approved')}
        />
      </div>

      {statFilter && (
        <div ref={statDetailRef} className="admin-detail-panel mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{statDetailTitle}</h3>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-800"
              onClick={onCloseStatFilter}
            >
              Close
            </button>
          </div>
          <LeaveEmployeeDetailTable
            rows={statDetailRows}
            emptyMessage="No records for this filter."
          />
        </div>
      )}
    </section>
  );
});

export default QuickStatsSection;
