import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { getAnyTimesheetDetail } from "../../../api/timesheet.api";
import { StatusBadge } from "./StatusBadge";
function TimesheetDetailModal({
  timesheetId,
  onClose,
  onApprove,
  onReject
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAnyTimesheetDetail(timesheetId).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  }, [timesheetId]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Timesheet Detail</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X size={18} aria-hidden="true" /></button>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Loading…</div> : !detail ? <div className="p-8 text-center text-red-500">Failed to load</div> : <div className="p-6 space-y-5">
            {}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[["Employee", detail.employee_name], ["Week", `${detail.week_start} – ${detail.week_end}`], ["Total Hours", `${parseFloat(detail.total_hours || 0).toFixed(1)}h`], ["Status", <StatusBadge key="s" status={detail.status} />], ["Submitted", detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString("en-GB") : "—"], ["Reviewed By", detail.reviewer_name || "—"], ["Reviewed At", detail.reviewed_at ? new Date(detail.reviewed_at).toLocaleDateString("en-GB") : "—"], ["Comments", detail.comments || "—"]].map(([label, value]) => <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{value}</p>
                </div>)}
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
                    {(detail.entries || []).length === 0 ? <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">No entries</td></tr> : (detail.entries || []).map(e => <tr key={e.entry_id} className="hover:bg-gray-50">
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
                        </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>}
          {/* Approve / Reject actions inside modal */}
          {detail && detail.status === "pending" && onApprove && <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => {
          onApprove(timesheetId);
          onClose();
        }} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                <Check size={14} /> Approve Timesheet
              </button>
              <button type="button" onClick={() => {
          onReject(timesheetId);
          onClose();
        }} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors">
                <X size={14} /> Reject Timesheet
              </button>
            </div>}
      </div>
    </div>;
}
export { TimesheetDetailModal };
