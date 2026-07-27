import React, { useEffect, useState, useMemo } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import {
  Users, CalendarCheck, Clock, UserCheck, Search,
  TrendingUp, Building2, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";
import { listLeaveRequests, reviewLeaveRequest } from "../../api/leaveRequest.api";
import { listAttendance } from "../../api/attendance.api";
import { listEmployees } from "../../api/employee.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import RecruiterTabs from "./RecruiterTabs";
import "../admin/adminDashboard.css";

/* ── helpers ─────────────────────────────────────────────────────── */
function getInitials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}
function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}
function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── KPI card ────────────────────────────────────────────────────── */
const KPICard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="admin-dash-card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── dept pill ───────────────────────────────────────────────────── */
const DEPT_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];
function deptColor(dept, depts) {
  const i = depts.indexOf(dept);
  return DEPT_COLORS[i % DEPT_COLORS.length];
}

/* ═══════════════════════════════════════════════════════════════════ */
const RecruiterTeamOverview = () => {
  const [team,    setTeam]    = useState([]);
  const [leaves,  setLeaves]  = useState([]);
  const [att,     setAtt]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [reviewing, setReviewing]   = useState(null); // leave_request_id being reviewed

  const today = new Date().toISOString().slice(0, 10);

  const load = () => {
    setLoading(true);
    Promise.all([
      listEmployees({ status: "Active", limit: 500 })
        .then((r) => setTeam(Array.isArray(r) ? r : (r?.rows ?? r?.data ?? [])))
        .catch(() => {}),
      listLeaveRequests({})
        .then((r) => setLeaves(Array.isArray(r) ? r : (r?.data ?? [])))
        .catch(() => {}),
      listAttendance({ from_date: today, to_date: today, limit: 500 })
        .then(({ data }) => setAtt(data || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [today]);

  /* ── derived stats ─────────────────────────────────────────────── */
  const presentToday  = att.filter((a) => (a.status || "").toLowerCase() === "present").length;
  const absentToday   = att.filter((a) => (a.status || "").toLowerCase() === "absent").length;
  const lateToday     = att.filter((a) => (a.status || "").toLowerCase() === "late").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

  const departments = useMemo(() => {
    const s = new Set(team.map((e) => e.department_name || e.department || "").filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [team]);

  const deptBreakdown = useMemo(() => {
    const map = {};
    team.forEach((e) => {
      const d = e.department_name || e.department || "Other";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [team]);

  const filteredTeam = useMemo(() => {
    const q = search.toLowerCase();
    return team.filter((e) => {
      const name = (e.name || e.employee_name || "").toLowerCase();
      const code = (e.emp_code || "").toLowerCase();
      const dept = e.department_name || e.department || "";
      const matchSearch = !q || name.includes(q) || code.includes(q);
      const matchDept   = deptFilter === "All" || dept === deptFilter;
      return matchSearch && matchDept;
    });
  }, [team, search, deptFilter]);
  const { paged: pagedTeam, page: teamPage, setPage: setTeamPage, totalPages: teamTotalPages, from: teamFrom, to: teamTo, total: teamTotal, pageSize: teamPageSize, setPageSize: setTeamPageSize } = usePagination(filteredTeam);

  const pendingLeavesRows = leaves.filter((l) => l.status === "Pending").slice(0, 8);

  /* ── leave quick action ────────────────────────────────────────── */
  const handleLeave = async (id, action) => {
    setReviewing(id);
    try {
      await reviewLeaveRequest(id, { status: action === "approve" ? "Approved" : "Rejected" });
      successToast(`Leave ${action === "approve" ? "approved" : "rejected"}`);
      load();
    } catch {
      errorToast("Action failed");
    } finally {
      setReviewing(null);
    }
  };

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="admin-dash space-y-6">
      <RecruiterTabs />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Overview</h1>
          <p className="text-gray-500 mt-1">
            Organisation-wide team status — {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-16">Loading team data...</p>
      ) : (
        <>
          {/* ── KPI Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard icon={Users}        label="Total Employees" value={team.length}    color="bg-blue-500" />
            <KPICard icon={UserCheck}    label="Present Today"   value={presentToday}   color="bg-emerald-500" />
            <KPICard icon={Clock}        label="Absent Today"    value={absentToday}    color="bg-rose-500" />
            <KPICard icon={TrendingUp}   label="Late Arrivals"   value={lateToday}      color="bg-amber-500" />
            <KPICard icon={CalendarCheck} label="Pending Leaves" value={pendingLeaves}  color="bg-purple-500" />
          </div>

          {/* ── Department Breakdown ─────────────────────────────── */}
          <div className="admin-dash-card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-gray-500" />
              <h2 className="text-base font-semibold text-gray-700">Department Breakdown</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {deptBreakdown.map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(deptFilter === dept ? "All" : dept)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    deptFilter === dept
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>{dept}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    deptFilter === dept ? "bg-white/20 text-white" : "bg-white text-gray-600"
                  }`}>{count}</span>
                </button>
              ))}
              {deptFilter !== "All" && (
                <button
                  onClick={() => setDeptFilter("All")}
                  className="px-3 py-2 rounded-xl border text-sm text-gray-400 border-dashed border-gray-300 hover:bg-gray-50"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* ── Employee Table ───────────────────────────────────── */}
          <div className="admin-dash-card !p-0 overflow-hidden">
            {/* Search + filter bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-3">
              <h2 className="text-base font-semibold text-gray-700">
                Employees
                {deptFilter !== "All" && <span className="ml-2 text-xs text-blue-600 font-normal">· {deptFilter}</span>}
                <span className="ml-2 text-xs text-gray-400 font-normal">{filteredTeam.length} of {team.length}</span>
              </h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredTeam.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No employees found.</p>
              ) : (
                <>
                <table className="admin-att-table w-full">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Today</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTeam.map((m) => {
                      const empId = m.employee_id || m.id;
                      const rec   = att.find((a) => String(a.employee_id) === String(empId));
                      const status    = rec?.status || "—";
                      const badgeCls  = status === "Present" ? "approved"
                                      : status === "Absent"  ? "rejected"
                                      : status === "Late"    ? "pending" : "";
                      const dept = m.department_name || m.department || "—";
                      return (
                        <tr key={empId}>
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
                          <td>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${deptColor(dept, departments)}`}>
                              {dept}
                            </span>
                          </td>
                          <td className="text-sm text-gray-600">{m.role_name || m.job_title || "—"}</td>
                          <td>
                            {badgeCls
                              ? <span className={`admin-status-badge ${badgeCls}`}>{status}</span>
                              : <span className="text-xs text-gray-400">—</span>
                            }
                          </td>
                          <td className="text-sm text-gray-600">{fmt(rec?.check_in)}</td>
                          <td className="text-sm text-gray-600">{fmt(rec?.check_out)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination page={teamPage} setPage={setTeamPage} totalPages={teamTotalPages} from={teamFrom} to={teamTo} total={teamTotal} pageSize={teamPageSize} setPageSize={setTeamPageSize} />
                </>
              )}
            </div>
          </div>

          {/* ── Pending Leaves ───────────────────────────────────── */}
          {pendingLeavesRows.length > 0 && (
            <div className="admin-dash-card !p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <h2 className="text-base font-semibold text-gray-700">
                  Pending Leave Approvals
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{pendingLeaves}</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-att-table w-full">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeavesRows.map((l) => (
                      <tr key={l.leave_request_id}>
                        <td>
                          <p className="font-medium text-sm text-gray-800">{(l.employee_name || "").trim() || "—"}</p>
                          <p className="text-xs text-gray-400">{l.department_name || ""}</p>
                        </td>
                        <td className="text-sm text-gray-600">{l.leave_type_name || "—"}</td>
                        <td className="text-sm text-gray-600">{fmtDate(l.from_date)}</td>
                        <td className="text-sm text-gray-600">{fmtDate(l.to_date)}</td>
                        <td className="text-sm text-gray-600">{l.days}</td>
                        <td className="text-sm text-gray-500 max-w-[160px] truncate">{l.reason || "—"}</td>
                        <td>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleLeave(l.leave_request_id, "approve")}
                              disabled={reviewing === l.leave_request_id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleLeave(l.leave_request_id, "reject")}
                              disabled={reviewing === l.leave_request_id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pendingLeaves > 8 && (
                <p className="text-xs text-blue-600 text-center py-3 border-t border-gray-100">
                  +{pendingLeaves - 8} more — go to Leave Requests tab
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterTeamOverview;
