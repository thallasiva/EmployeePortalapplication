import React, { useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { updateCycleSettings } from "../../../../api/appraisal.api";
import { BRAND } from "../constants";
import Modal from "./Modal";
import CycleTypePicker from "./CycleTypePicker";

const EditSettingsModal = React.memo(function EditSettingsModal({ cycle, onClose, onSaved }) {
  const [form, setForm] = useState({
    fy_label: cycle.fy_label || "",
    deadline: cycle.deadline ? cycle.deadline.slice(0, 10) : "",
    cycle_type: cycle.cycle_type || "yearly"
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!form.fy_label.trim()) { setErr("Name required."); return; }
    setSaving(true); setErr("");
    try {
      const u = await updateCycleSettings(cycle.cycle_id, form);
      onSaved(u);
      onClose();
    } catch (e) { setErr(e?.response?.data?.message || "Save failed."); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Edit Cycle Settings" onClose={onClose}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 14 })}>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Cycle Name</label>
          <input value={form.fy_label} onChange={(e) => setForm((p) => ({ ...p, fy_label: e.target.value }))}
            className={cssClass({ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 })}>Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
            className={cssClass({ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" })} />
        </div>
        <div>
          <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 10 })}>Appraisal Frequency</label>
          <CycleTypePicker value={form.cycle_type} onChange={(v) => setForm((p) => ({ ...p, cycle_type: v }))} />
        </div>
        {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: 0 })}>{err}</p>}
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 })}>
          <button onClick={onClose} className={cssClass({ padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" })}>Cancel</button>
          <button onClick={submit} disabled={saving}
            className={cssClass({ padding: "9px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 })}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default EditSettingsModal;
