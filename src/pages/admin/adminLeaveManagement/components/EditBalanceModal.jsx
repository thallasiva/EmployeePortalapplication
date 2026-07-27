import { memo, useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { B } from "../constants/leaveConstants";
import Btn from "./Btn";

const Field = ({ k, label, form, setForm }) => (
  <div>
    <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 5 })}>{label}</label>
    <input
      type="number"
      min={0}
      step={0.5}
      value={form[k]}
      onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
      className={cssClass({ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
        fontSize: 13, outline: "none", fontFamily: "inherit" })}
    />
  </div>
);

const EditBalanceModal = memo(({ emp, bal, year, onClose, onSave }) => {
  const [form, setForm] = useState({
    opening_balance: bal.opening_balance,
    granted: bal.granted,
    availed: bal.availed,
  });
  const [saving, setSaving] = useState(false);
  const balance = Math.max(0, Number(form.opening_balance || 0) + Number(form.granted || 0) - Number(form.availed || 0));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        employeeId: emp.employee_id,
        leaveTypeId: bal.leave_type_id,
        year,
        opening_balance: Number(form.opening_balance) || 0,
        granted: Number(form.granted) || 0,
        availed: Number(form.availed) || 0,
      });
    } catch (e) { alert(e.message); setSaving(false); }
  };

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 24, width: 400, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 })}>Edit Balance</div>
        <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 18 })}>
          {emp.employee_name} ({emp.emp_code}) — {bal.leave_type_name} {year}
        </div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
          <Field k="opening_balance" label="Opening Balance (days)" form={form} setForm={setForm} />
          <Field k="granted"         label="Granted (days)"         form={form} setForm={setForm} />
          <Field k="availed"         label="Availed (days)"         form={form} setForm={setForm} />
        </div>
        <div className={cssClass({ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
          padding: "10px 14px", display: "flex", justifyContent: "space-between",
          alignItems: "center", marginTop: 14 })}>
          <span className={cssClass({ fontSize: 13, color: "#374151" })}>Computed Balance</span>
          <span className={cssClass({ fontSize: 20, fontWeight: 900, color: "#16a34a" })}>{balance.toFixed(1)}</span>
        </div>
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </div>
  );
});

EditBalanceModal.displayName = "EditBalanceModal";
export default EditBalanceModal;
