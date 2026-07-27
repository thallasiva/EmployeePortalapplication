import React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { SESSION_OPTIONS } from "../constants";
import RequestSummary from "./RequestSummary";

const LeaveApplyForm = React.memo(function LeaveApplyForm({
  leaveTypes,
  leaveTypeId,
  setLeaveTypeId,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  fromSession,
  setFromSession,
  toSession,
  setToSession,
  reason,
  setReason,
  submitting,
  days,
  selectedColor,
  selectedBalance,
  onSubmit,
  onClear,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main form card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e8eef5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <CalendarDays size={16} color="#f18200" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1f2937]">Apply for Leave</p>
              <p className="text-[12px] text-[#94a3b8]">
                Fill in the details below to submit a leave request
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Leave type */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] text-[#374151] appearance-none outline-none bg-white focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.leave_type_id} value={lt.leave_type_id}>
                      {lt.leave_type_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-3.5 text-[#94a3b8] pointer-events-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* From */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  From Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                />
                <div className="mt-2">
                  <label className="block text-[12px] text-[#94a3b8] mb-1">Session</label>
                  <div className="relative">
                    <select
                      value={fromSession}
                      onChange={(e) => setFromSession(e.target.value)}
                      className="w-full h-[38px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] appearance-none outline-none bg-white focus:border-[#f18200] transition-all"
                    >
                      {SESSION_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-3 text-[#94a3b8] pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  To Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-[44px] border border-[#e2e8f0] rounded-lg px-4 text-[14px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
                />
                <div className="mt-2">
                  <label className="block text-[12px] text-[#94a3b8] mb-1">Session</label>
                  <div className="relative">
                    <select
                      value={toSession}
                      onChange={(e) => setToSession(e.target.value)}
                      className="w-full h-[38px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] appearance-none outline-none bg-white focus:border-[#f18200] transition-all"
                    >
                      {SESSION_OPTIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-3 text-[#94a3b8] pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Enter your reason for leave…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg p-4 text-[14px] outline-none resize-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="h-[42px] px-8 bg-[#f18200] hover:bg-[#e07000] rounded-lg text-white text-[14px] font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={onClear}
                className="h-[42px] px-6 border border-[#e2e8f0] rounded-lg text-[#64748b] text-[14px] hover:bg-[#f8fafc] transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <RequestSummary
            days={days}
            selectedColor={selectedColor}
            fromDate={fromDate}
            toDate={toDate}
            selectedBalance={selectedBalance}
          />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-700">
            <p className="font-semibold mb-1">Important</p>
            <p>Leave requests require manager approval. Approved leaves will appear in your calendar.</p>
          </div>
        </div>
      </div>
    </form>
  );
});

export default LeaveApplyForm;
