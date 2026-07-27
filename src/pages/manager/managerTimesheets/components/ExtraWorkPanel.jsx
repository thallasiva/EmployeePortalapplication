import React, { useState, useEffect, useCallback } from "react";
import { getManagerExtraWork, reviewExtraWork } from "../../../../api/timesheet.api";
import StatusBadge from "./StatusBadge";

const ExtraWorkPanel = React.memo(function ExtraWorkPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState({});

  const load = useCallback(async () => {
    try {
      setRequests(await getManagerExtraWork());
    } catch {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReview = useCallback(
    async (id, decision) => {
      setSaving((s) => ({ ...s, [id]: true }));
      try {
        await reviewExtraWork(id, { decision, manager_notes: notes[id] || "" });
        await load();
      } catch {}
      finally {
        setSaving((s) => ({ ...s, [id]: false }));
      }
    },
    [load, notes]
  );

  if (loading)
    return <div className="ts-loading p-8 text-center text-gray-400">Loading…</div>;
  if (!requests.length)
    return <p className="text-sm text-gray-400 p-4">No extra work requests.</p>;

  return (
    <div className="space-y-3">
      {requests.map((ew) => (
        <div
          key={ew.extra_work_id}
          className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 text-sm">{ew.employee_name}</span>
              <StatusBadge status={ew.status} />
            </div>
            <p className="text-sm text-gray-700">
              {ew.task_name} ·{" "}
              <span className="text-brand font-semibold">{ew.extra_hours}h</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ew.work_date} · {ew.reason}
            </p>
          </div>
          {ew.status === "pending" && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                rows={2}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs resize-none focus:outline-none focus:border-brand"
                placeholder="Notes (optional)"
                value={notes[ew.extra_work_id] || ""}
                onChange={(e) =>
                  setNotes((n) => ({ ...n, [ew.extra_work_id]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving[ew.extra_work_id]}
                  onClick={() => handleReview(ew.extra_work_id, "rejected")}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={saving[ew.extra_work_id]}
                  onClick={() => handleReview(ew.extra_work_id, "approved")}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default ExtraWorkPanel;
