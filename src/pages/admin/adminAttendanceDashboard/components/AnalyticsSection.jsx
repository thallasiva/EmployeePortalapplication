import React from "react";
import { BarChart3 } from "lucide-react";
import AdminGroupedBarChart from "../../../../component/admin/AdminGroupedBarChart";
import AdminDonutChart from "../../../../component/admin/AdminDonutChart";
import AdminHorizontalBarChart from "../../../../component/admin/AdminHorizontalBarChart";
const SERIES = [
  { key: "present", name: "Present", color: "#22c55e" },
  { key: "absent", name: "Absent", color: "#f472b6" },
];
const DEPARTMENT_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#8b5cf6", "#14b8a6"];
const AnalyticsSection = React.memo(function AnalyticsSection({ statusChart, summary, analytics }) {
  const nineHourItems = (analytics?.nineHourByDepartment || []).map((item, index) => ({
    ...item,
    value: Number(item.value) || 0,
    color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
  }));
  const earlyLogoutItems = (analytics?.earlyLogoutByDepartment || []).map((item, index) => ({
    ...item,
    value: Number(item.value) || 0,
    color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
  }));
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
            subtitle="Present vs absent by day"
            data={analytics?.weekly || []}
            series={SERIES}
            yLabel="Employees"
            height={200}
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
            items={nineHourItems}
          />
        </div>
        <div className="admin-dash-card">
          <AdminHorizontalBarChart
            title="Early Logout by Department"
            subtitle="Employees who left before 9 hours"
            items={earlyLogoutItems}
          />
        </div>
      </div>
    </section>
  );
});
export default AnalyticsSection;
