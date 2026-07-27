import React from "react";
import { CalendarDays } from "lucide-react";
import RequestCard from "./RequestCard";

const PendingTab = React.memo(function PendingTab({
  loadingList,
  pendingRequests,
  onCancel,
  cancellingId,
}) {
  return (
    <div className="max-w-2xl">
      {loadingList ? (
        <div className="bg-white border border-[#e8eef5] rounded-xl h-[200px] flex items-center justify-center">
          <p className="text-[#94a3b8] text-[14px]">Loading…</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="bg-white border border-[#e8eef5] rounded-xl h-[300px] flex flex-col items-center justify-center gap-3">
          <CalendarDays size={40} className="text-[#e2e8f0]" />
          <p className="text-[#94a3b8] text-[15px]">No pending leave requests</p>
        </div>
      ) : (
        pendingRequests.map((row) => (
          <RequestCard
            key={row.leave_request_id}
            row={row}
            onCancel={onCancel}
            cancelling={cancellingId === row.leave_request_id}
          />
        ))
      )}
    </div>
  );
});

export default PendingTab;
