import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ADMIN_ALL_EMPLOYEES,
  ADMIN_ATTENDANCE_STATUS_CHART,
  ADMIN_ATTENDANCE_SUMMARY,
  ADMIN_ATTENDANCE_WEEKLY_CHART,
  ADMIN_ATTENDANCE_WEEKLY_SERIES,
  ADMIN_EARLY_LOGOUT_DEPT_CHART,
  ADMIN_NINE_HR_DEPT_CHART,
  ATTENDANCE_LEGEND,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
} from "../../data/adminAttendanceData";
import AdminGroupedBarChart from "../../component/admin/AdminGroupedBarChart";
import AdminDonutChart from "../../component/admin/AdminDonutChart";
import AdminHorizontalBarChart from "../../component/admin/AdminHorizontalBarChart";
import {
  applyAttendanceRegularization,
  enrichAdminEmployee,
} from "../../utils/attendanceRegularization";
import "./adminDashboard.css";

const EMPLOYEE_TABS = [
  { id: "all", label: "All Employees" },
  { id: "present", label: "Present" },
  { id: "absent", label: "Absent" },
  { id: "late", label: "Late" },
  { id: "leave", label: "On Leave" },
];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SummaryCard({ icon: Icon, value, label, suffix, iconBg, iconColor }) {
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
}

function EmployeeTable({ employees, onRegularize }) {
  if (employees.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No employees in this category.
      </p>
    );
  }

  const canRegularize = (emp) =>
    emp.status !== "absent" && emp.status !== "leave";

  return (
    <div className="overflow-x-auto">
      <table className="admin-att-table w-full">
        <thead>
          <tr>
            <th>
              <input type="checkbox" className="rounded" aria-label="Select all" />
            </th>
            <th>Employee</th>
            <th>Status</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Break</th>
            <th>Late</th>
            <th>Production Hours</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label={`Select ${emp.name}`}
                />
              </td>
              <td>
                <div className="flex items-center gap-2.5">
                  <span className="admin-emp-avatar">{getInitials(emp.name)}</span>
                  <div>
                    <span className="font-medium text-gray-900 block">{emp.name}</span>
                    <span className="text-xs text-gray-400">{emp.department}</span>
                  </div>
                </div>
              </td>
              <td>
                <span
                  className={`admin-status-badge ${
                    STATUS_BADGE_CLASS[emp.status] || ""
                  }`}
                >
                  {STATUS_LABEL[emp.status]}
                </span>
              </td>
              <td className="text-gray-600">{emp.checkIn}</td>
              <td className="text-gray-600">{emp.checkOut}</td>
              <td className="text-gray-600">{emp.break}</td>
              <td className="text-gray-600">{emp.late}</td>
              <td>
                {emp.status === "absent" || emp.status === "leave" ? (
                  <span className="text-xs text-gray-400">—</span>
                ) : (
                  <span
                    className={`admin-production-pill ${
                      emp.productionGood ? "is-good" : "is-low"
                    }`}
                  >
                    🕐 {emp.production}
                  </span>
                )}
              </td>
              <td>
                {canRegularize(emp) ? (
                  <button
                    type="button"
                    className="admin-regularize-btn"
                    onClick={() => onRegularize(emp.id)}
                    disabled={emp.regularized}
                  >
                    {emp.regularized ? "Regularized" : "Regularizations"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAttendanceDashboard() {
  const [employeeTab, setEmployeeTab] = useState("all");
  const [employees, setEmployees] = useState(() =>
    ADMIN_ALL_EMPLOYEES.map(enrichAdminEmployee)
  );
  const lateSectionRef = useRef(null);
  const summary = ADMIN_ATTENDANCE_SUMMARY;

  const handleRegularize = (id) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? applyAttendanceRegularization(emp) : emp
      )
    );
  };

  const lateEmployees = useMemo(
    () => employees.filter((e) => e.status === "late"),
    [employees]
  );

  const scrollToLate = () => {
    setEmployeeTab("late");
    setTimeout(() => {
      lateSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const tabCounts = useMemo(
    () => ({
      all: employees.length,
      present: employees.filter((e) => e.status === "present").length,
      absent: employees.filter((e) => e.status === "absent").length,
      late: employees.filter((e) => e.status === "late").length,
      leave: employees.filter((e) => e.status === "leave").length,
    }),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    if (employeeTab === "all") return employees;
    return employees.filter((e) => e.status === employeeTab);
  }, [employeeTab, employees]);

  return (
    <div className="admin-dash space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track attendance, check-ins, and team availability
        </p>
      </div>

      {/* Top metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="admin-dash-card lg:col-span-2">
          <p className="text-sm font-medium text-gray-600 mb-3">Team Status Today</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <p className="text-xl font-bold text-emerald-700">{summary.presentToday}</p>
              <p className="text-xs text-emerald-600 mt-0.5">Present</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-pink-50">
              <p className="text-xl font-bold text-pink-600">{summary.absentToday}</p>
              <p className="text-xs text-pink-500 mt-0.5">Absent</p>
            </div>
            <button
              type="button"
              onClick={scrollToLate}
              className="text-center p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors w-full"
            >
              <p className="text-xl font-bold text-orange-600">{summary.lateToday}</p>
              <p className="text-xs text-orange-500 mt-0.5">Late — view list</p>
            </button>
            <div className="text-center p-2 rounded-lg bg-blue-50">
              <p className="text-xl font-bold text-blue-600">{summary.onLeaveToday}</p>
              <p className="text-xs text-blue-500 mt-0.5">On Leave</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {summary.checkedInToday} of {summary.totalEmployees} employees checked in
          </p>
        </div>

        <SummaryCard
          icon={Calendar}
          value={`${summary.attendanceRate}%`}
          label="Attendance Rate"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          icon={Clock}
          value={summary.avgHoursPerDay}
          suffix="h"
          label="Avg Hours / Day"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          icon={AlertTriangle}
          value={summary.lateThisMonth}
          label="Late This Month"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </section>

      {/* Banner — click to jump to late list */}
      <section
        role="button"
        tabIndex={0}
        onClick={summary.lateToday > 0 ? scrollToLate : undefined}
        onKeyDown={(e) => e.key === "Enter" && summary.lateToday > 0 && scrollToLate()}
        className={`admin-dash-card flex items-center gap-3 bg-emerald-50/50 border-emerald-100 ${
          summary.lateToday > 0 ? "admin-banner-clickable" : ""
        }`}
      >
        <TrendingUp size={20} className="text-emerald-600 shrink-0" />
        <p className="text-sm text-gray-700">
          {summary.lateToday === 0 ? (
            <>
              <span className="font-semibold text-emerald-700">No late arrivals today.</span>{" "}
              Great job, team!
            </>
          ) : (
            <>
              <span className="font-semibold text-orange-600">{summary.lateToday} employees</span>{" "}
              arrived late today.{" "}
              <span className="font-semibold text-emerald-700">{summary.presentToday} present</span>,{" "}
              <span className="font-semibold text-pink-600">{summary.absentToday} absent</span>.
              <span className="text-emerald-600 ml-1">Click to see who is late →</span>
            </>
          )}
        </p>
      </section>

      {/* Late arrivals today — dedicated list */}
      {lateEmployees.length > 0 && (
        <section ref={lateSectionRef} className="admin-dash-card border-orange-200 bg-orange-50/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900">
              Late Arrivals Today ({lateEmployees.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Scheduled</th>
                  <th>Late By</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {lateEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="admin-emp-avatar">{getInitials(emp.name)}</span>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{emp.department}</td>
                    <td className="font-semibold text-orange-600">{emp.checkIn}</td>
                    <td className="text-gray-500">09:00</td>
                    <td className="text-orange-600 font-medium">{emp.lateBy ?? "—"}</td>
                    <td className="text-gray-600">{emp.checkOut}</td>
                    <td className="text-orange-600 font-semibold">{emp.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Integrated charts */}
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
              segments={ADMIN_ATTENDANCE_STATUS_CHART}
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

      {/* All employees table */}
      <section className="admin-dash-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">
              All Employees – Today&apos;s Attendance
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {filteredEmployees.length} of {employees.length} employees
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-100 pb-3">
          {EMPLOYEE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab-btn ${employeeTab === tab.id ? "active" : ""}`}
              onClick={() => setEmployeeTab(tab.id)}
            >
              {tab.label} ({tabCounts[tab.id]})
            </button>
          ))}
        </div>

        <EmployeeTable employees={filteredEmployees} onRegularize={handleRegularize} />
      </section>

    </div>
  );
}
