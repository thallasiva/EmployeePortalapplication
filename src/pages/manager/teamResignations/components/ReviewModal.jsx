import React, { useState, useCallback } from "react";
import { LogOut, CheckCircle2, XCircle } from "lucide-react";
import apiClient from "../../../../api/client";
import { fmtDate } from "../utils/formatters";
import { BRAND } from "../constants";
import { cssClass } from "../../../../utils/classStyles";

const ReviewModal = React.memo(function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const submit = useCallback(async (act) => {
    setSaving(true);
    setErr(null);
    try {
      await apiClient.put(`/resignations/manager/${row.resignation_id}/review`, {
        status: act,
        manager_remarks: remarks,
      });
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to submit review");
      setSaving(false);
    }
  }, [row.resignation_id, remarks, onDone]);

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" })}>

        <div className={cssClass({ padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg,#fff7ed,#fff)",
          display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0 })}>
          <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
            display: "flex", alignItems: "center", justifyContent: "center" })}>
            <LogOut size={18} color={BRAND} />
          </div>
          <div>
            <p className={cssClass({ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" })}>Review Resignation</p>
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>{row.employee_name}</p>
          </div>
          <button onClick={onClose} className={cssClass({ marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1 })}>×</button>
        </div>

        <div className={cssClass({ padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 })}>
          {[
            ["Start Date", fmtDate(row.start_date)],
            ["End Date", fmtDate(row.end_date)],
            ["Shortfall", row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None ✓"],
            ["Department", row.department_name || "—"],
            ["Job Title", row.job_title || "—"],
            ["Applied On", fmtDate(row.created_at)],
          ].map(([l, v]) => (
            <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{v}</p>
            </div>
          ))}
        </div>

        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <p className={cssClass({ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: BRAND,
            textTransform: "uppercase", letterSpacing: "0.06em" })}>Reason for Resignation</p>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
        </div>

        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" })}>Alternate Email</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{row.alternate_email || "—"}</p>
          </div>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" })}>Alternate Mobile</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{row.alternate_mobile || "—"}</p>
          </div>
        </div>

        <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>
            Your Comments{" "}
            <span className={cssClass({ color: "#94a3b8", fontWeight: 400 })}>(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add comments visible to the employee and HR…"
            rows={3}
            className={cssClass({ width: "100%", boxSizing: "border-box", padding: "10px 12px",
              border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
              fontFamily: "inherit", resize: "vertical", outline: "none" })}
          />
        </div>

        {err && (
          <div className={cssClass({ padding: "10px 24px", background: "#fef2f2", borderBottom: "1px solid #fecaca" })}>
            <p className={cssClass({ margin: 0, fontSize: 13, color: "#dc2626" })}>{err}</p>
          </div>
        )}

        <div className={cssClass({ padding: "16px 24px", display: "flex", gap: 10 })}>
          <button onClick={() => submit("rm_approved")} disabled={saving} className={cssClass(
            { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "#16a34a", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, opacity: saving ? 0.7 : 1 })}>
            <CheckCircle2 size={16} /> {saving ? "Saving…" : "Approve"}
          </button>
          <button onClick={() => submit("rm_rejected")} disabled={saving} className={cssClass(
            { flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              background: "#dc2626", color: "#fff", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, opacity: saving ? 0.7 : 1 })}>
            <XCircle size={16} /> {saving ? "Saving…" : "Reject"}
          </button>
          <button onClick={onClose} disabled={saving} className={cssClass(
            { padding: "11px 18px", borderRadius: 9, fontWeight: 600, fontSize: 14,
              border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default ReviewModal;
