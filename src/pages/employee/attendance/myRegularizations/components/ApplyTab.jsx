import React from "react";
import CalendarPanel from "./CalendarPanel";
import RegularizeForm from "./RegularizeForm";

const ApplyTab = React.memo(function ApplyTab({
  grid,
  monthLabel,
  todayIso,
  selectedIso,
  isException,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  reason,
  firstIn,
  lastOut,
  onReasonChange,
  onFirstInChange,
  onLastOutChange,
  onSubmit,
}) {
  return (
    <div className="flex flex-1 gap-3 min-h-0 flex-col lg:flex-row">
      <CalendarPanel
        grid={grid}
        monthLabel={monthLabel}
        todayIso={todayIso}
        selectedIso={selectedIso}
        isException={isException}
        onSelectDate={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

      <RegularizeForm
        selectedIso={selectedIso}
        isException={isException}
        reason={reason}
        firstIn={firstIn}
        lastOut={lastOut}
        onReasonChange={onReasonChange}
        onFirstInChange={onFirstInChange}
        onLastOutChange={onLastOutChange}
        onSubmit={onSubmit}
      />

      <div className="lg:w-[200px] shrink-0 bg-amber-50/90 border border-amber-100 rounded-lg p-4 text-xs text-slate-600 leading-relaxed">
        <p>You can regularise for any exception day(s) on or after 05-05-2026</p>
        <p className="mt-3">You can regularise for a maximum of 5 days</p>
      </div>
    </div>
  );
});

export default ApplyTab;
