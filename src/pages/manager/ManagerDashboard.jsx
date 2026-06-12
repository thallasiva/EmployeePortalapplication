import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileClock,
  UserX,
  Users,
} from "lucide-react";
import { getLoggedInUser } from "../../lib/dateUtils";
import {
  RM_LEAVE_REQUESTS,
  RM_REGULARIZATION_REQUESTS,
  RM_TEAM_MEMBERS,
  SHIFT_LABEL,
  getRmTeamSummary,
} from "../../data/managerData";
import ManagerTabs from "./ManagerTabs";
import PieChart from "../../component/charts/PieChart";
import "../admin/adminDashboard.css";

function SummaryCard({ icon: Icon, value, label, iconBg, iconColor, suffix }) {
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

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const STATUS_BADGE = {
  present: "approved",
  absent: "rejected",
  late: "pending",
};

const STATUS_LABEL = {
  present: "Present",
  absent: "Absent",
  late: "Late",
};

const ManagerDashboard = () => {
  const user = getLoggedInUser();
  const summary = getRmTeamSummary();
  const pendingLeave = RM_LEAVE_REQUESTS.filter((r) => r.status === "Pending");
  const pendingRegularizations = RM_REGULARIZATION_REQUESTS.filter(
    (r) => r.status === "Pending"
  );

  return (
    <div className="admin-dash space-y-6">
      <ManagerTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Team Overview
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.name || "Reporting Manager"} · Summary of your team&apos;s attendance
          and pending approvals
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          icon={Users}
          value={summary.total}
          label="Team Members"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          icon={CheckCircle2}
          value={summary.present}
          label="Present Today"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          icon={UserX}
          value={summary.absent}
          label="Absent Today"
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <SummaryCard
          icon={Clock}
          value={summary.late}
          label="Late Marks Today"
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
        <SummaryCard
          icon={CalendarClock}
          value={summary.pendingLeave}
          label="Pending Leave Requests"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <SummaryCard
          icon={FileClock}
          value={summary.pendingRegularizations}
          label="Pending Regularizations"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart
          title="Today's Attendance Breakdown"
          centerLabel="Team members"
          data={[
            { label: "Present", value: summary.present, color: "#10b981" },
            { label: "Absent", value: summary.absent, color: "#f43f5e" },
            { label: "Late", value: summary.late, color: "#f59e0b" },
          ]}
        />
        <PieChart
          title="Pending Approvals Breakdown"
          centerLabel="Pending items"
          data={[
            { label: "Leave Requests", value: summary.pendingLeave, color: "#8b5cf6" },
            {
              label: "Regularizations",
              value: summary.pendingRegularizations,
              color: "#f97316",
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 admin-dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Team Attendance — Today
            </h2>
            <Link to="/manager/team/attendance" className="text-sm text-brand font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {RM_TEAM_MEMBERS.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="admin-emp-avatar">{getInitials(m.name)}</span>
                        <div>
                          <span className="font-medium text-gray-900 block">{m.name}</span>
                          <span className="text-xs text-gray-400">{m.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{SHIFT_LABEL[m.shift]}</td>
                    <td>
                      <span className={`admin-status-badge ${STATUS_BADGE[m.status]}`}>
                        {STATUS_LABEL[m.status]}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{m.checkIn}</td>
                    <td className="text-sm text-gray-600">{m.checkOut}</td>
                    <td className="text-sm text-gray-600">{m.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Pending Approvals</h2>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Leave Requests
          </p>
          {pendingLeave.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No pending leave requests.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {pendingLeave.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">{r.employee}</p>
                  <p className="text-xs text-gray-500">
                    {r.type} · {r.from} – {r.to} ({r.days}d)
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/manager/team/leave"
            className="block text-sm text-brand font-medium mb-4"
          >
            View leave requests →
          </Link>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Regularization Requests
          </p>
          {pendingRegularizations.length === 0 ? (
            <p className="text-sm text-gray-400 mb-2">No pending regularizations.</p>
          ) : (
            <div className="space-y-2 mb-2">
              {pendingRegularizations.map((r) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800">{r.employee}</p>
                  <p className="text-xs text-gray-500">
                    {r.date} · {r.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/manager/team/regularizations"
            className="block text-sm text-brand font-medium"
          >
            View regularizations →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
