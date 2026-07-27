import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmt, avatarColor, initials } from "../utils";

const CALENDAR_STYLES = `
  .react-calendar { width: 100%; border: none; font-family: inherit; }
  .react-calendar__navigation { height: 64px; margin-bottom: 0; border-bottom: 1px solid #e6edf5; }
  .react-calendar__navigation button { font-size: 16px; color: #334155; min-width: 44px; background: transparent; }
  .react-calendar__month-view__weekdays { text-align: center; border-bottom: 1px solid #e6edf5; }
  .react-calendar__month-view__weekdays__weekday { padding: 12px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
  .react-calendar__tile { height: 90px; text-align: left; padding: 10px; border-right: 1px solid #e6edf5 !important; border-bottom: 1px solid #e6edf5 !important; position: relative; background: white; }
  .react-calendar__tile:hover { background: #f8fbff !important; }
  .react-calendar__tile--active { background: #eef7ff !important; color: #1f2937 !important; }
  .react-calendar__tile--active abbr { background: #2ea7ff; color: white; border-radius: 999px; padding: 3px 7px; }
  .react-calendar__tile abbr { text-decoration: none; font-size: 13px; }
  .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.35; }
`;

const CalendarPane = React.memo(function CalendarPane({
  selected,
  year,
  month,
  leaveByDate,
  holidayByDate,
  loading,
  leavesCount,
  onDateChange,
  onActiveStartDateChange,
}) {
  return (
    <>
      <style>{CALENDAR_STYLES}</style>
      <Calendar
        value={selected}
        activeStartDate={new Date(year, month - 1, 1)}
        onActiveStartDateChange={({ activeStartDate }) => onActiveStartDateChange(activeStartDate)}
        onChange={onDateChange}
        prevLabel={<ChevronLeft size={16} />}
        nextLabel={<ChevronRight size={16} />}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const d = fmt(date);
          const holiday = holidayByDate[d];
          const dayLeaves = leaveByDate[d] || [];

          return (
            <>
              {holiday && (
                <span
                  title={holiday.holiday_name}
                  className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                    holiday.is_restricted ? "bg-[#facc15]" : "bg-[#d9b8ff]"
                  }`}
                />
              )}
              {dayLeaves.length > 0 && (
                <span className="absolute bottom-2 left-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2ea7ff] text-white text-[10px] font-semibold">
                  {dayLeaves.length}
                </span>
              )}
              {dayLeaves.length > 0 && (
                <div className="absolute bottom-2 right-2 flex -space-x-1.5">
                  {dayLeaves.slice(0, 2).map((lr, i) => (
                    <span
                      key={i}
                      title={lr.employee_name}
                      className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-1 ring-white ${avatarColor(lr.employee_name)}`}
                    >
                      {initials(lr.employee_name || "?")}
                    </span>
                  ))}
                  {dayLeaves.length > 2 && (
                    <span className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-[9px] font-bold flex items-center justify-center ring-1 ring-white">
                      +{dayLeaves.length - 2}
                    </span>
                  )}
                </div>
              )}
            </>
          );
        }}
      />
      <div className="flex items-center gap-6 px-5 py-3 border-t border-[#e6edf5] text-[13px] text-[#64748b]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2ea7ff]" /> Team on Leave{" "}
          {loading ? "" : `(${leavesCount})`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#facc15]" /> Restricted Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#d9b8ff]" /> General Holiday
        </span>
      </div>
    </>
  );
});

export default CalendarPane;
