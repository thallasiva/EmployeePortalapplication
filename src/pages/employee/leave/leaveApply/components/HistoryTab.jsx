import React from "react";
import { Clock } from "lucide-react";
import Pagination from "../../../../../components/Pagination";
import RequestCard from "./RequestCard";

const HistoryTab = React.memo(function HistoryTab({
  loadingList,
  pagedHistory,
  historyRequests,
  histPage,
  setHistPage,
  histTotalPages,
  histFrom,
  histTo,
  histTotal,
  histPageSize,
  setHistPageSize,
}) {
  return (
    <div className="max-w-2xl">
      {loadingList ? (
        <div className="bg-white border border-[#e8eef5] rounded-xl h-[200px] flex items-center justify-center">
          <p className="text-[#94a3b8] text-[14px]">Loading…</p>
        </div>
      ) : historyRequests.length === 0 ? (
        <div className="bg-white border border-[#e8eef5] rounded-xl h-[300px] flex flex-col items-center justify-center gap-3">
          <Clock size={40} className="text-[#e2e8f0]" />
          <p className="text-[#94a3b8] text-[15px]">No leave history found</p>
        </div>
      ) : (
        <>
          {pagedHistory.map((row) => (
            <RequestCard key={row.leave_request_id} row={row} onCancel={() => {}} />
          ))}
          <Pagination
            page={histPage}
            setPage={setHistPage}
            totalPages={histTotalPages}
            from={histFrom}
            to={histTo}
            total={histTotal}
            pageSize={histPageSize}
            setPageSize={setHistPageSize}
          />
        </>
      )}
    </div>
  );
});

export default HistoryTab;
