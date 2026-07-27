import React, { useState, useEffect, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import ManagerTabs from "./ManagerTabs";
import
  {
    getManagerTimesheets, reviewTimesheet,
    getAnyTimesheetDetail, getManagerDashboardCounts,
    getManagerExtraWork, reviewExtraWork,
  } from "../../api/timesheet.api";
import "../admin/adminDashboard.css";

const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-600 border-gray-300",
  pending: "bg-amber-50 text-amber-700 border-amber-300",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected: "bg-red-50 text-red-600 border-red-300",
};

function StatusBadge({ status })
{
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[status] || ""}`}>
      {status}
    </span>
  );
}

// ─── Timesheet Detail Modal ───────────────────────────────────────────────────
function TimesheetDetailModal({ timesheetId, onClose, onReviewed })
{
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() =>
  {
    getAnyTimesheetDetail(timesheetId)
      .then(setDetail)
      .catch(() => setErr("Failed to load"))
      .finally(() => setLoading(false));
  }, [timesheetId]);

  const handleReview = async (decision) =>
  {
    if (decision === "rejected" && !comments.trim())
    {
      setErr("Please provide a rejection reason."); return;
    }
    setSubmitting(true);
    try
    {
      await reviewTimesheet(timesheetId, { decision, comments });
      onReviewed();
      onClose();
    } catch (e) { setErr(e?.response?.data?.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  const canReview = detail?.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Timesheet Detail</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : !detail ? (
          <div className="p-8 text-center text-red-500">{err || "Not found"}</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                ["Employee", detail.employee_name],
                ["Week", `${detail.week_start} → ${detail.week_end}`],
                ["Total Hours", `${parseFloat(detail.total_hours || 0).toFixed(1)}h`],
                ["Status", <StatusBadge key="s" status={detail.status} />],
                ["Submitted", detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString("en-GB") : "—"],
                ["Reviewed By", detail.reviewer_name || "—"],
                ["Reviewed At", detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleDateString("en-GB") : "—"],
                ["Manager Comment", detail.comments || "—"],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Entries table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Work Log Entries</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-left">Task</th>
                      <th className="px-4 py-3 text-left">Activity</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-center">Start</th>
                      <th className="px-4 py-3 text-center">End</th>
                      <th className="px-4 py-3 text-center">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(detail.entries || []).length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No entries logged</td></tr>
                    ) : (
                      (detail.entries || []).map(e => (
                        <tr key={e.entry_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{e.project_name}</td>
                          <td className="px-4 py-2">{e.task_name}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{e.activity_desc || "—"}</td>
                          <td className="px-4 py-2">{e.work_date}</td>
                          <td className="px-4 py-2">{e.start_time || "—"}</td>
                          <td className="px-4 py-2">{e.end_time || "—"}</td>
                          <td className="px-4 py-2 ">{parseFloat(e.duration_hours).toFixed(1)}h</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approve / Reject */}
            {canReview && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600">
                  Comments / Rejection Reason
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-brand focus:outline-none resize-none"
                    placeholder="Optional for approval, required for rejection"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                  />
                </label>
                {err && <p className="text-sm text-red-500">{err}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => handleReview("rejected")} disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
                    Reject
                  </button>
                  <button type="button" onClick={() => handleReview("approved")} disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                    {submitting ? "Saving…" : "Approve"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Extra Work Panel ─────────────────────────────────────────────────────────
function ExtraWorkPanel()
{
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState({});

  const load = useCallback(async () =>
  {
    try { setRequests(await getManagerExtraWork()); }
    catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleReview = async (id, decision) =>
  {
    setSaving(s => ({ ...s, [id]: true }));
    try
    {
      await reviewExtraWork(id, { decision, manager_notes: notes[id] || "" });
      await load();
    } catch { } finally { setSaving(s => ({ ...s, [id]: false })); }
  };

  if (loading) return <div className="ts-loading p-8 text-center text-gray-400">Loading…</div>;
  if (!requests.length) return <p className="text-sm text-gray-400 p-4">No extra work requests.</p>;

  return (
    <div className="space-y-3">
      {requests.map(ew => (
        <div key={ew.extra_work_id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm">{ew.employee_name}</span>
              <StatusBadge status={ew.status} />
            </div>
            <p className="text-sm text-gray-700">{ew.task_name} · <span className="text-brand font-semibold">{ew.extra_hours}h</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{ew.work_date} · {ew.reason}</p>
          </div>
          {ew.status === "pending" && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea rows={2} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs resize-none focus:outline-none focus:border-brand"
                placeholder="Notes (optional)"
                value={notes[ew.extra_work_id] || ""}
                onChange={e => setNotes(n => ({ ...n, [ew.extra_work_id]: e.target.value }))} />
              <div className="flex gap-2">
                <button type="button" disabled={saving[ew.extra_work_id]}
                  onClick={() => handleReview(ew.extra_work_id, "rejected")}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Reject</button>
                <button type="button" disabled={saving[ew.extra_work_id]}
                  onClick={() => handleReview(ew.extra_work_id, "approved")}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">Approve</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManagerTimesheets()
{
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewId, setViewId] = useState(null);
  const [counts, setCounts] = useState(null);
  const [activePanel, setActivePanel] = useState("timesheets");
  const [err, setErr] = useState("");
  const { paged: pagedTs, page: tsPage, setPage: setTsPage, totalPages: tsTotalPages, from: tsFrom, to: tsTo, total: tsTotal, pageSize: tsPageSize, setPageSize: setTsPageSize } = usePagination(timesheets);

  const load = useCallback(async () =>
  {
    setLoading(true);
    try
    {
      const params = filter !== "all" ? { status: filter } : {};
      setTimesheets(await getManagerTimesheets(params));
      setCounts(await getManagerDashboardCounts());
    } catch { setErr("Failed to load"); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const FILTER_OPTIONS = ["all", "pending", "approved", "rejected", "draft"];

  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />

      {/* KPIs */}
      {counts && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending Approvals", value: counts.pendingApprovals, color: "text-amber-600" },
            { label: "Approved", value: counts.approvedTimesheets, color: "text-emerald-600" },
            { label: "Rejected", value: counts.rejectedTimesheets, color: "text-red-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="admin-dash-card py-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Panel tabs */}
      <div className="flex gap-2">
        {[{ key: "timesheets", label: "Weekly Timesheets" }, { key: "extrawork", label: "Extra Work Requests" }].map(p => (
          <button key={p.key} type="button" onClick={() => setActivePanel(p.key)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${activePanel === p.key ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"
              }`}>{p.label}</button>
        ))}
      </div>

      {activePanel === "timesheets" && (
        <>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === f ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand"
                  }`}>{f === "all" ? "All" : f}</button>
            ))}
          </div>

          {/* Table */}
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
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                  ) : timesheets.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No timesheets found</td></tr>
                  ) : pagedTs.map(ts => (
                    <tr key={ts.timesheet_id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{ts.employee_name}</p>
                          <p className="text-xs text-gray-400">{ts.emp_code} · {ts.department_name}</p>
                        </div>
                      </td>
                      <td className=" font-medium text-gray-700">
                        {ts.week_start} to {ts.week_end}
                      </td>
                      <td className=" font-semibold text-brand">{parseFloat(ts.total_hours || 0).toFixed(1)}h</td>
                      <td ><StatusBadge status={ts.status} /></td>
                      <td className="text-xs text-gray-500">
                        {ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td>
                        <button type="button" onClick={() => setViewId(ts.timesheet_id)}
                          className="text-xs font-semibold text-brand hover:underline px-3 py-1 rounded-lg border border-brand/30 hover:bg-brand/5">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={tsPage} setPage={setTsPage} totalPages={tsTotalPages} from={tsFrom} to={tsTo} total={tsTotal} pageSize={tsPageSize} setPageSize={setTsPageSize} />
          </div>
        </>
      )}

      {activePanel === "extrawork" && <ExtraWorkPanel />}

      {viewId && (
        <TimesheetDetailModal
          timesheetId={viewId}
          onClose={() => setViewId(null)}
          onReviewed={load}
        />
      )}
    </div>
  );
}
