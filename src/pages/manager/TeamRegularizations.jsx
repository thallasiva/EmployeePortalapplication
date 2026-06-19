import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { listRegularizations, reviewRegularization } from "../../api/attendance.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

const STATUS_BADGE = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? String(val) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

const TeamRegularizations = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    listRegularizations({ limit: 200 })
      .then(({ data }) => setRequests(data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = (id, decision) => {
    reviewRegularization(id, { decision })
      .then(() => {
        successToast(`Regularization request ${decision.toLowerCase()}`);
        load();
      })
      .catch((err) => {
        errorToast(err?.response?.data?.message || "Failed to update request.");
        load();
      });
  };

  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Regularization Requests</h1>
        <p className="text-gray-500 mt-1">Review attendance regularization requests from your team.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No regularization requests from your team yet.
          </p>
        ) : (
          requests.map((r) => (
            <div
              key={r.regularization_id}
              className="admin-dash-card flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{r.employee_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(r.attendance_date)} · Requested {fmt(r.requested_check_in)} – {fmt(r.requested_check_out)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Reason: {r.reason || "—"} · Applied on {formatDate(r.created_at)}
                </p>
                {r.remarks && (
                  <p className="text-xs text-gray-400 mt-1">Remarks: {r.remarks}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className={`admin-status-badge ${STATUS_BADGE[r.status] || "pending"}`}>
                  {r.status}
                </span>
                {r.status === "Pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(r.regularization_id, "Approved")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(r.regularization_id, "Rejected")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamRegularizations;
