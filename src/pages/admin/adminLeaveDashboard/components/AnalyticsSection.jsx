import React from 'react';
import AdminGroupedBarChart from '../../../../component/admin/AdminGroupedBarChart';
import AdminDonutChart from '../../../../component/admin/AdminDonutChart';
import {
  ADMIN_LEAVE_MONTHLY_CHART,
  ADMIN_LEAVE_MONTHLY_SERIES,
} from '../../../../data/adminLeaveData';

const AnalyticsSection = React.memo(function AnalyticsSection({
  requestChart,
  totalRequests,
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Analytics
      </h2>
      <div className="admin-charts-grid admin-charts-grid--2">
        <div className="admin-dash-card">
          <AdminGroupedBarChart
            title="Monthly Leave Usage"
            subtitle="Sick, Earned & Casual leave days consumed"
            data={ADMIN_LEAVE_MONTHLY_CHART}
            series={ADMIN_LEAVE_MONTHLY_SERIES}
            yLabel="Days"
            height={200}
          />
        </div>
        <div className="admin-dash-card">
          <AdminDonutChart
            title="Request Status"
            subtitle="Live counts from employee requests"
            segments={requestChart}
            centerValue={totalRequests}
            centerLabel="Total"
          />
        </div>
      </div>
    </section>
  );
});

export default AnalyticsSection;
