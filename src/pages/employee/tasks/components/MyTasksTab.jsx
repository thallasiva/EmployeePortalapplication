import { memo, useState, useEffect, useCallback } from "react";
import {
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  createExtraWorkRequest,
} from "../../../../api/timesheet.api";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { calcDateDiff, fmtDate, fmtDuration } from "../utils/dateUtils";
import TaskModal from "./TaskModal";
import ExtraWorkModal from "./ExtraWorkModal";

const MyTasksTab = memo(function MyTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showExtraWork, setShowExtraWork] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try { setTasks(await getMyTasks()); }
    catch { setErr("Failed to load tasks"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (modal === "create") await createTask(form);
    else await updateTask(modal.task_id, form);
    await load();
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try { await deleteTask(taskId); await load(); }
    catch { setErr("Delete failed"); }
  };

  const handleExtraWorkSubmit = async (form) => {
    await createExtraWorkRequest(form);
  };

  if (loading) return <div className="ts-loading">Loading tasks…</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-gray-800">My Tasks</h2>
        <div className="flex gap-2">
          <button type="button" className="ts-btn-extra" onClick={() => setShowExtraWork(true)}>
            ⚡ Extra Work Request
          </button>
          <button type="button" className="ts-btn-primary" onClick={() => setModal("create")}>
            + New Task
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}

      {tasks?.length === 0 ? (
        <div className="ts-empty">No tasks yet. Create your first task to start logging work.</div>
      ) : (
        <div className="space-y-2">
          {tasks?.map((t) => {
            const days = calcDateDiff(t.start_date, t.end_date);
            const perDay = t.duration_hours ? parseFloat(t.duration_hours) : null;
            const totalH = days && perDay ? parseFloat((days * perDay).toFixed(2)) : null;
            return (
              <div key={t.task_id} className="ts-task-row group flex-col !items-start gap-2">
                <div className="flex items-start gap-2.5 w-full">
                  <span className={joinClasses(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0 inline-block",
                    cssClass({ background: t.status === "completed" ? "#16a34a" : t.status === "in_timesheet" ? "#7c3aed" : "#f18200" })
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{t.task_name}</p>
                    <p className="text-xs text-gray-500">{t.project_name}{t.description ? ` · ${t.description}` : ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${
                    t.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    t.status === "in_timesheet" ? "bg-violet-50 text-violet-700 border-violet-200" :
                    "bg-orange-50 text-orange-700 border-orange-200"
                  }`}>{t.status === "in_timesheet" ? "In Timesheet" : t.status}</span>
                  {t.status === "in_timesheet" ? (
                    <span className="text-[10px] text-violet-400 italic shrink-0">locked</span>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button type="button" onClick={() => setModal(t)} className="ts-icon-btn text-brand">✏️</button>
                      <button type="button" onClick={() => handleDelete(t.task_id)} className="ts-icon-btn">🗑️</button>
                    </div>
                  )}
                </div>

                {(t.start_date || t.start_time || days || totalH) && (
                  <div className="flex flex-wrap gap-2 pl-4">
                    {t.start_date && (
                      <span className="ts-chip">
                        📅 {fmtDate(t.start_date)}
                        {t.end_date && t.end_date !== t.start_date ? ` → ${fmtDate(t.end_date)}` : ""}
                      </span>
                    )}
                    {t.start_time && t.end_time && (
                      <span className="ts-chip">🕐 {t.start_time} – {t.end_time}</span>
                    )}
                    {days && (
                      <span className="ts-chip ts-chip--blue">{days} day{days !== 1 ? "s" : ""}</span>
                    )}
                    {perDay && (
                      <span className="ts-chip ts-chip--indigo">{fmtDuration(perDay)} / day</span>
                    )}
                    {totalH && (
                      <span className="ts-chip ts-chip--green">⏱ {fmtDuration(totalH)} total</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal === "create" ? null : modal}
          existingTasks={tasks}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onOpenExtraWork={() => setShowExtraWork(true)}
        />
      )}

      {showExtraWork && (
        <ExtraWorkModal
          timesheetId={null}
          overDays={[new Date().toISOString().slice(0, 10)]}
          onClose={() => setShowExtraWork(false)}
          onSubmit={handleExtraWorkSubmit}
        />
      )}
    </div>
  );
});

export default MyTasksTab;
