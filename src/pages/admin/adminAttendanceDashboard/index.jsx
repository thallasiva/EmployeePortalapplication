import React, { useCallback } from "react";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import "../adminDashboard.css";
import { useAttendanceDashboard } from "./hooks/useAttendanceDashboard";
import SummaryCard from "./components/SummaryCard";
import TeamStatusGrid from "./components/TeamStatusGrid";
import LateBanner from "./components/LateBanner";
import LateArrivalsSection from "./components/LateArrivalsSection";
import AnalyticsSection from "./components/AnalyticsSection";
import EmployeeSection from "./components/EmployeeSection";

export default function AdminAttendanceDashboard() {
  const {
    employees, summary, loading,
    lateSectionRef, statusChart,
    lateEmployees, tabCounts,
    employeeTab, setEmployeeTab, filteredEmployees,
    handleRegularize,
  } = useAttendanceDashboard();

  const scrollToLate = useCallback(() => {
    setEmployeeTab("late");
    setTimeout(() => {
      lateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [lateSectionRef, setEmployeeTab]);

  return (
    <div className="admin-dash space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track attendance, check-ins, and team availability
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <TeamStatusGrid summary={summary} onScrollToLate={scrollToLate} />
        <SummaryCard icon={Calendar} value={`${summary.attendanceRate}%`} label="Attendance Rate" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <SummaryCard icon={Clock} value={summary.avgHoursPerDay.toFixed(1)} suffix="h" label="Avg Hours / Day" iconBg="bg-blue-50" iconColor="text-blue-600" />
        <SummaryCard icon={AlertTriangle} value={summary.lateThisMonth} label="Late This Month" iconBg="bg-orange-50" iconColor="text-orange-500" />
      </section>

      <LateBanner summary={summary} onScrollToLate={scrollToLate} />

      <LateArrivalsSection lateEmployees={lateEmployees} lateSectionRef={lateSectionRef} />

      <AnalyticsSection statusChart={statusChart} summary={summary} />

      <EmployeeSection
        employees={employees}
        filteredEmployees={filteredEmployees}
        loading={loading}
        employeeTab={employeeTab}
        onTabChange={setEmployeeTab}
        tabCounts={tabCounts}
        onRegularize={handleRegularize}
      />
    </div>
  );
}
