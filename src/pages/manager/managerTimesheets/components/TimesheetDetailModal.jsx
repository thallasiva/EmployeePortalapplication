import React, { useState, useEffect, useCallback } from "react";
import { getAnyTimesheetDetail, reviewTimesheet } from "../../../../api/timesheet.api";
import StatusBadge from "./StatusBadge";
import { formatHours, formatDate } from "../utils";

const INFO_KEYS = [
  ["Employee", (d) => d.employee_name],
  ["Week", (d) => `${d.week_start} → ${d.week_end}`],
  ["Total Hours", (d) => formatHours(d.total_hours)],
  ["Status", (d) => <StatusBadge key="s" status={d.status} />],
  ["Submitted", (d) => formatDate(d.submitted_at)],
  ["Reviewed By", (d) => d.reviewer_name || "—"],
  ["Reviewed At", (d) => formatDate(d.reviewed_at)],
  ["Manager Comment", (d) => d.comments || "—"],
];

const TimesheetDetailModal = React.memo(function TimesheetDetailModal({
  timesheetId,
  onClose,
  onReviewed,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAnyTimesheetDetail(timesheetId)
      .then(setDetail)
      .catch(() => setErr("Failed to load"))
      .finally(() => setLoading(false));
  }, [timesheetId]);

  const handleReview = useCallback(
    async (decision) => {
      if (decision === "rejected" && !comments.trim()) {
        setErr("Please provide a rejection reason.");
        return;
      }
      setSubmitting(true);
      try {
        await reviewTimesheet(timesheetId, { decision, comments });
        onReviewed();
        onClose();
      } catch (e) {
        setErr(e?.response?.data?.message || "Action failed");
      } finally {
        setSubmitting(false);
      }
    },
    [timesheetId, comments, onReviewed, onClose]
  );

  const canReview = detail?.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Timesheet Detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : !detail ? (
          <div className="p-8 text-center text-red-500">{err || "Not found"}</div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {INFO_KEYS.map(([label, getValue]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{getValue(detail)}</p>
                </div>
              ))}
            </div>

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
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                          No entries logged
                        </td>
                      </tr>
                    ) : (
                      (detail.entries || []).map((e) => (
                        <tr key={e.entry_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{e.project_name}</td>
                          <td className="px-4 py-2">{e.task_name}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{e.activity_desc || "—"}</td>
                          <td className="px-4 py-2">{e.work_date}</td>
                          <td className="px-4 py-2">{e.start_time || "—"}</td>
                          <td className="px-4 py-2">{e.end_time || "—"}</td>
                          <td className="px-4 py-2">{parseFloat(e.duration_hours).toFixed(1)}h</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {canReview && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600">
                  Comments / Rejection Reason
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-brand focus:outline-none resize-none"
                    placeholder="Optional for approval, required for rejection"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </label>
                {err && <p className="text-sm text-red-500">{err}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleReview("rejected")}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview("approved")}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
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
});

export default TimesheetDetailModal;
