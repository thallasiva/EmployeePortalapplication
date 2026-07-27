import React, { useEffect, useState } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { Check, X } from "lucide-react";
import { listLeaveRequests, reviewLeaveRequest } from "../../api/leaveRequest.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import RecruiterTabs from "./RecruiterTabs";
import "../admin/adminDashboard.css";

const STATUS_BADGE = { Pending: "pending", Approved: "approved", Rejected: "rejected" };

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapRow(row) {
  return {
    id:        row.leave_request_id,
    employee:  (row.employee_name || "").trim() || "—",
    type:      row.leave_type_name || "—",
    from:      formatDate(row.from_date),
    to:        formatDate(row.to_date),
    days:      Number(row.days) || 0,
    reason:    row.reason || "—",
    appliedOn: formatDate(row.applied_on),
    status:    row.status,
  };
}

const RecruiterTeamLeave = () => {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("Pending");

  const load = () => {
    setLoading(true);
    listLeaveRequests({})
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        setRequests(data.map(mapRow));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const action = (id, decision) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: decision } : r));
    reviewLeaveRequest(id, {
      decision,
      remarks: decision === "Rejected" ? "Rejected by HR Manager" : undefined,
    })
      .then(() => { successToast(`Leave ${decision.toLowerCase()}`); load(); })
      .catch((err) => { errorToast(err?.response?.data?.message || "Failed"); load(); });
  };

  const filtered = filter === "All" ? requests : requests.filter((r) => r.status === filter);
  const { paged: pagedLeave, page: leavePage, setPage: setLeavePage, totalPages: leaveTotalPages, from: leaveFrom, to: leaveTo, total: leaveTotal, pageSize: leavePageSize, setPageSize: setLeavePageSize } = usePagination(filtered);

  return (
    <div className="admin-dash space-y-4">
      <RecruiterTabs />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Leave Requests</h1>
          <p className="text-gray-500 mt-1">Review and approve leave requests from your recruiters.</p>
        </div>
        <div className="flex gap-2">
          {["Pending", "Approved", "Rejected", "All"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
              {s === "Pending" && (
                <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 text-xs">
                  {requests.filter((r) => r.status === "Pending").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No {filter.toLowerCase()} leave requests.</p>
        ) : (
          <>
          {pagedLeave.map((r) => (
            <div key={r.id} className="admin-dash-card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{r.employee}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {r.type} &middot; {r.from} &ndash; {r.to} ({r.days} day{r.days > 1 ? "s" : ""})
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Reason: {r.reason} &middot; Applied: {r.appliedOn}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`admin-status-badge ${STATUS_BADGE[r.status] || "pending"}`}>{r.status}</span>
                {r.status === "Pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => action(r.id, "Approved")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => action(r.id, "Rejected")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination page={leavePage} setPage={setLeavePage} totalPages={leaveTotalPages} from={leaveFrom} to={leaveTo} total={leaveTotal} pageSize={leavePageSize} setPageSize={setLeavePageSize} />
          </>
        )}
      </div>
    </div>
  );
};

export default RecruiterTeamLeave;
