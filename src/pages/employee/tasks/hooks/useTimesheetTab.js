import { useState, useEffect, useCallback } from "react";
import {
  getMyTasks,
  getMyTimesheets,
  saveTimesheetEntries,
  submitTimesheet,
  getTimesheetDetail,
  createExtraWorkRequest,
  getMyExtraWork,
  updateTask,
} from "../../../../api/timesheet.api";
import { DAYS, MAX_DAILY_HOURS } from "../constants/taskConstants";
import { getWeekBounds, toDateStr } from "../utils/dateUtils";
import { emptyEntry, colTotal, buildTaskRows, mergeTaskRows, buildTimesheetPayload } from "../utils/timesheetUtils";

export function useTimesheetTab(jumpTo = null) {
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!jumpTo?.week_start) return;
    const now = new Date();
    const day = now.getDay() || 7;
    const curMonday = new Date(now);
    curMonday.setDate(now.getDate() - day + 1);
    const target = new Date(jumpTo.week_start);
    const diffMs = target.getTime() - curMonday.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
  }, [jumpTo]);

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
      const match = all.find((t) => t.week_start === weekStart);
      setTimesheet(match || null);
      if (match?.timesheet_id) {
        const detail = await getTimesheetDetail(match.timesheet_id);
        if (detail.entries?.length > 0) {
          const rowMap = {};
          detail.entries.forEach((e) => {
            const key = `${e.project_name}||${e.task_name}`;
            if (!rowMap[key]) {
              const hours = {};
              DAYS.forEach((day, i) => { hours[day] = { value: "", date: toDateStr(dates[i]) }; });
              const linkedTask = (myTasks || []).find(
                (t) => t.project_name === e.project_name && t.task_name === e.task_name
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
            const dayIdx = dates.findIndex((d) => toDateStr(d) === e.work_date);
            if (dayIdx >= 0) rowMap[key].hours[DAYS[dayIdx]].value = String(e.duration_hours);
          });
          const rebuilt = Object.values(rowMap);
          const merged = mergeTaskRows(rebuilt, myTasks, dates);
          setEntries(merged);
          setNextId(merged.length + 1);
        } else {
          const taskRows = buildTaskRows(myTasks, dates, 1);
          const initial = taskRows.length > 0 ? taskRows : [emptyEntry(1, dates)];
          setEntries(initial);
          setNextId(initial.length + 1);
        }
      } else {
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
    setEntries((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));

  const updateHours = (id, day, val) =>
    setEntries((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, hours: { ...r.hours, [day]: { ...r.hours[day], value: val } } } : r
      )
    );

  const addRow = () => {
    setEntries((prev) => [...prev, emptyEntry(nextId, dates)]);
    setNextId((n) => n + 1);
  };
  const removeRow = (id) => setEntries((prev) => prev.filter((r) => r.id !== id));

  const overDays = DAYS
    .map((day, i) => ({ day, date: toDateStr(dates[i]), total: colTotal(entries, day) }))
    .filter((d) => d.total > MAX_DAILY_HOURS)
    .map((d) => d.date);
  const hasOvertime = overDays.length > 0;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const saved = await saveTimesheetEntries({ weekDate: weekStart, entries: buildTimesheetPayload(entries) });
      setTimesheet(saved);
      showToast("Draft saved!");
    } catch (e) { setErr(e?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (hasOvertime) { setErr("Daily hours exceed 8h. Use 'Extra Work Request' for overtime days."); return; }
    setSaving(true); setErr("");
    try {
      const saved = await saveTimesheetEntries({ weekDate: weekStart, entries: buildTimesheetPayload(entries) });
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
    setEntries((prev) =>
      prev.map((r) =>
        r.taskId === editTask.task_id
          ? {
              ...r,
              project: form.project_name || r.project,
              taskName: form.task_name || r.taskName,
              activityDesc: form.description || r.activityDesc,
              startTime: form.start_time || r.startTime,
              endTime: form.end_time || r.endTime,
            }
          : r
      )
    );
    const refreshed = await getMyTasks();
    setAllTasks(refreshed);
  };

  return {
    weekOffset, setWeekOffset,
    dates, weekStart,
    entries,
    timesheet,
    loading, saving, submitting,
    err, toast,
    showExtraWork, setShowExtraWork,
    myExtraWork,
    allTasks,
    editTask, setEditTask,
    isLocked, canEdit,
    overDays, hasOvertime,
    updateEntry, updateHours, addRow, removeRow,
    handleSave, handleSubmit, handleExtraWorkSubmit, handleUpdateTask,
  };
}
