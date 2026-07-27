import React from "react";
import { useLeaveCalendar } from "./hooks/useLeaveCalendar";
import FilterBar from "./components/FilterBar";
import CalendarPane from "./components/CalendarPane";
import SidePanel from "./components/SidePanel";

export default function LeaveCalendar() {
  const {
    canViewAll,
    selected,
    setSelected,
    setViewDate,
    filterType,
    setFilterType,
    search,
    setSearch,
    leaves,
    loading,
    month,
    year,
    leaveByDate,
    holidayByDate,
    selectedHoliday,
    selectedLeaves,
    monthLeaves,
  } = useLeaveCalendar();

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-semibold text-[#1f2937]">Leave Calendar</h1>
      </div>

      <FilterBar
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        canViewAll={canViewAll}
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7 bg-white border border-[#dce3eb] rounded overflow-hidden">
          <CalendarPane
            selected={selected}
            year={year}
            month={month}
            leaveByDate={leaveByDate}
            holidayByDate={holidayByDate}
            loading={loading}
            leavesCount={leaves.length}
            onDateChange={setSelected}
            onActiveStartDateChange={setViewDate}
          />
        </div>

        <div className="col-span-5 bg-white border border-[#dce3eb] rounded flex flex-col">
          <SidePanel
            selected={selected}
            selectedHoliday={selectedHoliday}
            selectedLeaves={selectedLeaves}
            search={search}
            onSearchChange={setSearch}
            monthLeaves={monthLeaves}
            loading={loading}
            month={month}
            year={year}
          />
        </div>
      </div>
    </div>
  );
}
