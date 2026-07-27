import React, { useState, useEffect, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { getAllTimesheets, getAdminDashboardCounts, getAnyTimesheetDetail } from "../../api/timesheet.api";
import "./adminDashboard.css";

const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-600 border-gray-300",
  pending: "bg-amber-50 text-amber-700 border-amber-300",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected: "bg-red-50 text-red-600 border-red-300"
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[status] || ""}`}>
      {status}
    </span>);

}


function TimesheetDetailModal({ timesheetId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnyTimesheetDetail(timesheetId).
    then(setDetail).
    catch(() => {}).
    finally(() => setLoading(false));
  }, [timesheetId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Timesheet Detail</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {loading ?
        <div className="p-8 text-center text-gray-400">Loading…</div> :
        !detail ?
        <div className="p-8 text-center text-red-500">Failed to load</div> :

        <div className="p-6 space-y-5">
            {}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
            ["Employee", detail.employee_name],
            ["Week", `${detail.week_start} → ${detail.week_end}`],
            ["Total Hours", `${parseFloat(detail.total_hours || 0).toFixed(1)}h`],
            ["Status", <StatusBadge key="s" status={detail.status} />],
            ["Submitted", detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString("en-GB") : "—"],
            ["Reviewed By", detail.reviewer_name || "—"],
            ["Reviewed At", detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleDateString("en-GB") : "—"],
            ["Comments", detail.comments || "—"]].
            map(([label, value]) =>
            <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{value}</p>
                </div>
            )}
            </div>

            {}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Work Log Entries</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Task</th>
                      <th className="px-4 py-3 text-left">Activity</th>
                      <th className="px-4 py-3 text-center">Work Date</th>
                      <th className="px-4 py-3 text-center">Start</th>
                      <th className="px-4 py-3 text-center">End</th>
                      <th className="px-4 py-3 text-center">Duration</th>
                      <th className="px-4 py-3 text-center">Week Status</th>
                      <th className="px-4 py-3 text-center">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(detail.entries || []).length === 0 ?
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No entries</td></tr> :

                  (detail.entries || []).map((e) =>
                  <tr key={e.entry_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{e.project_name}</td>
                          <td className="px-4 py-2">{e.task_name}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{e.activity_desc || "—"}</td>
                          <td className="px-4 py-2 text-center text-xs">{e.work_date}</td>
                          <td className="px-4 py-2 text-center text-xs">{e.start_time || "—"}</td>
                          <td className="px-4 py-2 text-center text-xs">{e.end_time || "—"}</td>
                          <td className="px-4 py-2 text-center font-semibold text-brand">{parseFloat(e.duration_hours).toFixed(1)}h</td>
                          <td className="px-4 py-2 text-center"><StatusBadge status={detail.status} /></td>
                          <td className="px-4 py-2 text-center text-xs">
                            {detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString("en-GB") : "—"}
                          </td>
                        </tr>
                  )
                  }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}


export default function AdminTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewId, setViewId] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      setTimesheets(await getAllTimesheets(params));
      setCounts(await getAdminDashboardCounts());
    } catch {} finally {setLoading(false);}
  }, [filter]);

  useEffect(() => {load();}, [load]);

  const filtered = search ?
  timesheets.filter((t) => t.employee_name?.toLowerCase().includes(search.toLowerCase()) || t.emp_code?.includes(search)) :
  timesheets;

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(filtered);

  const FILTER_OPTIONS = ["all", "pending", "approved", "rejected", "draft"];

  return (
    <div className="admin-dash space-y-4">
      {}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Timesheets</h1>
        <p className="text-gray-500 mt-1">All employee weekly timesheet submissions</p>
      </div>

      {}
      {counts &&
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
        { label: "Total Employees", value: counts.totalEmployees, color: "text-brand" },
        { label: "Total Managers", value: counts.totalManagers, color: "text-indigo-600" },
        { label: "Pending", value: counts.pendingTimesheets, color: "text-amber-600" },
        { label: "Approved", value: counts.approvedTimesheets, color: "text-emerald-600" },
        { label: "Rejected", value: counts.rejectedTimesheets, color: "text-red-500" }].
        map(({ label, value, color }) =>
        <div key={label} className="admin-dash-card py-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
        )}
        </div>
      }

      {}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((f) =>
          <button key={f} type="button" onClick={() => setFilter(f)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors capitalize ${
          filter === f ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand"}`
          }>{f === "all" ? "All" : f}</button>
          )}
        </div>
        <input
          type="text"
          placeholder="Search employee…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 w-full sm:w-56 focus:border-brand focus:outline-none shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)} />

      </div>

      {}
      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-att-table w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="text-center">Week</th>
                <th className="text-center">Total Hours</th>
                <th className="text-center">Status</th>
                <th className="text-center">Submitted</th>
                <th className="text-center">Reviewed By</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ?
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading…</td></tr> :
              filtered.length === 0 ?
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No timesheets found</td></tr> :
              paged.map((ts) =>
              <tr key={ts.timesheet_id}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{ts.employee_name}</p>
                      <p className="text-xs text-gray-400">{ts.emp_code} · {ts.department_name}</p>
                    </div>
                  </td>
                  <td className="text-center text-sm text-gray-700">
                    {ts.week_start}<br /><span className="text-xs text-gray-400">to {ts.week_end}</span>
                  </td>
                  <td className="text-center font-semibold text-brand">{parseFloat(ts.total_hours || 0).toFixed(1)}h</td>
                  <td className="text-center"><StatusBadge status={ts.status} /></td>
                  <td className="text-center text-xs text-gray-500">
                    {ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="text-center text-xs text-gray-500">{ts.reviewer_name || "—"}</td>
                  <td className="text-center">
                    <button type="button" onClick={() => setViewId(ts.timesheet_id)}
                  className="text-xs font-semibold text-brand hover:underline px-3 py-1 rounded-lg border border-brand/30 hover:bg-brand/5">
                      View
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      {viewId && <TimesheetDetailModal timesheetId={viewId} onClose={() => setViewId(null)} />}
    </div>);

}
