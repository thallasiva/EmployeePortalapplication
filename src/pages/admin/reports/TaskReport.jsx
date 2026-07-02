import React, { useEffect, useState, useMemo } from "react";
import {
  ReportPageHeader, ReportIconStatCard, ReportTableToolbar,
  ReportPriorityBadge, ReportStatusBadge } from
"../../../component/reports/ReportsLayout";
import ReportDonutPanel from "../../../component/reports/ReportDonutPanel";
import apiClient, { unwrapList } from "../../../api/client";import { cssClass, joinClasses } from "../../../utils/classStyles";

const listAdminTasks = () => apiClient.get("/timesheets/tasks", { params: { limit: 500 } }).then(unwrapList).catch(() => ({ data: [] }));

export default function TaskReport() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAdminTasks().
    then((res) => setTasks(res.data || [])).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => !["completed"].includes(t.status)).length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;

  const stats = [
  { label: "Total Tasks", value: total, color: "#f97316" },
  { label: "Completed", value: completed, color: "#22c55e" },
  { label: "Pending", value: pending, color: "#3b82f6" },
  { label: "In Progress", value: inProg, color: "#eab308" }];


  const donut = [
  { name: "Completed", value: completed || 0, color: "#22c55e" },
  { name: "Pending", value: pending || 0, color: "#3b82f6" },
  { name: "In Progress", value: inProg || 0, color: "#eab308" }];


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => [t.task_name, t.project_name, t.status].some((v) => (v || "").toLowerCase().includes(q)));
  }, [tasks, search]);

  if (loading) return <div className="report-page"><p className="text-sm text-gray-400 p-6">Loading…</p></div>;

  return (
    <div className="report-page">
      <ReportPageHeader title="Task Report" />
      <div className="report-top-grid">
        <div className="report-stats-grid">
          {stats.map((s) => <ReportIconStatCard key={s.label} label={s.label} value={s.value} icon="◉" color={s.color} />)}
        </div>
        <ReportDonutPanel title="Tasks by Status" segments={donut} centerLabel="Total" centerValue={String(total)} />
      </div>
      <div className="report-table-section">
        <ReportTableToolbar title={`Tasks (${filtered.length})`} onSearch={setSearch} />
        <div className={cssClass({ overflowX: "auto" })}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Task Name</th><th>Project</th><th>Start Date</th><th>End Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) =>
              <tr key={t.task_id || i}>
                  <td><strong>{t.task_name || "—"}</strong></td>
                  <td>{t.project_name || "—"}</td>
                  <td>{t.start_date ? new Date(t.start_date).toLocaleDateString("en-GB") : "—"}</td>
                  <td>{t.end_date ? new Date(t.end_date).toLocaleDateString("en-GB") : "—"}</td>
                  <td><ReportStatusBadge status={t.status || "active"} /></td>
                </tr>
              )}
              {!filtered.length && <tr><td colSpan={5} className="text-center text-gray-400 py-8">No tasks found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
