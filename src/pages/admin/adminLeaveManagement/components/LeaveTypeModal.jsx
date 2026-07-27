import { memo, useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { B } from "../constants/leaveConstants";
import Btn from "./Btn";

const FormField = ({ k, label, type = "text", form, set, ...rest }) => (
  <div>
    <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>{label}</label>
    <input
      type={type}
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      {...rest}
      className={cssClass({ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })}
    />
  </div>
);

const LeaveTypeModal = memo(({ initial, onClose, onSave }) => {
  const [form, setForm]   = useState({ ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leave_type_name.trim()) { alert("Leave type name is required"); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e) { alert(e.message); setSaving(false); }
  };

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 26, width: 440, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 })}>
          {form.leave_type_id ? "Edit Leave Type" : "New Leave Type"}
        </div>
        <form onSubmit={handleSubmit} className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          <FormField k="leave_type_name" label="Name *"                              form={form} set={set} />
          <FormField k="short_code"      label="Short Code (e.g. EL, SL, CL)"        form={form} set={set} />
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
            <FormField k="annual_quota"        label="Annual Quota (days)"          type="number" min={0} form={form} set={set} />
            <FormField k="carry_forward_limit" label="Carry Forward Limit (days)"   type="number" min={0} form={form} set={set} />
          </div>
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>Description</label>
            <textarea
              rows={2}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              className={cssClass({ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" })}
            />
          </div>
          <label className={cssClass({ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" })}>
            <input
              type="checkbox"
              checked={!!form.requires_proof}
              onChange={(e) => set("requires_proof", e.target.checked)}
              className={cssClass({ accentColor: B, width: 14, height: 14 })}
            />
            Proof Required
          </label>
          <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 })}>
            <Btn type="button" variant="cancel" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
});

LeaveTypeModal.displayName = "LeaveTypeModal";
export default LeaveTypeModal;
