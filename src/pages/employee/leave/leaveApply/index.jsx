import React from "react";
import { CalendarDays } from "lucide-react";
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
    <div className="space-y-4 rounded-2xl bg-slate-50 p-3 sm:p-5">
      {/* Page header */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><CalendarDays size={20} /></span>
          <div><h1 className="text-xl font-bold text-slate-950">Apply Leave</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your leave requests and view your calendar
          </p></div>
        </div>
      </div>
      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-2 xl:grid-cols-4">
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
      <div>
        <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 h-[38px] rounded-lg text-[13px] font-medium transition-all ${
                activeTab === key
                  ? "bg-[#e87500] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Tab content */}
      <div className="pt-1">
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
