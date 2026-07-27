import React from "react";
import { STATUS_STYLES } from "../constants";
import { formatDate } from "../utils";

const RequestCard = React.memo(function RequestCard({ row, onCancel, cancelling }) {
  const st = STATUS_STYLES[row.status] || STATUS_STYLES.Pending;
  return (
    <div className="bg-white border border-[#e8eef5] rounded-xl p-4 mb-3 hover:shadow-sm transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <p className="font-semibold text-[#1f2937] text-[14px]">{row.leave_type_name}</p>
        </div>
        <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
          {row.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[13px] text-[#64748b]">
        <span>
          <strong className="text-[#374151]">From:</strong>{" "}
          {formatDate(row.from_date)}
          {row.from_session && row.from_session !== "Full Day" ? ` (${row.from_session})` : ""}
        </span>
        <span>
          <strong className="text-[#374151]">To:</strong>{" "}
          {formatDate(row.to_date)}
          {row.to_session && row.to_session !== "Full Day" ? ` (${row.to_session})` : ""}
        </span>
        <span><strong className="text-[#374151]">Days:</strong> {row.days}</span>
        {row.reviewer_name && (
          <span><strong className="text-[#374151]">Reviewed by:</strong> {row.reviewer_name}</span>
        )}
        {row.reason && (
          <span className="sm:col-span-2">
            <strong className="text-[#374151]">Reason:</strong> {row.reason}
          </span>
        )}
        {row.remarks && (
          <span className="sm:col-span-2">
            <strong className="text-[#374151]">Remarks:</strong> {row.remarks}
          </span>
        )}
      </div>

      {row.status === "Pending" && (
        <div className="mt-3">
          <button
            type="button"
            disabled={cancelling}
            onClick={() => onCancel(row.leave_request_id)}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {cancelling ? "Cancelling…" : "Cancel Request"}
          </button>
        </div>
      )}
    </div>
  );
});

export default RequestCard;
