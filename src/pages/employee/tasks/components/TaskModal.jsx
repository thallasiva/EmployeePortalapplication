import { memo, useState, useMemo } from "react";
import { PROJECTS, MAX_DAILY_HOURS } from "../constants/taskConstants";
import { calcTimeDiff, calcDateDiff } from "../utils/dateUtils";
import TaskOverHoursPanel from "./TaskOverHoursPanel";
import TaskDurationSummary from "./TaskDurationSummary";

const TaskModal = memo(function TaskModal({ task, existingTasks = [], onClose, onSave, onOpenExtraWork }) {
  const [form, setForm] = useState({
    task_name: task?.task_name || "",
    project_name: task?.project_name || PROJECTS[0],
    description: task?.description || "",
    start_date: task?.start_date || "",
    end_date: task?.end_date || "",
    start_time: task?.start_time || "",
    end_time: task?.end_time || "",
    duration_hours: task?.duration_hours != null ? String(task.duration_hours) : "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (key, val) =>
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === "start_time" || key === "end_time") {
        const st = key === "start_time" ? val : f.start_time;
        const et = key === "end_time" ? val : f.end_time;
        const diff = calcTimeDiff(st, et);
        if (diff !== null) next.duration_hours = String(diff);
      }
      return next;
    });

  const existingDailyHours = useMemo(() => {
    const map = {};
    (existingTasks || []).forEach((t) => {
      if (task?.task_id && t.task_id === task.task_id) return;
      if (!t.start_date || !t.end_date || !t.duration_hours) return;
      const s = new Date(t.start_date);
      const e = new Date(t.end_date);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        map[key] = (map[key] || 0) + parseFloat(t.duration_hours || 0);
      }
    });
    return map;
  }, [existingTasks, task]);

  const maxExistingOnRange = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0;
    let max = 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      max = Math.max(max, existingDailyHours[key] || 0);
    }
    return max;
  }, [form.start_date, form.end_date, existingDailyHours]);

  const durationDays = calcDateDiff(form.start_date, form.end_date);
  const durationHours = parseFloat(form.duration_hours) || null;
  const isOverHours = durationHours !== null && durationHours > MAX_DAILY_HOURS;
  const projectedTotal = maxExistingOnRange + (durationHours || 0);
  const exceedsWithExisting =
    !isOverHours && durationHours !== null && projectedTotal > MAX_DAILY_HOURS && maxExistingOnRange > 0;
  const extraHoursNeeded = exceedsWithExisting
    ? parseFloat((projectedTotal - MAX_DAILY_HOURS).toFixed(2))
    : 0;
  const totalHoursAcrossDays =
    durationDays && durationHours ? parseFloat((durationDays * durationHours).toFixed(2)) : null;
  const isBlocked = isOverHours || exceedsWithExisting;

  const handle = async () => {
    if (!form.task_name.trim()) { setErr("Task name is required"); return; }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setErr("End date must be on or after Start date");
      return;
    }
    if (isBlocked) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        duration_hours: form.duration_hours !== "" ? parseFloat(form.duration_hours) : null,
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{task ? "Edit Task" : "Create Task"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Task Name <span className="text-red-500">*</span>
            <input className="ts-input mt-1.5 w-full text-sm" value={form.task_name}
              placeholder="e.g. Build login module"
              onChange={(e) => set("task_name", e.target.value)} />
          </label>

          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Project
            <select className="ts-input mt-1.5 w-full text-sm" value={form.project_name}
              onChange={(e) => set("project_name", e.target.value)}>
              {PROJECTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>

          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Description
            <textarea rows={2} className="ts-input mt-1.5 w-full text-sm resize-none"
              value={form.description} placeholder="Optional details…"
              onChange={(e) => set("description", e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Date
              <input type="date" className="ts-input mt-1.5 w-full text-sm"
                value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </label>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Date
              <input type="date" className="ts-input mt-1.5 w-full text-sm"
                min={form.start_date || undefined}
                value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Time
              <input type="time" className="ts-input mt-1.5 w-full text-sm"
                value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
            </label>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Time
              <input type="time" className="ts-input mt-1.5 w-full text-sm"
                value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
            </label>
          </div>

          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Duration (hours / day)
            <div className="flex items-center gap-2 mt-1.5">
              <input type="number" min="0" max="24" step="0.5"
                className={`ts-input w-32 text-sm text-center ${isBlocked ? "border-red-400 bg-red-50 text-red-700" : ""}`}
                placeholder="0"
                value={form.duration_hours}
                onChange={(e) => set("duration_hours", e.target.value)} />
              {form.start_time && form.end_time && durationHours !== null && (
                <span className="text-xs text-gray-400">← auto-calculated from times</span>
              )}
            </div>
          </label>

          <TaskOverHoursPanel
            isOverHours={isOverHours}
            exceedsWithExisting={exceedsWithExisting}
            maxExistingOnRange={maxExistingOnRange}
            durationHours={durationHours}
            projectedTotal={projectedTotal}
            extraHoursNeeded={extraHoursNeeded}
            onClose={onClose}
            onOpenExtraWork={onOpenExtraWork}
          />

          <TaskDurationSummary
            durationDays={durationDays}
            durationHours={durationHours}
            totalHoursAcrossDays={totalHoursAcrossDays}
            isBlocked={isBlocked}
            startDate={form.start_date}
            endDate={form.end_date}
            startTime={form.start_time}
            endTime={form.end_time}
          />
        </div>

        <div className="flex gap-2 justify-end px-6 pb-5">
          <button type="button" onClick={onClose} className="ts-btn-ghost">Cancel</button>
          <button type="button" onClick={handle} disabled={saving || isBlocked}
            title={isBlocked ? "Fix the hour limit error above before saving" : undefined}
            className={`ts-btn-primary ${isBlocked ? "opacity-40 cursor-not-allowed" : ""}`}>
            {saving ? "Saving…" : task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default TaskModal;
