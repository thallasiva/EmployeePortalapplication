import React, { useCallback, useEffect, useState } from "react";
import { CalendarClock, Trash2 } from "lucide-react";
import {
  createWeeklyInterviewAvailability,
  createInterviewAvailability,
  deleteInterviewAvailability,
  deleteWeeklyInterviewAvailability,
  listInterviewAvailability,
} from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast } from "../../../../../utils/ToastControllers";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function localDateToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function InterviewerAvailabilityPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    interviewerName: "", availabilityType: "one_off", availableFrom: "", availableTo: "",
    weekday: "1", effectiveFrom: localDateToday(), effectiveTo: ""
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listInterviewAvailability());
    } catch (error) {
      apiErrorToast(error, "Failed to load interviewer availability");
    }
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (form.availabilityType === "weekly") {
        await createWeeklyInterviewAvailability({
          ...form,
          weekday: Number(form.weekday),
          effectiveTo: form.effectiveTo || null
        });
      } else {
        await createInterviewAvailability(form);
      }
      setForm((current) => ({ ...current, availableFrom: "", availableTo: "" }));
      successToast(form.availabilityType === "weekly" ? "Weekly availability saved" : "Interviewer availability saved");
      await load();
    } catch (error) {
      apiErrorToast(error, "Failed to save interviewer availability");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    try {
      if (row.availability_kind === "weekly") await deleteWeeklyInterviewAvailability(row.availability_id);
      else await deleteInterviewAvailability(row.availability_id);
      await load();
    } catch (error) {
      apiErrorToast(error, "Failed to remove availability");
    }
  }

  return (
    <section className="mb-4">
      <button type="button" onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
        <CalendarClock size={15} /> {open ? "Hide interviewer availability" : "Manage interviewer availability"}
      </button>
      {open && <div className="mt-3 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={submit} className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800">Add availability window</h3>
          <input required maxLength={200} value={form.interviewerName} onChange={(event) => setForm((current) => ({ ...current, interviewerName: event.target.value }))}
            placeholder="Interviewer name (must match schedule)" aria-label="Interviewer name"
            className="h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
          <label className="block text-xs text-gray-600">Availability type
            <select value={form.availabilityType} onChange={(event) => setForm((current) => ({ ...current, availabilityType: event.target.value }))}
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs">
              <option value="one_off">One-time window</option>
              <option value="weekly">Recurring weekly</option>
            </select>
          </label>
          {form.availabilityType === "weekly" ? <>
            <label className="block text-xs text-gray-600">Day of week
              <select value={form.weekday} onChange={(event) => setForm((current) => ({ ...current, weekday: event.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs">
                {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-gray-600">Available from
                <input required type="time" value={form.availableFrom} onChange={(event) => setForm((current) => ({ ...current, availableFrom: event.target.value }))}
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
              </label>
              <label className="block text-xs text-gray-600">Available to
                <input required type="time" value={form.availableTo} onChange={(event) => setForm((current) => ({ ...current, availableTo: event.target.value }))}
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-gray-600">Effective from
                <input required type="date" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))}
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
              </label>
              <label className="block text-xs text-gray-600">Effective until (optional)
                <input type="date" min={form.effectiveFrom} value={form.effectiveTo} onChange={(event) => setForm((current) => ({ ...current, effectiveTo: event.target.value }))}
                  className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
              </label>
            </div>
          </> : <>
            <label className="block text-xs text-gray-600">Available from
              <input required type="datetime-local" value={form.availableFrom} onChange={(event) => setForm((current) => ({ ...current, availableFrom: event.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
            </label>
            <label className="block text-xs text-gray-600">Available to
              <input required type="datetime-local" value={form.availableTo} onChange={(event) => setForm((current) => ({ ...current, availableTo: event.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs" />
            </label>
          </>}
          <button type="submit" disabled={saving} className="rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save availability"}
          </button>
          <p className="text-[11px] text-gray-500">On dates covered by availability rules, interviews must fit within a saved window.</p>
        </form>
        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-800">Saved windows</h3>
          {rows.length === 0 ? <p className="text-xs text-gray-400">No availability windows saved.</p> : <ul className="max-h-64 space-y-2 overflow-auto">
            {rows.map((row) => <li key={`${row.availability_kind}-${row.availability_id}`} className="flex items-start justify-between gap-2 rounded-md bg-gray-50 p-2 text-xs">
              <span><strong>{row.interviewer_name}</strong><br />
                {row.availability_kind === "weekly"
                  ? `Weekly ${WEEKDAYS[Number(row.weekday)]}, ${String(row.available_from).slice(0, 5)}–${String(row.available_to).slice(0, 5)} · from ${String(row.effective_from).slice(0, 10)}${row.effective_to ? ` until ${String(row.effective_to).slice(0, 10)}` : ""}`
                  : `${String(row.available_from).slice(0, 16)} – ${String(row.available_to).slice(0, 16)}`}
              </span>
              <button type="button" onClick={() => remove(row)} aria-label={`Remove availability for ${row.interviewer_name}`}
                title="Remove availability" className="rounded p-1 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
            </li>)}
          </ul>}
        </div>
      </div>}
    </section>
  );
}

export default InterviewerAvailabilityPanel;
