import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Clock,
  UserX,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import LeaveEmployeeDetailTable from "../../component/admin/LeaveEmployeeDetailTable";
import AdminChatbot from "../../component/admin/AdminChatbot";
import { getStoredUser } from "../../data/auth";
import "../../component/admin/adminChatbot.css";
import "./adminDashboard.css";

function KpiCard({ label, value, sub, icon: Icon, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-dash-kpi ${className} p-4 rounded-xl shadow-sm flex justify-between items-start text-left w-full`}
    >
      <div>
        <p className="text-sm opacity-90">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        <p className="admin-dash-kpi__link">View details →</p>
      </div>
      <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
        <Icon size={22} />
      </div>
    </button>
  );
}

function MiniList({ title, items, emptyText, onViewAll, renderItem }) {
  return (
    <div className="admin-dash-card h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-emerald-600 hover:underline inline-flex items-center gap-0.5"
          >
            View all <ChevronRight size={12} />
          </button>
        )}
      </div>
      {!items.length ? (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p>
      ) : (
        <ul className="space-y-2">{items.map(renderItem)}</ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { metrics, activities, loading, error } = useAdminDashboard();

  const go = (path) => () => navigate(path);
  const goLeave = (state = {}) => () => navigate("/dashboard/leave", { state });

  return (
    <div className="admin-dash space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            One place to manage leave, attendance, employees, and reviews — click any card for details
          </p>
        </div>
        {loading && <span className="text-xs text-gray-400">Refreshing dashboard…</span>}
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Some dashboard data couldn&apos;t be loaded from the server, so a few numbers below may be
          incomplete or fall back to sample data. (Check the browser console for details.)
        </div>
      )}

      {/* KPI row — click opens detail screen */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Today at a glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard
            label="Employees"
            value={metrics.totalEmployees}
            icon={Users}
            className="bg-brand text-white"
            onClick={go("/dashboard/employee")}
          />
          <KpiCard
            label="On Leave"
            value={metrics.onLeaveToday}
            sub="approved today"
            icon={CalendarDays}
            className="bg-blue-600 text-white"
            onClick={go("/dashboard/leave")}
          />
          <KpiCard
            label="Pending Leave"
            value={metrics.pendingLeave}
            sub="needs action"
            icon={Clock}
            className="bg-orange-500 text-white"
            onClick={goLeave({ tab: "pending" })}
          />
          <KpiCard
            label="Present"
            value={metrics.presentToday}
            sub={`of ${metrics.totalEmployees}`}
            icon={TrendingUp}
            className="bg-emerald-600 text-white"
            onClick={go("/dashboard/attendance")}
          />
          <KpiCard
            label="Late"
            value={metrics.lateToday}
            icon={AlertTriangle}
            className="bg-amber-500 text-white"
            onClick={go("/dashboard/attendance")}
          />
          <KpiCard
            label="Absent"
            value={metrics.absentToday}
            icon={UserX}
            className="bg-rose-500 text-white"
            onClick={go("/dashboard/attendance")}
          />
          <KpiCard
            label="Attendance"
            value={`${metrics.attendanceRate}%`}
            icon={ClipboardCheck}
            className="bg-teal-600 text-white"
            onClick={go("/dashboard/attendance")}
          />
          <KpiCard
            label="Companies"
            value={metrics.companies}
            icon={Building2}
            className="bg-violet-600 text-white"
            onClick={go("/dashboard/company")}
          />
        </div>
      </section>

      {/* Main: On leave list + Pending */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 admin-dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Employees on Leave Today ({metrics.onLeaveToday})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Approved leave for today — same data as Leave calendar when you click today&apos;s date
              </p>
            </div>
            <button
              type="button"
              onClick={go("/dashboard/leave")}
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Open Leave Management
            </button>
          </div>
          <LeaveEmployeeDetailTable
            rows={metrics.onLeaveList.map((r) => ({ ...r, status: "Approved" }))}
            emptyMessage="No employees on approved leave today."
          />
        </div>

        <MiniList
          title={`Pending Leave Requests (${metrics.pendingLeave})`}
          items={metrics.pendingList}
          emptyText="No pending requests."
          onViewAll={goLeave({ tab: "pending" })}
          renderItem={(row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={goLeave({ tab: "pending", requestId: row.id })}
                className="w-full text-left text-sm p-2 rounded-lg border border-orange-100 bg-orange-50/50 hover:bg-orange-100/80 hover:border-orange-200 transition-colors cursor-pointer"
              >
                <p className="font-medium text-gray-900">{row.employee}</p>
                <p className="text-xs text-gray-500">
                  {row.type} · {row.from} → {row.to}
                </p>
                <p className="text-[10px] text-emerald-600 mt-1">Open in Leave Management →</p>
              </button>
            </li>
          )}
        />
      </section>

      {/* Attendance snapshot */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniList
          title={`Late Today (${metrics.lateToday})`}
          items={metrics.lateEmployees}
          emptyText="No late arrivals."
          onViewAll={go("/dashboard/attendance")}
          renderItem={(emp) => (
            <li key={emp.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="font-medium text-gray-800">{emp.name}</span>
              <span className="text-orange-600 text-xs">{emp.checkIn} ({emp.lateBy})</span>
            </li>
          )}
        />
        <MiniList
          title={`Absent Today (${metrics.absentToday})`}
          items={metrics.absentEmployees}
          emptyText="Everyone checked in or on leave."
          onViewAll={go("/dashboard/attendance")}
          renderItem={(emp) => (
            <li key={emp.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="font-medium text-gray-800">{emp.name}</span>
              <span className="text-rose-500 text-xs">{emp.department}</span>
            </li>
          )}
        />
        <MiniList
          title="Recent activity"
          items={
            activities.length
              ? activities
              : [
                  { id: "pending", text: `${metrics.pendingLeave} leave requests awaiting approval` },
                  { id: "onleave", text: `${metrics.onLeaveToday} employees on leave today` },
                  { id: "checkedin", text: `${metrics.checkedIn} checked in of ${metrics.totalEmployees}` },
                ]
          }
          emptyText="No recent activity."
          onViewAll={go("/dashboard/report")}
          renderItem={(item) => (
            <li key={item.id} className="text-sm text-gray-600 py-1.5 border-b border-gray-50">
              {item.text}
            </li>
          )}
        />
      </section>


      <AdminChatbot />
    </div>
  );
}
