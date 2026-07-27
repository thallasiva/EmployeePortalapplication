import React from "react";
import { BarChart3 } from "lucide-react";
import {
  ADMIN_ATTENDANCE_WEEKLY_CHART,
  ADMIN_ATTENDANCE_WEEKLY_SERIES,
  ADMIN_EARLY_LOGOUT_DEPT_CHART,
  ADMIN_NINE_HR_DEPT_CHART,
} from "../../../../data/adminAttendanceData";
import AdminGroupedBarChart from "../../../../component/admin/AdminGroupedBarChart";
import AdminDonutChart from "../../../../component/admin/AdminDonutChart";
import AdminHorizontalBarChart from "../../../../component/admin/AdminHorizontalBarChart";

const AnalyticsSection = React.memo(function AnalyticsSection({ statusChart, summary }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Analytics
      </h2>
      <div className="admin-charts-grid admin-charts-grid--2">
        <div className="admin-dash-card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-gray-500" />
          </div>
          <AdminGroupedBarChart
            title="This Week's Attendance"
            subtitle="Present vs absent across all employees (Mon–Fri)"
            data={ADMIN_ATTENDANCE_WEEKLY_CHART}
            series={ADMIN_ATTENDANCE_WEEKLY_SERIES}
            yLabel="Employees"
            height={200}
            yMax={22}
          />
        </div>
        <div className="admin-dash-card">
          <AdminDonutChart
            title="Today's Status"
            subtitle="All employees breakdown"
            segments={statusChart}
            centerValue={summary.totalEmployees}
            centerLabel="Employees"
          />
        </div>
      </div>
      <div className="admin-charts-grid admin-charts-grid--2 mt-4">
        <div className="admin-dash-card">
          <AdminHorizontalBarChart
            title="9hr Rule Met by Department"
            subtitle="Employees who completed 9 hours today"
            items={ADMIN_NINE_HR_DEPT_CHART}
          />
        </div>
        <div className="admin-dash-card">
          <AdminHorizontalBarChart
            title="Early Logout by Department"
            subtitle="Employees who left before 9 hours"
            items={ADMIN_EARLY_LOGOUT_DEPT_CHART}
          />
        </div>
      </div>
    </section>
  );
});

export default AnalyticsSection;
