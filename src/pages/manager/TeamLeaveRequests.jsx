import React, { useEffect, useState } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { Check, X } from "lucide-react";
import { listLeaveRequests, reviewLeaveRequest } from "../../api/leaveRequest.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import ManagerTabs from "./ManagerTabs";
import "../admin/adminDashboard.css";

const STATUS_BADGE = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected"
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}


function mapRequest(row) {
  return {
    id: row.leave_request_id,
    employee: (row.employee_name || "").trim() || "—",
    type: row.leave_type_name || "—",
    from: formatDate(row.from_date),
    to: formatDate(row.to_date),
    days: Number(row.days) || 0,
    reason: row.reason || "—",
    appliedOn: formatDate(row.applied_on),
    status: row.status
  };
}

const TeamLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { paged: pagedReqs, page: reqPage, setPage: setReqPage, totalPages: reqTotalPages, from: reqFrom, to: reqTo, total: reqTotal, pageSize: reqPageSize, setPageSize: setReqPageSize } = usePagination(requests);

  const loadRequests = () => {
    setLoading(true);
    return listLeaveRequests({}).
    then((res) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      setRequests(data.map(mapRequest));
    }).
    catch(() => setRequests([])).
    finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = (id, decision) => {
    setRequests((prev) =>
    prev.map((r) => r.id === id ? { ...r, status: decision } : r)
    );
    reviewLeaveRequest(id, {
      decision,
      remarks: decision === "Rejected" ? "Rejected by reporting manager" : undefined
    }).
    then(() => {
      successToast(`Leave request ${decision.toLowerCase()}`);
      loadRequests();
    }).
    catch((err) => {
      errorToast(err?.response?.data?.message || "Failed to update leave request.");
      loadRequests();
    });
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
        {loading ?
        <p className="text-sm text-gray-400 text-center py-8">Loading requests...</p> :
        requests.length === 0 ?
        <p className="text-sm text-gray-400 text-center py-8">
            No leave requests from your team yet.
          </p> :

        pagedReqs.map((r) =>
        <div
          key={r.id}
          className="admin-dash-card flex flex-wrap items-center justify-between gap-4">

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
                {r.status === "Pending" &&
            <div className="flex items-center gap-2">
                    <button
                type="button"
                onClick={() => updateStatus(r.id, "Approved")}
                className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg">

                      <Check size={14} /> Approve
                    </button>
                    <button
                type="button"
                onClick={() => updateStatus(r.id, "Rejected")}
                className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg">

                      <X size={14} /> Reject
                    </button>
                  </div>
            }
              </div>
            </div>
        )
        }
      </div>
      <Pagination page={reqPage} setPage={setReqPage} totalPages={reqTotalPages} from={reqFrom} to={reqTo} total={reqTotal} pageSize={reqPageSize} setPageSize={setReqPageSize} />
    </div>);

};

export default TeamLeaveRequests;
