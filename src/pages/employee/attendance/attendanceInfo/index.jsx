import React from "react";
import { useAttendanceData } from "./hooks/useAttendanceData";
import AttendanceHeader from "./components/AttendanceHeader";
import SummaryCards from "./components/SummaryCards";
import AttendanceCalendar from "./components/AttendanceCalendar";
import DayDetailPanel from "./components/DayDetailPanel";

export default function AttendanceInfo() {
  const {
    user,
    today,
    monthLabel,
    grid,
    dayMap,
    recordsByDate,
    selected,
    selectedIso,
    setSelectedIso,
    summary,
    loading,
    todayRecord,
    punching,
    handleCheckIn,
    handleCheckOut,
    prevMonth,
    nextMonth
  } = useAttendanceData();

  return (
    <div className="min-h-full bg-[#f5f7fb] -m-6 md:-m-8 p-4 md:p-6 space-y-4">
      <AttendanceHeader
        todayRecord={todayRecord}
        punching={punching}
        handleCheckIn={handleCheckIn}
        handleCheckOut={handleCheckOut}
      />

      <SummaryCards
        loading={loading}
        summary={summary}
        recordsByDate={recordsByDate}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <AttendanceCalendar
          grid={grid}
          dayMap={dayMap}
          monthLabel={monthLabel}
          selectedIso={selectedIso}
          today={today}
          onSelectDay={setSelectedIso}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <DayDetailPanel selected={selected} user={user} />
      </div>
    </div>
  );
}
