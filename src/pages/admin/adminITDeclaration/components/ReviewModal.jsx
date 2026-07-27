import React, { useState } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const ReviewModal = React.memo(function ReviewModal({ title, onSubmit, onClose }) {
  const [status, setStatus] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (status === "rejected" && !remarks.trim()) return;
    setSaving(true);
    try { await onSubmit(status, remarks); onClose(); }
    catch (e) { alert(e?.response?.data?.message || "Error"); }
    setSaving(false);
  };

  return (
    <div className={cssClass({ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)" })}>
        <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" })}>
          <p className={cssClass({ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" })}>{title}</p>
        </div>
        <div className={cssClass({ padding: "16px 20px" })}>
          <div className={cssClass({ display: "flex", gap: 10, marginBottom: 14 })}>
            {[
              ["approved", "✓ Approve", "#22c55e", "#f0fdf4", "#15803d"],
              ["rejected", "✕ Reject",  "#ef4444", "#fef2f2", "#dc2626"],
            ].map(([s, lbl, border, bg, color]) => (
              <button key={s} onClick={() => setStatus(s)}
                className={cssClass({ flex: 1, padding: 9, borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${status === s ? border : "#e2e8f0"}`,
                  background: status === s ? bg : "#fff",
                  color: status === s ? color : "#64748b" })}>
                {lbl}
              </button>
            ))}
          </div>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
            placeholder={status === "rejected" ? "Reason for rejection (required)…" : "Comments (optional)…"}
            className={cssClass({ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
              borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" })} />
        </div>
        <div className={cssClass({ display: "flex", gap: 10, padding: "14px 20px", borderTop: "1px solid #f0f0f0" })}>
          <button onClick={submit} disabled={saving}
            className={cssClass({ flex: 1, padding: 10, borderRadius: 8, fontWeight: 600, fontSize: 13,
              border: "none", cursor: "pointer", background: BRAND, color: "#fff" })}>
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button onClick={onClose}
            className={cssClass({ padding: "10px 18px", borderRadius: 8, fontSize: 13,
              border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default ReviewModal;
