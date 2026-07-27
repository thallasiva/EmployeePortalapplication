import { DAYS, PROJECTS } from "../constants/taskConstants";
import { toDateStr } from "./dateUtils";

export function emptyEntry(id, weekDates) {
  const hours = {};
  DAYS.forEach((day, i) => {
    hours[day] = { value: "", date: toDateStr(weekDates[i]) };
  });
  return {
    id,
    project: PROJECTS[0],
    taskName: "",
    activityDesc: "",
    startTime: "",
    endTime: "",
    hours,
  };
}

export function rowTotal(hours) {
  return Object.values(hours).reduce((s, h) => s + (parseFloat(h.value) || 0), 0);
}

export function colTotal(entries, day) {
  return entries.reduce((s, r) => s + (parseFloat(r.hours[day]?.value) || 0), 0);
}

export function taskOverlapsWeek(task, dates) {
  if (!task.start_date || !task.end_date) return false;
  const weekStart = toDateStr(dates[0]);
  const weekEnd = toDateStr(dates[6]);
  return task.start_date <= weekEnd && task.end_date >= weekStart;
}

export function buildTaskRows(tasks, dates, startId = 1) {
  const rows = [];
  let id = startId;
  (tasks || []).filter((t) => taskOverlapsWeek(t, dates)).forEach((t) => {
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
      project: t.project_name || PROJECTS[0],
      taskName: t.task_name || "",
      activityDesc: t.description || "",
      startTime: t.start_time || "",
      endTime: t.end_time || "",
      hours,
      taskId: t.task_id,
    });
  });
  return rows;
}

export function buildTimesheetPayload(entries) {
  const out = [];
  for (const row of entries) {
    for (const [, h] of Object.entries(row.hours)) {
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

export function mergeTaskRows(existingRows, tasks, dates) {
  const keys = new Set(existingRows.map((r) => `${r.project}||${r.taskName}`));
  const newRows = buildTaskRows(tasks, dates, existingRows.length + 1).filter(
    (r) => !keys.has(`${r.project}||${r.taskName}`)
  );
  return [...existingRows, ...newRows];
}
