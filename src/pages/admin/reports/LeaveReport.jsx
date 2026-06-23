import React, { useEffect, useState, useMemo } from "react";
import {
  ReportPageHeader, ReportIconStatCard, ReportTableToolbar,
  ReportAvatar, ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import ReportStackedBarChart from "../../../component/reports/ReportStackedBarChart";
import { listLeaveRequests } from "../../../api/leaveRequest.api";

export default function LeaveReport() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listLeaveRequests({ limit: 500 })
      .then(({ data }) => setLeaves(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending  = leaves.filter(l => l.status === "pending").length;
  const approved = leaves.filter(l => l.status === "approved").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;

  const stats = [
    { label: "Total Requests", value: leaves.length,  color: "#3b82f6", trend: "All time" },
    { label: "Approved",       value: approved,        color: "#22c55e", trend: "Approved leaves" },
    { label: "Pending",        value: pending,         color: "#f97316", trend: "Awaiting review" },
    { label: "Rejected",       value: rejected,        color: "#ef4444", trend: "Rejected" },
  ];

  // Build monthly chart data
  const chartData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.map((label, i) => {
      const monthLeaves = leaves.filter(l => {
        const d = new Date(l.from_date || l.created_at || "");
        return d.getMonth() === i;
      });
      return { label, approved: monthLeaves.filter(l => l.status === "approved").length, pending: monthLeaves.filter(l => l.status === "pending").length };
    });
  }, [leaves]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaves;
    return leaves.filter(l => {
      const name = [l.first_name, l.last_name].filter(Boolean).join(" ");
      return [name, l.leave_type_name, l.status].some(v => (v||"").toLowerCase().includes(q));
    });
  }, [leaves, search]);

  if (loading) return <div className="report-page"><p className="text-sm text-gray-400 p-6">Loading…</p></div>;

  return (
    <div className="report-page">
      <ReportPageHeader title="Leave Report" />
      <div className="report-top-grid">
        <div className="report-stats-grid">
          {stats.map(s => <ReportIconStatCard key={s.label} label={s.label} value={s.value} icon="📋" color={s.color} trend={s.trend} />)}
        </div>
        <ReportStackedBarChart data={chartData} />
      </div>
      <div className="report-table-section">
        <ReportTableToolbar title={`Leave Requests (${filtered.length})`} onSearch={setSearch} />
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th>ID</th><th>Employee</th><th>Leave Type</th>
                <th>From</th><th>To</th><th>Days</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const name = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
                const days = l.from_date && l.to_date
                  ? Math.round((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1
                  : l.total_days || "—";
                return (
                  <tr key={l.leave_request_id}>
                    <td>LR-{l.leave_request_id}</td>
                    <td>
                      <div className="report-person-cell">
                        <ReportAvatar name={name} />
                        <div className="report-person-cell__info">
                          <span className="report-person-cell__name">{name}</span>
                          <span className="report-person-cell__sub">{l.leave_type_name || "Leave"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{l.leave_type_name || "—"}</td>
                    <td>{l.from_date ? new Date(l.from_date).toLocaleDateString("en-GB") : "—"}</td>
                    <td>{l.to_date   ? new Date(l.to_date).toLocaleDateString("en-GB")   : "—"}</td>
                    <td>{days}</td>
                    <td><ReportStatusBadge status={l.status} /></td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={7} className="text-center text-gray-400 py-8">No leave requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
