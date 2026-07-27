import React from "react";
import { getLeaveColor } from "./utils";
import useLeaveApply from "./hooks/useLeaveApply";
import BalanceCard from "./components/BalanceCard";
import LeaveApplyForm from "./components/LeaveApplyForm";
import PendingTab from "./components/PendingTab";
import HistoryTab from "./components/HistoryTab";

const TABS = (pendingCount) => [
  { key: "apply", label: "Apply" },
  { key: "pending", label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
  { key: "history", label: "History" },
];

export default function LeaveApply() {
  const {
    activeTab,
    setActiveTab,
    leaveTypes,
    balances,
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
    pendingRequests,
    historyRequests,
    loadingList,
    cancellingId,
    pagedHistory,
    histPage,
    setHistPage,
    histTotalPages,
    histFrom,
    histTo,
    histTotal,
    histPageSize,
    setHistPageSize,
    days,
    selectedBalance,
    selectedColor,
    handleCancel,
    handleSubmit,
    resetForm,
  } = useLeaveApply();

  const tabs = TABS(pendingRequests.length);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* Page header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Leave</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">
            Manage your leave requests and view your calendar
          </p>
        </div>
      </div>

      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="px-6 pb-4 flex gap-3 overflow-x-auto pb-2">
          {balances.map((b, idx) => (
            <BalanceCard
              key={b.leave_type_id}
              name={b.leave_type_name}
              balance={b.available ?? b.balance ?? 0}
              total={b.total_days ?? b.total ?? b.annual_quota ?? 0}
              color={getLeaveColor(idx)}
            />
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="px-6">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 h-[38px] rounded-lg text-[13px] font-medium transition-all ${
                activeTab === key
                  ? "bg-[#f18200] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 pt-4">
        {activeTab === "apply" && (
          <LeaveApplyForm
            leaveTypes={leaveTypes}
            leaveTypeId={leaveTypeId}
            setLeaveTypeId={setLeaveTypeId}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            fromSession={fromSession}
            setFromSession={setFromSession}
            toSession={toSession}
            setToSession={setToSession}
            reason={reason}
            setReason={setReason}
            submitting={submitting}
            days={days}
            selectedColor={selectedColor}
            selectedBalance={selectedBalance}
            onSubmit={handleSubmit}
            onClear={resetForm}
          />
        )}

        {activeTab === "pending" && (
          <PendingTab
            loadingList={loadingList}
            pendingRequests={pendingRequests}
            onCancel={handleCancel}
            cancellingId={cancellingId}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab
            loadingList={loadingList}
            pagedHistory={pagedHistory}
            historyRequests={historyRequests}
            histPage={histPage}
            setHistPage={setHistPage}
            histTotalPages={histTotalPages}
            histFrom={histFrom}
            histTo={histTo}
            histTotal={histTotal}
            histPageSize={histPageSize}
            setHistPageSize={setHistPageSize}
          />
        )}
      </div>
    </div>
  );
}
