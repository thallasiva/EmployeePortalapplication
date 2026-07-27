import { memo } from "react";
import { fmtDate, fmtDuration } from "../utils/dateUtils";

const TaskDurationSummary = memo(function TaskDurationSummary({
  durationDays,
  durationHours,
  totalHoursAcrossDays,
  isBlocked,
  startDate,
  endDate,
  startTime,
  endTime,
}) {
  if ((!durationDays && !durationHours) || isBlocked) return null;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Duration Summary</p>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {durationDays && (
          <div className="text-center">
            <p className="text-xl font-bold text-brand">{durationDays}</p>
            <p className="text-[10px] text-gray-500">Day{durationDays !== 1 ? "s" : ""}</p>
          </div>
        )}
        {durationHours && (
          <div className="text-center">
            <p className="text-xl font-bold text-indigo-600">{fmtDuration(durationHours)}</p>
            <p className="text-[10px] text-gray-500">Per Day</p>
          </div>
        )}
        {totalHoursAcrossDays && (
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-600">{fmtDuration(totalHoursAcrossDays)}</p>
            <p className="text-[10px] text-gray-500">Total Hours</p>
          </div>
        )}
      </div>
      {startDate && endDate && (
        <p className="text-[11px] text-gray-500 text-center pt-1">
          {fmtDate(startDate)} → {fmtDate(endDate)}
          {startTime && endTime && (
            <span className="ml-2">· {startTime} – {endTime}</span>
          )}
        </p>
      )}
    </div>
  );
});

export default TaskDurationSummary;
