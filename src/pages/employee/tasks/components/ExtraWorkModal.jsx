import { memo, useState } from "react";
import { cssClass } from "../../../../utils/classStyles";

const ExtraWorkModal = memo(function ExtraWorkModal({ timesheetId, overDays = [], onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    work_date: overDays[0] || today,
    task_name: "",
    extra_hours: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handle = async () => {
    if (!form.task_name || !form.extra_hours || !form.reason) {
      setErr("All fields required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, timesheet_id: timesheetId });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Extra Work Request</h2>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <label className="block text-xs font-semibold text-gray-600">Work Date
          {overDays.length > 1 ? (
            <select className="ts-input mt-1 w-full" value={form.work_date}
              onChange={(e) => setForm((f) => ({ ...f, work_date: e.target.value }))}>
              {overDays.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <input type="date" className="ts-input mt-1 w-full" value={form.work_date}
              onChange={(e) => setForm((f) => ({ ...f, work_date: e.target.value }))} />
          )}
        </label>
        <label className="block text-xs font-semibold text-gray-600">Task Name
          <input className="ts-input mt-1 w-full" value={form.task_name}
            onChange={(e) => setForm((f) => ({ ...f, task_name: e.target.value }))}
            placeholder="Describe the task" />
        </label>
        <label className="block text-xs font-semibold text-gray-600">Extra Hours
          <input type="number" min="0.5" max="8" step="0.5" className="ts-input mt-1 w-full"
            value={form.extra_hours}
            onChange={(e) => setForm((f) => ({ ...f, extra_hours: e.target.value }))} />
        </label>
        <label className="block text-xs font-semibold text-gray-600">Reason for Additional Work
          <textarea rows={3} className="ts-input mt-1 w-full resize-none" value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Why was extra work required?" />
        </label>
        <div className="flex gap-2 justify-end pt-4">
          <button type="button" onClick={onClose} className="ts-btn-ghost">Cancel</button>
          <button type="button" onClick={handle} disabled={saving}
            className={cssClass({
              display: "inline-flex", alignItems: "items-center", gap: 6,
              padding: "10px 24px", borderRadius: 8,
              background: saving ? "#fbd38d" : "#f18200",
              color: "#fff", fontSize: 14, fontWeight: 700,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            })}>
            {saving ? "Submitting…" : "⚡ Submit Extra Hours"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ExtraWorkModal;
