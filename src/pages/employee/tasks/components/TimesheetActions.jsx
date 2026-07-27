import { memo } from "react";

const TimesheetActions = memo(function TimesheetActions({
  canEdit,
  hasOvertime,
  saving,
  addRow,
  handleSave,
  handleSubmit,
  setShowExtraWork,
}) {
  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-3 justify-end">
      {hasOvertime && (
        <button type="button" onClick={() => setShowExtraWork(true)}
          className="ts-btn-ghost text-amber-600 border-amber-300 text-sm">
          ⚠ Extra Work Request
        </button>
      )}
      <button type="button" onClick={addRow} className="ts-btn-ghost text-sm">
        + Add Row
      </button>
      <button type="button" onClick={handleSave} disabled={saving} className="ts-btn-ghost text-sm">
        {saving ? "Saving…" : "Save Draft"}
      </button>
      <button type="button" onClick={handleSubmit} disabled={saving || hasOvertime}
        title={hasOvertime ? "Fix overtime before submitting" : undefined}
        className={`ts-btn-primary text-sm ${hasOvertime ? "opacity-40 cursor-not-allowed" : ""}`}>
        {saving ? "Submitting…" : "Submit for Approval"}
      </button>
    </div>
  );
});

export default TimesheetActions;
