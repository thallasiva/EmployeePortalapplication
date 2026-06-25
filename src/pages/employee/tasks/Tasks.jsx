import React, { useState, useEffect, useCallback } from "react";
import {
  getMyTasks, createTask, updateTask, deleteTask,
  getMyTimesheets, saveTimesheetEntries, submitTimesheet,
  getTimesheetDetail, getEmployeeDashboardCounts,
  createExtraWorkRequest, getMyExtraWork,
} from "../../../api/timesheet.api";
import "./tasks.css";

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROJECTS = [
  "HRMS Development", "Client Portal", "Internal Tools", "QA & Testing", "Documentation",
];
const MAX_DAILY_HOURS = 8;

const STATUS_STYLE = {
  draft:    "bg-gray-100 text-gray-600 border border-gray-300",
  pending:  "bg-amber-50 text-amber-700 border border-amber-300",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-300",
  rejected: "bg-red-50 text-red-600 border border-red-300",
};
const STATUS_LABEL = { draft: "Draft", pending: "Pending", approved: "Approved", rejected: "Rejected" };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + 1 + offsetWeeks * 7);
  const dates = DAYS.map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
  return {
    weekStart: mon.toISOString().slice(0, 10),
    weekEnd: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6).toISOString().slice(0, 10),
    dates,
  };
}

function fmt(date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function toDateStr(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

function emptyEntry(id, weekDates) {
  const hours = {};
  DAYS.forEach((day, i) => { hours[day] = { value: "", date: toDateStr(weekDates[i]) }; });
  return { id, project: PROJECTS[0], taskName: "", activityDesc: "", startTime: "", endTime: "", hours };
}

function rowTotal(hours) {
  return Object.values(hours).reduce((s, h) => s + (parseFloat(h.value) || 0), 0);
}

function colTotal(entries, day) {
  return entries.reduce((s, r) => s + (parseFloat(r.hours[day]?.value) || 0), 0);
}

// ─── Extra Work Modal ─────────────────────────────────────────────────────────
function ExtraWorkModal({ timesheetId, overDays = [], onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ work_date: overDays[0] || today, task_name: "", extra_hours: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handle = async () => {
    if (!form.task_name || !form.extra_hours || !form.reason) { setErr("All fields required"); return; }
    setSaving(true);
    try { await onSubmit({ ...form, timesheet_id: timesheetId }); onClose(); }
    catch (e) { setErr(e?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Extra Work Request</h2>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <label className="block text-xs font-semibold text-gray-600">Work Date
          {overDays.length > 1 ? (
            <select className="ts-input mt-1 w-full" value={form.work_date}
              onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))}>
              {overDays.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <input type="date" className="ts-input mt-1 w-full" value={form.work_date}
              onChange={e => setForm(f => ({ ...f, work_date: e.target.value }))} />
          )}
        </label>
        <label className="block text-xs font-semibold text-gray-600">Task Name
          <input className="ts-input mt-1 w-full" value={form.task_name}
            onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} placeholder="Describe the task" />
        </label>
        <label className="block text-xs font-semibold text-gray-600">Extra Hours
          <input type="number" min="0.5" max="8" step="0.5" className="ts-input mt-1 w-full"
            value={form.extra_hours} onChange={e => setForm(f => ({ ...f, extra_hours: e.target.value }))} />
        </label>
        <label className="block text-xs font-semibold text-gray-600">Reason for Additional Work
          <textarea rows={3} className="ts-input mt-1 w-full resize-none" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why was extra work required?" />
        </label>
        <div className="flex gap-2 justify-end pt-4">
          <button type="button" onClick={onClose} className="ts-btn-ghost">Cancel</button>
          <button type="button" onClick={handle} disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 24px", borderRadius: 8,
              background: saving ? "#fbd38d" : "#f18200",
              color: "#fff", fontSize: 14, fontWeight: 700,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}>
            {saving ? "Submitting…" : "⚡ Submit Extra Hours"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Duration calculation helpers ────────────────────────────────────────────

/**
 * Given two "HH:MM" strings, return decimal hours difference (null if invalid).
 * Handles overnight (end < start) by assuming next day.
 */
function calcTimeDiff(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  return parseFloat((diff / 60).toFixed(2));
}

/** Days between two YYYY-MM-DD strings (inclusive). Null if invalid. */
function calcDateDiff(start, end) {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e)) return null;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : null;
}

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Format decimal hours as 02h:30min. 60 min exactly → 01hr, 0 → —  */
function fmtDuration(hours) {
  if (hours == null || hours === "" || isNaN(Number(hours))) return "—";
  const totalMins = Math.round(Number(hours) * 60);
  if (totalMins === 0) return "—";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return m === 0 ? `${hh}hr` : `${hh}h:${mm}min`;
}

// ─── Task Create/Edit Modal ───────────────────────────────────────────────────
function TaskModal({ task, existingTasks = [], onClose, onSave, onOpenExtraWork }) {
  const [form, setForm] = useState({
    task_name:    task?.task_name    || "",
    project_name: task?.project_name || PROJECTS[0],
    description:  task?.description  || "",
    start_date:   task?.start_date   || "",
    end_date:     task?.end_date     || "",
    start_time:   task?.start_time   || "",
    end_time:     task?.end_time     || "",
    duration_hours: task?.duration_hours != null ? String(task.duration_hours) : "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const set = (key, val) => setForm(f => {
    const next = { ...f, [key]: val };
    if (key === "start_time" || key === "end_time") {
      const st = key === "start_time" ? val : f.start_time;
      const et = key === "end_time"   ? val : f.end_time;
      const diff = calcTimeDiff(st, et);
      if (diff !== null) next.duration_hours = String(diff);
    }
    return next;
  });

  // Build a map of date → total hours already committed by OTHER tasks
  const existingDailyHours = React.useMemo(() => {
    const map = {};
    (existingTasks || []).forEach(t => {
      if (task?.task_id && t.task_id === task.task_id) return; // exclude self when editing
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

  // For current form date range, find the worst-case existing hours on any overlapping day
  const maxExistingOnRange = React.useMemo(() => {
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

  // Derived display values
  const durationDays         = calcDateDiff(form.start_date, form.end_date);
  const durationHours        = parseFloat(form.duration_hours) || null;
  const isOverHours          = durationHours !== null && durationHours > MAX_DAILY_HOURS;

  // Total hours check: existing + this task would exceed 8h on some day
  const projectedTotal       = maxExistingOnRange + (durationHours || 0);
  const exceedsWithExisting  = !isOverHours && durationHours !== null && projectedTotal > MAX_DAILY_HOURS && maxExistingOnRange > 0;
  const extraHoursNeeded     = exceedsWithExisting ? parseFloat((projectedTotal - MAX_DAILY_HOURS).toFixed(2)) : 0;

  const totalHoursAcrossDays =
    durationDays && durationHours ? parseFloat((durationDays * durationHours).toFixed(2)) : null;

  const isBlocked = isOverHours || exceedsWithExisting;

  const handle = async () => {
    if (!form.task_name.trim()) { setErr("Task name is required"); return; }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setErr("End date must be on or after Start date"); return;
    }
    if (isBlocked) return; // safety guard
    setSaving(true);
    try {
      await onSave({
        ...form,
        duration_hours: form.duration_hours !== "" ? parseFloat(form.duration_hours) : null,
      });
      onClose();
    } catch (e) { setErr(e?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{task ? "Edit Task" : "Create Task"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

          {/* Task name */}
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Task Name <span className="text-red-500">*</span>
            <input className="ts-input mt-1.5 w-full text-sm" value={form.task_name}
              placeholder="e.g. Build login module"
              onChange={e => set("task_name", e.target.value)} />
          </label>

          {/* Project */}
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Project
            <select className="ts-input mt-1.5 w-full text-sm" value={form.project_name}
              onChange={e => set("project_name", e.target.value)}>
              {PROJECTS.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>

          {/* Description */}
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Description
            <textarea rows={2} className="ts-input mt-1.5 w-full text-sm resize-none"
              value={form.description} placeholder="Optional details…"
              onChange={e => set("description", e.target.value)} />
          </label>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Date
              <input type="date" className="ts-input mt-1.5 w-full text-sm"
                value={form.start_date}
                onChange={e => set("start_date", e.target.value)} />
            </label>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Date
              <input type="date" className="ts-input mt-1.5 w-full text-sm"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={e => set("end_date", e.target.value)} />
            </label>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Start Time
              <input type="time" className="ts-input mt-1.5 w-full text-sm"
                value={form.start_time}
                onChange={e => set("start_time", e.target.value)} />
            </label>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
              End Time
              <input type="time" className="ts-input mt-1.5 w-full text-sm"
                value={form.end_time}
                onChange={e => set("end_time", e.target.value)} />
            </label>
          </div>

          {/* Duration hours (editable, auto-filled by time diff) */}
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Duration (hours / day)
            <div className="flex items-center gap-2 mt-1.5">
              <input type="number" min="0" max="24" step="0.5"
                className={`ts-input w-32 text-sm text-center ${isBlocked ? "border-red-400 bg-red-50 text-red-700" : ""}`}
                placeholder="0"
                value={form.duration_hours}
                onChange={e => set("duration_hours", e.target.value)} />
              {form.start_time && form.end_time && durationHours !== null && (
                <span className="text-xs text-gray-400">← auto-calculated from times</span>
              )}
            </div>
          </label>

          {/* ── Exceeded 8h because this single task is > 8h ── */}
          {isOverHours && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-600 mb-1">⚠️ Exceeds 8hr daily limit</p>
              <p className="text-xs text-red-500 mb-3">
                Regular tasks are capped at <strong>08hr / day</strong>. Set this to 8hr and raise an
                <strong> Extra Work Request</strong> for the remaining hours.
              </p>
              <button type="button"
                onClick={() => { onClose(); onOpenExtraWork?.(); }}
                className="text-xs font-semibold text-white bg-brand rounded-lg px-3 py-1.5 hover:bg-orange-600">
                Close &amp; Raise Extra Work Request
              </button>
            </div>
          )}

          {/* ── Exceeded 8h because existing tasks + this task > 8h ── */}
          {exceedsWithExisting && (
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
                Reduce this task to <strong>{fmtDuration(MAX_DAILY_HOURS - maxExistingOnRange)}</strong> or raise an
                <strong> Extra Work Request</strong> for the extra <strong>{fmtDuration(extraHoursNeeded)}</strong>.
              </p>
              <button type="button"
                onClick={() => { onClose(); onOpenExtraWork?.(); }}
                className="text-xs font-semibold text-white bg-brand rounded-lg px-3 py-1.5 hover:bg-orange-600">
                ⚡ Raise Extra Work Request ({fmtDuration(extraHoursNeeded)} extra)
              </button>
            </div>
          )}

          {/* Computed summary card */}
          {(durationDays || durationHours) && !isBlocked && (
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
              {form.start_date && form.end_date && (
                <p className="text-[11px] text-gray-500 text-center pt-1">
                  {fmtDate(form.start_date)} → {fmtDate(form.end_date)}
                  {form.start_time && form.end_time && (
                    <span className="ml-2">· {form.start_time} – {form.end_time}</span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
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
}

// ─── Task ↔ Timesheet helpers ────────────────────────────────────────────────

/** Returns true if task's date range overlaps with the given week dates array */
function taskOverlapsWeek(task, dates) {
  if (!task.start_date || !task.end_date) return false;
  const weekStart = toDateStr(dates[0]);
  const weekEnd   = toDateStr(dates[6]);
  return task.start_date <= weekEnd && task.end_date >= weekStart;
}

/** Build timesheet rows from tasks that overlap the current week */
function buildTaskRows(tasks, dates, startId = 1) {
  const rows = [];
  let id = startId;
  (tasks || []).filter(t => taskOverlapsWeek(t, dates)).forEach(t => {
    const hours = {};
    DAYS.forEach((day, idx) => {
      const dateStr = toDateStr(dates[idx]);
      const inRange = dateStr >= t.start_date && dateStr <= t.end_date;
      hours[day] = {
        value: inRange && t.duration_hours ? String(parseFloat(t.duration_hours)) : "",
        date: dateStr,
      };
    });
    rows.push({
      id: id++,
      project:     t.project_name || PROJECTS[0],
      taskName:    t.task_name    || "",
      activityDesc: t.description || "",
      startTime:   t.start_time   || "",
      endTime:     t.end_time     || "",
      hours,
      taskId: t.task_id, // tracks originating task
    });
  });
  return rows;
}

/** Merge task rows into existing saved rows (skip tasks already present) */
function mergeTaskRows(existingRows, tasks, dates) {
  const keys = new Set(existingRows.map(r => `${r.project}||${r.taskName}`));
  const newRows = buildTaskRows(tasks, dates, existingRows.length + 1)
    .filter(r => !keys.has(`${r.project}||${r.taskName}`));
  return [...existingRows, ...newRows];
}

// ─── My Tasks Tab ─────────────────────────────────────────────────────────────
function MyTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);   // null | "create" | task object
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

  // Quick extra work submit (no timesheet required — timesheet_id is optional)
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
          <button type="button" className="ts-btn-primary" onClick={() => setModal("create")}>+ New Task</button>
        </div>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}

      {tasks?.length === 0 ? (
        <div className="ts-empty">No tasks yet. Create your first task to start logging work.</div>
      ) : (
        <div className="space-y-2">
          {tasks?.map(t => {
            const days = calcDateDiff(t.start_date, t.end_date);
            const perDay = t.duration_hours ? parseFloat(t.duration_hours) : null;
            const totalH = days && perDay ? parseFloat((days * perDay).toFixed(2)) : null;
            return (
              <div key={t.task_id} className="ts-task-row group flex-col !items-start gap-2">
                {/* Top row */}
                <div className="flex items-start gap-2.5 w-full">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 inline-block"
                    style={{ background: t.status === "completed" ? "#16a34a" : "#f18200" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{t.task_name}</p>
                    <p className="text-xs text-gray-500">{t.project_name}{t.description ? ` · ${t.description}` : ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${
                    t.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}>{t.status}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button type="button" onClick={() => setModal(t)} className="ts-icon-btn text-brand">✏️</button>
                    <button type="button" onClick={() => handleDelete(t.task_id)} className="ts-icon-btn">🗑️</button>
                  </div>
                </div>

                {/* Date / time / duration chips */}
                {(t.start_date || t.start_time || days || totalH) && (
                  <div className="flex flex-wrap gap-2 pl-4">
                    {t.start_date && (
                      <span className="ts-chip">
                        📅 {fmtDate(t.start_date)}
                        {t.end_date && t.end_date !== t.start_date ? ` → ${fmtDate(t.end_date)}` : ""}
                      </span>
                    )}
                    {t.start_time && t.end_time && (
                      <span className="ts-chip">
                        🕐 {t.start_time} – {t.end_time}
                      </span>
                    )}
                    {days && (
                      <span className="ts-chip ts-chip--blue">
                        {days} day{days !== 1 ? "s" : ""}
                      </span>
                    )}
                    {perDay && (
                      <span className="ts-chip ts-chip--indigo">
                        {fmtDuration(perDay)} / day
                      </span>
                    )}
                    {totalH && (
                      <span className="ts-chip ts-chip--green">
                        ⏱ {fmtDuration(totalH)} total
                      </span>
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
}

// ─── Timesheet Tab ────────────────────────────────────────────────────────────
function TimesheetTab() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState([]);
  const [nextId, setNextId] = useState(2);
  const [timesheet, setTimesheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [showExtraWork, setShowExtraWork] = useState(false);
  const [myExtraWork, setMyExtraWork] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [editTask, setEditTask] = useState(null);

  const { weekStart, dates } = getWeekBounds(weekOffset);

  const loadWeek = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [all, myTasks] = await Promise.all([getMyTimesheets(), getMyTasks()]);
      setAllTasks(myTasks || []);
      const match = all.find(t => t.week_start === weekStart);
      setTimesheet(match || null);
      if (match?.timesheet_id) {
        const detail = await getTimesheetDetail(match.timesheet_id);
        if (detail.entries?.length > 0) {
          // Group flat entries (one per work_date) into rows per project+task
          const rowMap = {};
          detail.entries.forEach(e => {
            const key = `${e.project_name}||${e.task_name}`;
            if (!rowMap[key]) {
              const hours = {};
              DAYS.forEach((day, i) => { hours[day] = { value: "", date: toDateStr(dates[i]) }; });
              // Try to find matching task to restore taskId link
              const linkedTask = (myTasks || []).find(
                t => t.project_name === e.project_name && t.task_name === e.task_name
              );
              rowMap[key] = {
                id: Object.keys(rowMap).length + 1,
                project: e.project_name,
                taskName: e.task_name,
                activityDesc: e.activity_desc || "",
                startTime: e.start_time || "",
                endTime: e.end_time || "",
                hours,
                taskId: linkedTask?.task_id || null,
              };
            }
            const dayIdx = dates.findIndex(d => toDateStr(d) === e.work_date);
            if (dayIdx >= 0) rowMap[key].hours[DAYS[dayIdx]].value = String(e.duration_hours);
          });
          const rebuilt = Object.values(rowMap);
          // Append any tasks that aren't already saved
          const merged = mergeTaskRows(rebuilt, myTasks, dates);
          setEntries(merged);
          setNextId(merged.length + 1);
        } else {
          // Timesheet exists but no entries yet — seed with tasks
          const taskRows = buildTaskRows(myTasks, dates, 1);
          const initial = taskRows.length > 0 ? taskRows : [emptyEntry(1, dates)];
          setEntries(initial);
          setNextId(initial.length + 1);
        }
      } else {
        // No timesheet for this week yet — seed with tasks
        const taskRows = buildTaskRows(myTasks, dates, 1);
        const initial = taskRows.length > 0 ? taskRows : [emptyEntry(1, dates)];
        setEntries(initial);
        setNextId(initial.length + 1);
      }
    } catch { setErr("Failed to load timesheet"); }
    finally { setLoading(false); }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadWeek(); }, [loadWeek]);

  useEffect(() => {
    getMyExtraWork().then(setMyExtraWork).catch(() => {});
  }, []);

  const isLocked = timesheet?.status === "approved";
  const canEdit = !timesheet || ["draft", "rejected"].includes(timesheet?.status);

  const updateEntry = (id, field, val) =>
    setEntries(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));

  const updateHours = (id, day, val) =>
    setEntries(prev => prev.map(r =>
      r.id === id ? { ...r, hours: { ...r.hours, [day]: { ...r.hours[day], value: val } } } : r
    ));

  const addRow = () => { setEntries(prev => [...prev, emptyEntry(nextId, dates)]); setNextId(n => n + 1); };
  const removeRow = (id) => setEntries(prev => prev.filter(r => r.id !== id));

  const grandTotal = entries.reduce((s, r) => s + rowTotal(r.hours), 0);

  const overDays = DAYS
    .map((day, i) => ({ day, date: toDateStr(dates[i]), total: colTotal(entries, day) }))
    .filter(d => d.total > MAX_DAILY_HOURS)
    .map(d => d.date);
  const hasOvertime = overDays.length > 0;

  function buildPayload() {
    const out = [];
    for (const row of entries) {
      for (const [day, h] of Object.entries(row.hours)) {
        if (!h.value) continue;
        out.push({
          project_name: row.project,
          task_name: row.taskName,
          activity_desc: row.activityDesc,
          work_date: h.date,
          start_time: row.startTime || null,
          end_time: row.endTime || null,
          duration_hours: parseFloat(h.value) || 0,
        });
      }
    }
    return out;
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const saved = await saveTimesheetEntries({ weekDate: weekStart, entries: buildPayload() });
      setTimesheet(saved);
      showToast("Draft saved!");
    } catch (e) { setErr(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (hasOvertime) { setErr("Daily hours exceed 8h. Use 'Extra Work Request' for overtime days."); return; }
    setSaving(true); setErr("");
    try {
      const saved = await saveTimesheetEntries({ weekDate: weekStart, entries: buildPayload() });
      setTimesheet(saved);
      setSubmitting(true);
      const sub = await submitTimesheet(saved.timesheet_id);
      setTimesheet(sub);
      showToast("Timesheet submitted for approval!");
    } catch (e) { setErr(e?.response?.data?.message || "Submit failed"); }
    finally { setSaving(false); setSubmitting(false); }
  };

  const handleExtraWorkSubmit = async (form) => {
    await createExtraWorkRequest({ ...form, timesheet_id: timesheet?.timesheet_id });
    setMyExtraWork(await getMyExtraWork());
  };

  const handleUpdateTask = async (form) => {
    if (!editTask) return;
    await updateTask(editTask.task_id, form);
    // Reflect changes in the timesheet row immediately
    setEntries(prev => prev.map(r =>
      r.taskId === editTask.task_id
        ? {
            ...r,
            project:     form.project_name || r.project,
            taskName:    form.task_name    || r.taskName,
            activityDesc: form.description || r.activityDesc,
            startTime:   form.start_time   || r.startTime,
            endTime:     form.end_time     || r.endTime,
          }
        : r
    ));
    const refreshed = await getMyTasks();
    setAllTasks(refreshed);
  };

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
        <button type="button" onClick={() => setWeekOffset(w => w - 1)} className="ts-btn-ghost text-sm">← Prev</button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{fmt(dates[0])} – {fmt(dates[6])}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            timesheet ? STATUS_STYLE[timesheet.status] : "text-gray-400"
          }`}>
            {timesheet ? STATUS_LABEL[timesheet.status] : "No entry"}
          </span>
        </div>
        <button type="button" onClick={() => setWeekOffset(w => w + 1)} className="ts-btn-ghost text-sm">Next →</button>
      </div>

      {timesheet?.status === "rejected" && timesheet.comments && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <strong>Rejection reason:</strong> {timesheet.comments}
        </div>
      )}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">✓ {toast}</div>
      )}
      {err && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{err}</div>}
      {isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          🔒 This timesheet has been <strong>approved</strong> and is locked from editing.
        </div>
      )}

      {loading ? <div className="ts-loading">Loading…</div> : (
        <>
          {/* Table */}
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
                {entries.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <select disabled={isLocked} className="ts-input w-full text-xs"
                        value={row.project} onChange={e => updateEntry(row.id, "project", e.target.value)}>
                        {PROJECTS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <input disabled={isLocked} className="ts-input flex-1 text-xs"
                          placeholder="Task name" value={row.taskName}
                          onChange={e => updateEntry(row.id, "taskName", e.target.value)} />
                        {row.taskId && (
                          <button type="button"
                            title="Edit task details"
                            onClick={() => setEditTask(allTasks.find(t => t.task_id === row.taskId) || null)}
                            className="shrink-0 text-brand hover:text-orange-600 text-sm px-1">✏️</button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <input disabled={isLocked} className="ts-input flex-1 text-xs"
                          placeholder="Activity" value={row.activityDesc}
                          onChange={e => updateEntry(row.id, "activityDesc", e.target.value)} />
                        {row.taskId && (
                          <span className="shrink-0 text-[9px] font-semibold text-brand bg-orange-50 border border-orange-200 rounded px-1">Task</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" disabled={isLocked} className="ts-input w-full text-xs"
                        value={row.startTime} onChange={e => updateEntry(row.id, "startTime", e.target.value)} />
                      <input type="time" disabled={isLocked} className="ts-input w-full text-xs mt-1"
                        value={row.endTime} onChange={e => updateEntry(row.id, "endTime", e.target.value)} />
                    </td>
                    {DAYS.map(day => {
                      const val = row.hours[day]?.value || "";
                      const cellOver = colTotal(entries, day) > MAX_DAILY_HOURS && parseFloat(val) > 0;
                      return (
                        <td key={day} className="px-1 py-2 text-center">
                          <input type="number" min="0" max="24" step="0.5"
                            disabled={isLocked}
                            className={`ts-hour-input ${cellOver ? "border-red-400 bg-red-50 text-red-700" : ""}`}
                            placeholder="0" value={val}
                            onChange={e => updateHours(row.id, day, e.target.value)} />
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center font-semibold text-brand text-sm">{fmtDuration(rowTotal(row.hours))}</td>
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
                  {DAYS.map(day => {
                    const total = colTotal(entries, day);
                    const over = total > MAX_DAILY_HOURS;
                    return (
                      <td key={day} className={`px-1 py-2 text-center ${over ? "text-red-600 font-bold" : "text-gray-700"}`}>
                        {total > 0 ? fmtDuration(total) : "—"}
                        {over && <div className="text-[9px] text-red-500">OVER 8h</div>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center text-brand font-bold">{fmtDuration(grandTotal)}</td>
                  {canEdit && <td />}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center justify-between">
              <button type="button" onClick={addRow} className="text-sm font-medium text-brand hover:underline">+ Add Row</button>
              <div className="flex gap-2">
                <button type="button" onClick={handleSave} disabled={saving} className="ts-btn-ghost text-sm">
                  {saving ? "Saving…" : "Save Draft"}
                </button>
                {hasOvertime ? (
                  <button type="button" onClick={() => setShowExtraWork(true)} className="ts-btn-warning text-sm">
                    ⚡ Extra Work Request
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting || saving} className="ts-btn-primary text-sm">
                    {submitting ? "Submitting…" : "Submit for Approval"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Extra work history */}
          {myExtraWork.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Extra Work Requests</h3>
              <div className="space-y-2">
                {myExtraWork.map(ew => (
                  <div key={ew.extra_work_id} className="flex items-start gap-3 text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 capitalize ${STATUS_STYLE[ew.status] || ""}`}>
                      {ew.status}
                    </span>
                    <div>
                      <span className="font-medium">{ew.task_name}</span>
                      <span className="text-gray-400 ml-2">{fmtDuration(ew.extra_hours)} · {ew.work_date}</span>
                      <p className="text-xs text-gray-500">{ew.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        <TaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={handleUpdateTask}
        />
      )}
    </div>
  );
}

// ─── Dashboard Counts ─────────────────────────────────────────────────────────
function DashboardCounts() {
  const [counts, setCounts] = useState(null);
  useEffect(() => { getEmployeeDashboardCounts().then(setCounts).catch(() => {}); }, []);
  if (!counts) return null;
  const items = [
    { label: "Draft Tasks", value: counts.draftTasks, color: "text-gray-600" },
    { label: "Submitted Weeks", value: counts.submittedWeeks, color: "text-brand" },
    { label: "Pending Approval", value: counts.pendingApproval, color: "text-amber-600" },
    { label: "Approved Weeks", value: counts.approvedWeeks, color: "text-emerald-600" },
    { label: "Rejected Weeks", value: counts.rejectedWeeks, color: "text-red-600" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm py-3 px-4 text-center">
          <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tasks() {
  const [activeTab, setActiveTab] = useState("tasks");
  return (
    <div className="tasks-page">
      <DashboardCounts />
      <div className="flex gap-2 mb-5">
        {[{ key: "tasks", label: "My Tasks" }, { key: "timesheet", label: "Timesheet" }].map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              activeTab === tab.key
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"
            }`}>{tab.label}</button>
        ))}
      </div>
      {activeTab === "tasks" && <MyTasksTab />}
      {activeTab === "timesheet" && <TimesheetTab />}
    </div>
  );
}
