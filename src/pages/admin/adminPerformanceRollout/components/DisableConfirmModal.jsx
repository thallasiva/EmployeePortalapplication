import React, { useState } from "react";
import { Square } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { disableCycle } from "../../../../api/appraisal.api";
import Modal from "./Modal";

const DisableConfirmModal = React.memo(function DisableConfirmModal({ cycle, onClose, onDisabled }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const confirm = async () => {
    setSaving(true); setErr("");
    try {
      const u = await disableCycle(cycle.cycle_id);
      onDisabled(u);
      onClose();
    } catch (e) { setErr(e?.response?.data?.message || "Failed to disable."); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Stop Rollout?" onClose={onClose} width={440}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
        <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px" })}>
          <div className={cssClass({ fontWeight: 700, color: "#991b1b", marginBottom: 6 })}>⚠ Warning</div>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 })}>Disabling <strong>{cycle.fy_label}</strong> will:</p>
          <ul className={cssClass({ margin: "8px 0 0", paddingLeft: 20, fontSize: 13, color: "#7f1d1d", lineHeight: 1.8 })}>
            <li>Reset all employee submissions back to <strong>Draft</strong></li>
            <li>Mark the cycle as <strong>Inactive</strong></li>
            <li>Hide it from employees and managers</li>
          </ul>
          <p className={cssClass({ margin: "8px 0 0", fontSize: 13, color: "#7f1d1d" })}>Historical data is preserved. You can re-enable or create a new cycle.</p>
        </div>
        {err && <p className={cssClass({ color: "#dc2626", fontSize: 13, margin: 0 })}>{err}</p>}
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
          <button onClick={onClose} className={cssClass({ padding: "9px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer" })}>Cancel</button>
          <button onClick={confirm} disabled={saving}
            className={cssClass({ padding: "9px 22px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 })}>
            <Square size={14} /> {saving ? "Stopping…" : "Stop Rollout"}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default DisableConfirmModal;
