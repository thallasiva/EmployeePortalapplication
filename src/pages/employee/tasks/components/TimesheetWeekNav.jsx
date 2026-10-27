import { memo } from "react";
import { fmt } from "../utils/dateUtils";
import { STATUS_STYLE, STATUS_LABEL } from "../constants/taskConstants";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TimesheetWeekNav = memo(function TimesheetWeekNav({ dates, timesheet, setWeekOffset }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setWeekOffset((w) => w - 1)}
        className="ts-btn-ghost text-sm">
        <ChevronLeft size={14} className="inline -mt-0.5" /> Prev
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">
          {fmt(dates[0])} – {fmt(dates[6])}
        </p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          timesheet ? STATUS_STYLE[timesheet.status] : "text-gray-400"
        }`}>
          {timesheet ? STATUS_LABEL[timesheet.status] : "No entry"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setWeekOffset((w) => w + 1)}
        className="ts-btn-ghost text-sm">
        Next <ChevronRight size={14} className="inline -mt-0.5" />
      </button>
    </div>
  );
});

export default TimesheetWeekNav;
