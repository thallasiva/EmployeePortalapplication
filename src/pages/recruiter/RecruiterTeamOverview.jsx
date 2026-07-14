import React, { useEffect, useState } from "react";
import { Users, CalendarCheck, Clock, UserCheck } from "lucide-react";
import { listLeaveRequests } from "../../api/leaveRequest.api";
import { listAttendance } from "../../api/attendance.api";
import { getMyTeam } from "../../api/employee.api";
import RecruiterTabs from "./RecruiterTabs";
import "../admin/adminDashboard.css";

function getInitials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmt(val) {
  if (!val) return "--";
  return String(val).slice(0, 5);
}

const KPICard = ({ icon: Icon, label, value, color }) => (
  <div className="admin-dash-card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

const RecruiterTeamOverview = () => {
  const [team,      setTeam]      = useState([]);
  const [leaves,    setLeaves]    = useState([]);
  const [att,       setAtt]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const p1 = getMyTeam().then((r) => setTeam(Array.isArray(r) ? r : (r?.data ?? []))).catch(() => {});
    const p2 = listLeaveRequests({ status: "Pending", limit: 100 }).then((r) => {
      const d = Array.isArray(r) ? r : (r?.data ?? []);
      setLeaves(d);
    }).catch(() => {});
    const p3 = listAttendance({ from_date: today, to_date: today, limit: 100 }).then(({ data }) => setAtt(data || [])).catch(() => {});
    Promise.all([p1, p2, p3]).finally(() => setLoading(false));
  }, [today]);

  const presentToday  = att.filter((a) => (a.status || "").toLowerCase() === "present").length;
  const absentToday   = att.filter((a) => (a.status || "").toLowerCase() === "absent").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="admin-dash space-y-6">
      <RecruiterTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Overview</h1>
        <p className="text-gray-500 mt-1">Your team's status at a glance — {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading team data...</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={Users}       label="Team Size"      value={team.length}   color="bg-blue-500" />
            <KPICard icon={UserCheck}   label="Present Today"  value={presentToday}  color="bg-emerald-500" />
            <KPICard icon={Clock}       label="Absent Today"   value={absentToday}   color="bg-rose-500" />
            <KPICard icon={CalendarCheck} label="Pending Leaves" value={pendingLeaves} color="bg-amber-500" />
          </div>

          {/* Team Members */}
          <div className="admin-dash-card">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Team Members</h2>
            {team.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No team members found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-att-table w-full">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Today Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((m) => {
                      const rec = att.find((a) =>
                        String(a.employee_id) === String(m.employee_id || m.id)
                      );
                      const status = rec?.status || "—";
                      const badgeClass = status === "Present" ? "approved" : status === "Absent" ? "rejected" : "pending";
                      return (
                        <tr key={m.employee_id || m.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {getInitials(m.name || m.employee_name)}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-800">{m.name || m.employee_name || "—"}</p>
                                <p className="text-xs text-gray-400">{m.emp_code || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-sm text-gray-600">{m.role_name || m.job_title || "—"}</td>
                          <td className="text-sm text-gray-600">{m.department_name || m.department || "—"}</td>
                          <td>
                            <span className={`admin-status-badge ${badgeClass}`}>{status}</span>
                          </td>
                          <td className="text-sm text-gray-600">{fmt(rec?.check_in)}</td>
                          <td className="text-sm text-gray-600">{fmt(rec?.check_out)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Leave Summary */}
          {leaves.length > 0 && (
            <div className="admin-dash-card">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Pending Leave Requests ({pendingLeaves})</h2>
              <div className="space-y-2">
                {leaves.filter((l) => l.status === "Pending").slice(0, 5).map((l) => (
                  <div key={l.leave_request_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{(l.employee_name || "").trim() || "—"}</p>
                      <p className="text-xs text-gray-400">
                        {l.leave_type_name} · {l.days} day{l.days > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="admin-status-badge pending">Pending</span>
                  </div>
                ))}
                {pendingLeaves > 5 && (
                  <p className="text-xs text-blue-600 text-center pt-1">+{pendingLeaves - 5} more — go to Leave Requests tab</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterTeamOverview;
