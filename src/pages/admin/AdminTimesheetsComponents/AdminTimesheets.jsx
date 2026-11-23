import React, { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import Pagination, { usePagination } from "../../../components/Pagination";
import { getAllTimesheets, getAdminDashboardCounts, reviewTimesheet } from "../../../api/timesheet.api";
import { Toast } from "./Toast";
import { StatusBadge } from "./StatusBadge";
import { TimesheetDetailModal } from "./TimesheetDetailModal";
function AdminTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewId, setViewId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [actioning, setActioning] = useState(null); // timesheetId being actioned
  const showToast = (msg, type = "success") => {
    setToast({
      msg,
      type
    });
    setTimeout(() => setToast(null), 3500);
  };
  const handleApprove = async timesheetId => {
    setActioning(timesheetId);
    try {
      await reviewTimesheet(timesheetId, {
        decision: "approved",
        comments: ""
      });
      showToast("Timesheet approved successfully");
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || "Approval failed", "error");
    } finally {
      setActioning(null);
    }
  };
  const handleReject = async (timesheetId, comments = "") => {
    setActioning(timesheetId);
    try {
      await reviewTimesheet(timesheetId, {
        decision: "rejected",
        comments
      });
      showToast("Timesheet rejected");
      load();
    } catch (e) {
      showToast(e?.response?.data?.message || "Rejection failed", "error");
    } finally {
      setActioning(null);
    }
  };
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? {
        status: filter
      } : {};
      setTimesheets(await getAllTimesheets(params));
      setCounts(await getAdminDashboardCounts());
    } catch {} finally {
      setLoading(false);
    }
  }, [filter]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = search ? timesheets.filter(t => t.employee_name?.toLowerCase().includes(search.toLowerCase()) || t.emp_code?.includes(search)) : timesheets;
  const {
    paged,
    page,
    setPage,
    totalPages,
    from,
    to,
    total,
    pageSize,
    setPageSize
  } = usePagination(filtered);
  const FILTER_OPTIONS = ["all", "pending", "approved", "rejected", "draft"];
  return <div className="admin-dash space-y-4">
      <Toast msg={toast?.msg} type={toast?.type} onClose={() => setToast(null)} />
      {}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Timesheets</h1>
        <p className="text-gray-500 mt-1">All employee weekly timesheet submissions</p>
      </div>
      {}
      {counts && <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[{
        label: "Total Employees",
        value: counts.totalEmployees,
        color: "text-brand"
      }, {
        label: "Total Managers",
        value: counts.totalManagers,
        color: "text-indigo-600"
      }, {
        label: "Pending",
        value: counts.pendingTimesheets,
        color: "text-amber-600"
      }, {
        label: "Approved",
        value: counts.approvedTimesheets,
        color: "text-emerald-600"
      }, {
        label: "Rejected",
        value: counts.rejectedTimesheets,
        color: "text-red-500"
      }].map(({
        label,
        value,
        color
      }) => <div key={label} className="admin-dash-card py-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>)}
        </div>}
      {}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(f => <button key={f} type="button" onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === f ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand"}`}>{f === "all" ? "All" : f}</button>)}
        </div>
        <input type="text" placeholder="Search employee…" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 w-full sm:w-56 focus:border-brand focus:outline-none shadow-sm" value={search} onChange={e => setSearch(e.target.value)} />
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
              {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Loading…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No timesheets found</td></tr> : paged.map(ts => <tr key={ts.timesheet_id}>
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
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {ts.status === "pending" && <>
                          <button type="button" disabled={actioning === ts.timesheet_id} onClick={() => handleApprove(ts.timesheet_id)} className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors">
                            <Check size={11} />Approve
                          </button>
                          <button type="button" disabled={actioning === ts.timesheet_id} onClick={async () => {
                      const comments = window.prompt("Reason for rejection (optional):") ?? "";
                      await handleReject(ts.timesheet_id, comments);
                    }} className="flex items-center gap-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-colors">
                            <X size={11} />Reject
                          </button>
                        </>}
                      <button type="button" onClick={() => setViewId(ts.timesheet_id)} className="text-xs font-semibold text-brand hover:underline px-2.5 py-1 rounded-lg border border-brand/30 hover:bg-brand/5">
                        View
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
      </div>
      {viewId && <TimesheetDetailModal timesheetId={viewId} onClose={() => setViewId(null)} onApprove={id => handleApprove(id)} onReject={async id => {
      const comments = window.prompt("Reason for rejection (optional):") ?? "";
      await handleReject(id, comments);
    }} />}
    </div>;
}
export { AdminTimesheets };
