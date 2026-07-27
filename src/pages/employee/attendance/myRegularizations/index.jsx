import React from "react";
import RegularizationDetails from "../RegularizationDetails";
import { useRegularizationState } from "./hooks/useRegularizationState";
import TabSwitcher from "./components/TabSwitcher";
import ApplyTab from "./components/ApplyTab";
import PendingTab from "./components/PendingTab";
import HistoryTab from "./components/HistoryTab";

export default function MyRegularizations({ onBack }) {
  const {
    goBack,
    tab,
    setTab,
    monthLabel,
    grid,
    todayIso,
    selectedIso,
    setSelectedIso,
    expandedId,
    toggleHistory,
    detailRecord,
    setDetailRecord,
    pendingItems,
    reason,
    setReason,
    firstIn,
    setFirstIn,
    lastOut,
    setLastOut,
    isException,
    prevMonth,
    nextMonth,
    submitRegularization,
  } = useRegularizationState(onBack);

  if (detailRecord) {
    return (
      <div className="-mx-1 space-y-3">
        <nav className="text-sm text-sky-600">
          <button type="button" onClick={goBack} className="hover:underline">
            Attendance Info
          </button>
          <span className="text-slate-400 mx-1">/</span>
          <button type="button" onClick={() => setDetailRecord(null)} className="hover:underline">
            My Regularizations
          </button>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-600">View Details</span>
        </nav>
        <RegularizationDetails record={detailRecord} onBack={() => setDetailRecord(null)} />
      </div>
    );
  }

  return (
    <div className="-mx-1 flex flex-col min-h-[calc(100vh-5.5rem)]">
      <nav className="text-sm text-sky-600 mb-3">
        <button type="button" onClick={goBack} className="hover:underline">
          Attendance Info
        </button>
        <span className="text-slate-400 mx-1">/</span>
        <span className="text-slate-600">My Regularizations</span>
      </nav>

      <TabSwitcher tab={tab} onTabChange={setTab} />

      {tab === "apply" && (
        <ApplyTab
          grid={grid}
          monthLabel={monthLabel}
          todayIso={todayIso}
          selectedIso={selectedIso}
          isException={isException}
          onSelectDate={setSelectedIso}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          reason={reason}
          firstIn={firstIn}
          lastOut={lastOut}
          onReasonChange={setReason}
          onFirstInChange={setFirstIn}
          onLastOutChange={setLastOut}
          onSubmit={submitRegularization}
        />
      )}

      {tab === "pending" && <PendingTab pendingItems={pendingItems} />}

      {tab === "history" && (
        <HistoryTab
          expandedId={expandedId}
          onToggle={toggleHistory}
          onViewDetails={setDetailRecord}
        />
      )}
    </div>
  );
}
