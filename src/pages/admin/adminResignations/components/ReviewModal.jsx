import React, { useState } from "react";
import { LogOut, CheckCircle2, XCircle, Paperclip, MessageSquare } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import apiClient from "../../../../api/client";
import { BRAND, fmtDate, fmtDT } from "../constants";

const ReviewModal = React.memo(function ReviewModal({ row, onClose, onDone }) {
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (act) => {
    setSaving(true);
    try {
      await apiClient.put(`/resignations/admin/${row.resignation_id}/review`, {
        status: act,
        admin_remarks: remarks,
      });
      onDone();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit review");
    }
    setSaving(false);
  };

  const mgr = row.manager_reviewed_by_name;
  const isFinal = ["accepted", "rejected"].includes(row.status);

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" })}>

        {/* Header */}
        <div className={cssClass({ padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg,#fff7ed,#fff)",
          display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0 })}>
          <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: `${BRAND}15`,
            display: "flex", alignItems: "center", justifyContent: "center" })}>
            <LogOut size={18} color={BRAND} />
          </div>
          <div>
            <p className={cssClass({ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" })}>Final Review</p>
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>{row.employee_name}</p>
          </div>
          <button onClick={onClose} className={cssClass({ marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "#94a3b8", fontSize: 22, lineHeight: 1 })}>×</button>
        </div>

        {/* Summary grid */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, background: "#fafafa" })}>
          {[
            ["Employee",  row.employee_name],
            ["Department", row.department_name || "—"],
            ["Job Title", row.job_title || "—"],
            ["Start Date", fmtDate(row.start_date)],
            ["End Date",  fmtDate(row.end_date)],
            ["Shortfall", row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None ✓"],
          ].map(([l, v]) => (
            <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8",
                fontWeight: 700, textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{v}</p>
            </div>
          ))}
        </div>

        {/* Reason */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9" })}>
          <p className={cssClass({ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: BRAND,
            textTransform: "uppercase", letterSpacing: "0.06em" })}>Reason</p>
          <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
        </div>

        {/* Manager review */}
        {mgr && (
          <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
            background: row.status === "rm_approved" ? "#f0fdf4" : "#fef2f2" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 })}>
              <MessageSquare size={13} color={row.status === "rm_approved" ? "#16a34a" : "#dc2626"} />
              <p className={cssClass({ margin: 0, fontSize: 10, fontWeight: 700,
                color: row.status === "rm_approved" ? "#16a34a" : "#dc2626",
                textTransform: "uppercase", letterSpacing: "0.06em" })}>
                Manager Review — {row.status === "rm_approved" ? "Approved" : "Rejected"}
              </p>
            </div>
            <p className={cssClass({ margin: "0 0 4px", fontSize: 13, fontWeight: 600,
              color: row.status === "rm_approved" ? "#15803d" : "#991b1b" })}>
              {row.manager_remarks || "No remarks added"}
            </p>
            <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>
              by {mgr} on {fmtDT(row.manager_reviewed_at)}
            </p>
          </div>
        )}

        {/* Contact info */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8",
              fontWeight: 700, textTransform: "uppercase" })}>Alternate Email</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>
              {row.alternate_email || "—"}
            </p>
          </div>
          <div>
            <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8",
              fontWeight: 700, textTransform: "uppercase" })}>Alternate Mobile</p>
            <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>
              {row.alternate_mobile || "—"}
            </p>
          </div>
        </div>

        {/* Attachment */}
        {row.attachment_path && (
          <div className={cssClass({ padding: "10px 24px", borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 8 })}>
            <Paperclip size={14} color={BRAND} />
            <a href={`${apiClient.defaults.baseURL}/resignations/admin/${row.resignation_id}/attachment`}
              target="_blank" rel="noreferrer"
              className={cssClass({ fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
              {row.attachment_name || "Download Attachment"}
            </a>
          </div>
        )}

        {/* Action area — pending review */}
        {!isFinal && (
          <>
            <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" })}>
              <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>
                HR Remarks <span className={cssClass({ color: "#94a3b8", fontWeight: 400 })}>(optional)</span>
              </label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add final HR remarks for the employee…" rows={3}
                className={cssClass({ width: "100%", boxSizing: "border-box", padding: "10px 12px",
                  border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13,
                  fontFamily: "inherit", resize: "vertical", outline: "none" })} />
            </div>
            <div className={cssClass({ padding: "16px 24px", display: "flex", gap: 10 })}>
              <button onClick={() => submit("accepted")} disabled={saving}
                className={cssClass({ flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
                  border: "none", cursor: saving ? "not-allowed" : "pointer",
                  background: "#16a34a", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
                <CheckCircle2 size={16} /> Final Accept
              </button>
              <button onClick={() => submit("rejected")} disabled={saving}
                className={cssClass({ flex: 1, padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14,
                  border: "none", cursor: saving ? "not-allowed" : "pointer",
                  background: "#dc2626", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 })}>
                <XCircle size={16} /> Reject
              </button>
              <button onClick={onClose} disabled={saving}
                className={cssClass({ padding: "11px 18px", borderRadius: 9, fontWeight: 600, fontSize: 14,
                  border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Action area — already reviewed */}
        {isFinal && (
          <div className={cssClass({ padding: "16px 24px" })}>
            {row.admin_remarks && (
              <div className={cssClass({ marginBottom: 12, padding: "12px 14px",
                background: row.status === "accepted" ? "#f0fdf4" : "#fef2f2", borderRadius: 8 })}>
                <p className={cssClass({ margin: "0 0 3px", fontSize: 10, fontWeight: 700,
                  color: row.status === "accepted" ? "#16a34a" : "#dc2626", textTransform: "uppercase" })}>
                  HR Remarks
                </p>
                <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151" })}>{row.admin_remarks}</p>
              </div>
            )}
            <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center" })}>
              Reviewed on {fmtDT(row.reviewed_at)}
            </p>
            <button onClick={onClose}
              className={cssClass({ marginTop: 12, width: "100%", padding: "10px", borderRadius: 8,
                border: "1px solid #e2e8f0", background: "#fff", color: "#64748b",
                fontWeight: 600, cursor: "pointer" })}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReviewModal;
