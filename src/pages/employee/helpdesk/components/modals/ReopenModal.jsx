import { memo, useState } from "react";
import { reopenTicket } from "../../../../../api/helpdesk.api";
import { cssClass } from "../../../../../utils/classStyles";

/**
 * Reopen-ticket modal.
 * Single responsibility: collect reason + call reopenTicket API.
 */
const ReopenModal = memo(function ReopenModal({ ticket, onClose, onReopened }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleReopen = async () => {
    setLoading(true); setError(null);
    try {
      await reopenTicket(ticket.ticket_id, reason.trim() || null);
      onReopened();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to reopen. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} className={cssClass({ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass({ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" })}>

        {/* Header */}
        <div className={cssClass({ padding: "18px 22px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" })}>
          <div>
            <p className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 })}>Reopen this ticket?</p>
            <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "3px 0 0" })}>Tell us what's still not resolved.</p>
          </div>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", color: "#9ca3af", fontSize: 18, cursor: "pointer", padding: 4 })}>✕</button>
        </div>

        {/* Body */}
        <div className={cssClass({ padding: "18px 22px" })}>
          <div className={cssClass({ padding: "10px 14px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, marginBottom: 14 })}>
            <p className={cssClass({ fontSize: 13, color: "#92400e", margin: 0, fontWeight: 500 })}>📋 {ticket.subject}</p>
          </div>
          {error && (
            <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 12 })}>
              {error}
            </div>
          )}
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
            Reason for reopening <span className={cssClass({ color: "#9ca3af", fontWeight: 400 })}>(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The issue came back after 2 hours, VPN still disconnects…"
            rows={4}
            onFocus={(e) => (e.target.style.borderColor = "#be123c")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            className={cssClass({ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" })}
          />
        </div>

        {/* Footer */}
        <div className={cssClass({ padding: "12px 22px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" })}>
          <button onClick={onClose} className={cssClass({ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" })}>
            Cancel
          </button>
          <button onClick={handleReopen} disabled={loading} className={cssClass({ padding: "8px 20px", borderRadius: 6, border: "none", background: "#be123c", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 })}>
            {loading ? "Reopening…" : "Reopen Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ReopenModal;
