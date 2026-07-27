import React from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { fmtDate } from "../utils";

const PendingLeaveApprovals = React.memo(function PendingLeaveApprovals({
  pendingLeavesRows,
  pendingLeaves,
  reviewing,
  handleLeave,
}) {
  if (!pendingLeavesRows.length) return null;

  return (
    <div className="admin-dash-card !p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <AlertCircle size={16} className="text-amber-500" />
        <h2 className="text-base font-semibold text-gray-700">
          Pending Leave Approvals
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
            {pendingLeaves}
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-att-table w-full">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeavesRows.map((l) => (
              <tr key={l.leave_request_id}>
                <td>
                  <p className="font-medium text-sm text-gray-800">
                    {(l.employee_name || "").trim() || "—"}
                  </p>
                  <p className="text-xs text-gray-400">{l.department_name || ""}</p>
                </td>
                <td className="text-sm text-gray-600">{l.leave_type_name || "—"}</td>
                <td className="text-sm text-gray-600">{fmtDate(l.from_date)}</td>
                <td className="text-sm text-gray-600">{fmtDate(l.to_date)}</td>
                <td className="text-sm text-gray-600">{l.days}</td>
                <td className="text-sm text-gray-500 max-w-[160px] truncate">{l.reason || "—"}</td>
                <td>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleLeave(l.leave_request_id, "approve")}
                      disabled={reviewing === l.leave_request_id}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleLeave(l.leave_request_id, "reject")}
                      disabled={reviewing === l.leave_request_id}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pendingLeaves > 8 && (
        <p className="text-xs text-blue-600 text-center py-3 border-t border-gray-100">
          +{pendingLeaves - 8} more — go to Leave Requests tab
        </p>
      )}
    </div>
  );
});

export default PendingLeaveApprovals;
