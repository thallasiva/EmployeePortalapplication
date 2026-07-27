import { memo } from "react";
import { DAYS, PROJECTS, MAX_DAILY_HOURS } from "../constants/taskConstants";
import { fmt, fmtDuration } from "../utils/dateUtils";
import { colTotal, rowTotal } from "../utils/timesheetUtils";

const TimesheetGrid = memo(function TimesheetGrid({
  entries,
  dates,
  canEdit,
  isLocked,
  allTasks,
  updateEntry,
  updateHours,
  removeRow,
  setEditTask,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[980px]">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="px-3 py-3 text-left w-[150px]">Project</th>
            <th className="px-3 py-3 text-left w-[170px]">Task / Activity</th>
            <th className="px-3 py-3 text-left w-[110px]">Start / End</th>
            {DAYS.map((day, i) => {
              const over = colTotal(entries, day) > MAX_DAILY_HOURS;
              return (
                <th key={day} className={`px-2 py-3 text-center w-[64px] ${over ? "text-red-500" : ""}`}>
                  <div>{day}</div>
                  <div className="text-[10px] font-normal text-gray-400">{fmt(dates[i])}</div>
                </th>
              );
            })}
            <th className="px-3 py-3 text-center w-[60px]">Total</th>
            {canEdit && <th className="w-[32px]" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-2 py-2">
                <select disabled={isLocked} className="ts-input w-full text-xs"
                  value={row.project} onChange={(e) => updateEntry(row.id, "project", e.target.value)}>
                  {PROJECTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <input disabled={isLocked} className="ts-input flex-1 text-xs"
                    placeholder="Task name" value={row.taskName}
                    onChange={(e) => updateEntry(row.id, "taskName", e.target.value)} />
                  {row.taskId && (
                    <button type="button" title="Edit task details"
                      onClick={() => setEditTask(allTasks.find((t) => t.task_id === row.taskId) || null)}
                      className="shrink-0 text-brand hover:text-orange-600 text-sm px-1">✏️</button>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <input disabled={isLocked} className="ts-input flex-1 text-xs"
                    placeholder="Activity" value={row.activityDesc}
                    onChange={(e) => updateEntry(row.id, "activityDesc", e.target.value)} />
                  {row.taskId && (
                    <span className="shrink-0 text-[9px] font-semibold text-brand bg-orange-50 border border-orange-200 rounded px-1">Task</span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2">
                <input type="time" disabled={isLocked} className="ts-input w-full text-xs"
                  value={row.startTime} onChange={(e) => updateEntry(row.id, "startTime", e.target.value)} />
                <input type="time" disabled={isLocked} className="ts-input w-full text-xs mt-1"
                  value={row.endTime} onChange={(e) => updateEntry(row.id, "endTime", e.target.value)} />
              </td>
              {DAYS.map((day) => {
                const val = row.hours[day]?.value || "";
                const cellOver = colTotal(entries, day) > MAX_DAILY_HOURS && parseFloat(val) > 0;
                return (
                  <td key={day} className="px-1 py-2 text-center">
                    <input type="number" min="0" max="24" step="0.5"
                      disabled={isLocked}
                      className={`ts-hour-input ${cellOver ? "border-red-400 bg-red-50 text-red-700" : ""}`}
                      placeholder="0" value={val}
                      onChange={(e) => updateHours(row.id, day, e.target.value)} />
                  </td>
                );
              })}
              <td className="px-3 py-2 text-center font-semibold text-brand text-sm">
                {fmtDuration(rowTotal(row.hours))}
              </td>
              {canEdit && (
                <td className="px-2 py-2 text-center">
                  {entries.length > 1 && (
                    <button type="button" onClick={() => removeRow(row.id)}
                      className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200 text-xs font-semibold">
            <td colSpan={3} className="px-4 py-2 text-gray-500 uppercase tracking-wide">Daily Total</td>
            {DAYS.map((day) => {
              const total = colTotal(entries, day);
              const over = total > MAX_DAILY_HOURS;
              return (
                <td key={day} className={`px-1 py-2 text-center ${over ? "text-red-600 font-bold" : "text-gray-700"}`}>
                  {total > 0 ? fmtDuration(total) : <span className="text-gray-300">—</span>}
                </td>
              );
            })}
            <td className="px-3 py-2 text-center font-bold text-brand">
              {fmtDuration(entries.reduce((s, r) => s + rowTotal(r.hours), 0))}
            </td>
            {canEdit && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

export default TimesheetGrid;
