import React from "react";
import { formatDate } from "../utils";

const RequestSummary = React.memo(function RequestSummary({
  days,
  selectedColor,
  fromDate,
  toDate,
  selectedBalance,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5">
      <p className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-4">
        Request Summary
      </p>

      <div className="text-center mb-4">
        <div
          className="text-[48px] font-black leading-none"
          style={{ color: days > 0 ? selectedColor : "#e2e8f0" }}
        >
          {days}
        </div>
        <div className="text-[13px] text-[#94a3b8] mt-1">
          {days === 1 ? "Day" : "Days"} requested
        </div>
      </div>

      {fromDate && (
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between py-2 border-t border-[#f1f5f9]">
            <span className="text-[#94a3b8]">From</span>
            <span className="font-medium text-[#1f2937]">{formatDate(fromDate)}</span>
          </div>
          {toDate && (
            <div className="flex justify-between py-2 border-t border-[#f1f5f9]">
              <span className="text-[#94a3b8]">To</span>
              <span className="font-medium text-[#1f2937]">{formatDate(toDate)}</span>
            </div>
          )}
        </div>
      )}

      {selectedBalance && (
        <div
          className="mt-3 p-3 rounded-lg"
          style={{ background: `${selectedColor}0f` }}
        >
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#64748b]">Available Balance</span>
            <span className="font-bold text-[16px]" style={{ color: selectedColor }}>
              {selectedBalance.available ?? selectedBalance.balance ?? 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default RequestSummary;
