import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { RM_LEAVE_REQUESTS } from "../../data/managerData";
import { successToast } from "../../utils/ToastControllers";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

const STATUS_BADGE = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

const TeamLeaveRequests = () => {
  const [requests, setRequests] = useState(RM_LEAVE_REQUESTS);

  const updateStatus = (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    successToast(`Leave request ${status.toLowerCase()}`);
  };

  return (
    <div className="admin-dash space-y-4">
      <ManagerTabs />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Leave Requests
        </h1>
        <p className="text-gray-500 mt-1">
          Review and action leave requests from your team.
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="admin-dash-card flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-gray-900 text-sm">{r.employee}</p>
              <p className="text-xs text-gray-500 mt-1">
                {r.type} · {r.from} – {r.to} ({r.days} day{r.days > 1 ? "s" : ""})
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Reason: {r.reason} · Applied on {r.appliedOn}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`admin-status-badge ${STATUS_BADGE[r.status]}`}>
                {r.status}
              </span>
              {r.status === "Pending" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, "Approved")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(r.id, "Rejected")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamLeaveRequests;
