import { memo } from "react";
import { useTimesheetTab } from "../hooks/useTimesheetTab";
import TimesheetWeekNav from "./TimesheetWeekNav";
import TimesheetGrid from "./TimesheetGrid";
import TimesheetActions from "./TimesheetActions";
import ExtraWorkList from "./ExtraWorkList";
import ExtraWorkModal from "./ExtraWorkModal";
import AddTaskModal from "../AddTaskModal";

const TimesheetTab = memo(function TimesheetTab({ jumpTo = null }) {
  const {
    setWeekOffset,
    dates,
    entries,
    timesheet,
    loading, saving,
    err, toast,
    showExtraWork, setShowExtraWork,
    myExtraWork,
    allTasks,
    editTask, setEditTask,
    isLocked, canEdit,
    overDays, hasOvertime,
    updateEntry, updateHours, addRow, removeRow,
    handleSave, handleSubmit, handleExtraWorkSubmit, handleUpdateTask,
  } = useTimesheetTab(jumpTo);

  return (
    <div className="space-y-4">
      <TimesheetWeekNav dates={dates} timesheet={timesheet} setWeekOffset={setWeekOffset} />

      {timesheet?.status === "rejected" && timesheet.comments && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <strong>Rejection reason:</strong> {timesheet.comments}
        </div>
      )}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
          ✓ {toast}
        </div>
      )}
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{err}</div>
      )}
      {isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          🔒 This timesheet has been <strong>approved</strong> and is locked from editing.
        </div>
      )}

      {loading ? (
        <div className="ts-loading">Loading…</div>
      ) : (
        <>
          <TimesheetGrid
            entries={entries}
            dates={dates}
            canEdit={canEdit}
            isLocked={isLocked}
            allTasks={allTasks}
            updateEntry={updateEntry}
            updateHours={updateHours}
            removeRow={removeRow}
            setEditTask={setEditTask}
          />
          <TimesheetActions
            canEdit={canEdit}
            hasOvertime={hasOvertime}
            saving={saving}
            addRow={addRow}
            handleSave={handleSave}
            handleSubmit={handleSubmit}
            setShowExtraWork={setShowExtraWork}
          />
          <ExtraWorkList myExtraWork={myExtraWork} />
        </>
      )}

      {showExtraWork && (
        <ExtraWorkModal
          timesheetId={timesheet?.timesheet_id}
          overDays={overDays}
          onClose={() => setShowExtraWork(false)}
          onSubmit={handleExtraWorkSubmit}
        />
      )}
      {editTask && (
        <AddTaskModal task={editTask} onClose={() => setEditTask(null)} onSave={handleUpdateTask} />
      )}
    </div>
  );
});

export default TimesheetTab;
