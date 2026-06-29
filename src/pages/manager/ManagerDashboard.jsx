import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Clock, FileCheck,
  FileClock, FileX, UserX, Users, Activity,
} from "lucide-react";
import { getLoggedInUser } from "../../lib/dateUtils";
import { getManagerFullDashboard } from "../../api/timesheet.api";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ATT_BADGE = {
  present:   { cls: "approved",   label: "Present" },
  absent:    { cls: "rejected",   label: "Absent"  },
  late:      { cls: "pending",    label: "Late"    },
  "half-day":{ cls: "pending",    label: "Half Day"},
};

const ACTIVITY_ICON = {
  timesheet: <FileClock size={14} className="text-blue-500" />,
  leave:     <FileCheck size={14} className="text-violet-500" />,
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, value, label, iconBg, iconColor, to }) {
  const inner = (
    <div className="admin-dash-card flex items-center gap-4 h-full">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="admin-dash-stat-value">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const user = getLoggedInUser();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getManagerFullDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const s  = data?.summary  || {};
  const team = data?.team   || [];
  const activities = data?.recentActivities || [];

  const v = (key) => loading ? "—" : (s[key] ?? 0);

  return (
    <div className="admin-dash space-y-6">
      <ManagerTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Overview</h1>
        <p className="text-gray-500 mt-1">
          {user?.name || "Reporting Manager"} · Live snapshot of your team
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard icon={Users}        value={v("totalTeam")}          label="Team Size"             iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <KpiCard icon={CheckCircle2} value={v("presentToday")}       label="Present Today"         iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KpiCard icon={UserX}        value={v("absentToday")}        label="Absent Today"          iconBg="bg-rose-50"    iconColor="text-rose-600" />
        <KpiCard icon={Clock}        value={v("lateToday")}          label="Late Today"            iconBg="bg-orange-50"  iconColor="text-orange-600" />
        <KpiCard icon={AlertTriangle} value={v("pendingTimesheets")} label="Pending Timesheets"    iconBg="bg-amber-50"   iconColor="text-amber-600"  to="/manager/timesheets" />
        <KpiCard icon={FileCheck}    value={v("approvedTimesheets")} label="Approved Timesheets"   iconBg="bg-teal-50"    iconColor="text-teal-600"   to="/manager/timesheets" />
        <KpiCard icon={FileX}        value={v("rejectedTimesheets")} label="Rejected Timesheets"   iconBg="bg-red-50"     iconColor="text-red-600"    to="/manager/timesheets" />
      </div>

      {/* ── Team Table + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Team attendance table */}
        <div className="lg:col-span-2 admin-dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              Team Members — Today's Attendance
            </h2>
            <Link to="/manager/team/attendance" className="text-sm text-brand font-medium">
              Full view →
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : team.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No team members found. Ensure employees have{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">reporting_to</code> set to your employee ID.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-att-table w-full">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m) => {
                    const att = ATT_BADGE[m.attendance_status] || ATT_BADGE.absent;
                    return (
                      <tr key={m.employee_id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="admin-emp-avatar">{getInitials(m.name)}</span>
                            <div>
                              <span className="font-medium text-gray-900 block">{m.name}</span>
                              <span className="text-xs text-gray-400">{m.emp_code}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-gray-600">{m.department_name || "—"}</td>
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`admin-status-badge ${att.cls}`}>{att.label}</span>
                            {!!m.serving_notice && (
                              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:999,
                                background:"#fff7ed", color:"#ea580c", border:"1px solid #fed7aa",
                                fontWeight:700, whiteSpace:"nowrap" }}>
                                Serving Notice
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-sm text-gray-600">{fmt(m.check_in)}</td>
                        <td className="text-sm text-gray-600">{fmt(m.check_out)}</td>
                        <td className="text-sm text-gray-600">
                          {m.work_hours != null ? `${Number(m.work_hours).toFixed(2)}h` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity feed */}
        <div className="admin-dash-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Recent Team Activities</h2>
            <Activity size={16} className="text-gray-400" />
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    {ACTIVITY_ICON[a.type] || <Activity size={12} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.actor}</p>
                    <p className="text-xs text-gray-500 leading-snug">{a.detail}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(a.occurred_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
            <Link to="/manager/team/leave"           className="block text-sm text-brand font-medium">Leave requests →</Link>
            <Link to="/manager/team/regularizations" className="block text-sm text-brand font-medium">Regularizations →</Link>
            <Link to="/manager/timesheets"           className="block text-sm text-brand font-medium">Timesheets →</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;
