import { memo } from "react";
import { fmtDuration } from "../utils/dateUtils";
import { MAX_DAILY_HOURS } from "../constants/taskConstants";

const TaskOverHoursPanel = memo(function TaskOverHoursPanel({
  isOverHours,
  exceedsWithExisting,
  maxExistingOnRange,
  durationHours,
  projectedTotal,
  extraHoursNeeded,
  onClose,
  onOpenExtraWork,
}) {
  if (isOverHours) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-red-600 mb-1">⚠️ Exceeds 8hr daily limit</p>
        <p className="text-xs text-red-500 mb-3">
          Regular tasks are capped at <strong>08hr / day</strong>. Set this to 8hr and raise an
          <strong> Extra Work Request</strong> for the remaining hours.
        </p>
        <button
          type="button"
          onClick={() => { onClose(); onOpenExtraWork?.(); }}
          className="text-xs font-semibold text-white bg-brand rounded-lg px-3 py-1.5 hover:bg-orange-600">
          Close &amp; Raise Extra Work Request
        </button>
      </div>
    );
  }

  if (exceedsWithExisting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
        <p className="text-sm font-semibold text-red-600">⛔ Daily hour limit exceeded</p>
        <div className="text-xs text-red-500 space-y-1">
          <div className="flex justify-between">
            <span>Already logged</span>
            <span className="font-semibold">{fmtDuration(maxExistingOnRange)}</span>
          </div>
          <div className="flex justify-between">
            <span>This task</span>
            <span className="font-semibold">{fmtDuration(durationHours)}</span>
          </div>
          <div className="flex justify-between border-t border-red-200 pt-1 mt-1">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-red-700">{fmtDuration(projectedTotal)} / 8hr limit</span>
          </div>
        </div>
        <p className="text-xs text-red-500 pt-1">
          Reduce this task to{" "}
          <strong>{fmtDuration(MAX_DAILY_HOURS - maxExistingOnRange)}</strong> or raise an
          <strong> Extra Work Request</strong> for the extra{" "}
          <strong>{fmtDuration(extraHoursNeeded)}</strong>.
        </p>
        <button
          type="button"
          onClick={() => { onClose(); onOpenExtraWork?.(); }}
          className="text-xs font-semibold text-white bg-brand rounded-lg px-3 py-1.5 hover:bg-orange-600">
          ⚡ Raise Extra Work Request ({fmtDuration(extraHoursNeeded)} extra)
        </button>
      </div>
    );
  }

  return null;
});

export default TaskOverHoursPanel;
