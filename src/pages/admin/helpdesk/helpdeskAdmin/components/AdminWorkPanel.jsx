import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_COLOR } from "../constants";
import { updateTicketStatus } from "../../../../../api/helpdesk.api";

const AdminWorkPanel = React.memo(({ ticket, onUpdated }) => {
  const sc = STATUS_COLOR[ticket.status] || STATUS_COLOR["Open"];
  const [saving, setSaving] = useState(false);

  const doStatusUpdate = async (status) => {
    setSaving(true);
    try { await updateTicketStatus(ticket.ticket_id, status); onUpdated(); }
    catch { } finally { setSaving(false); }
  };

  return (
    <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
      <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" })}>
        Work on Request
      </p>

      {ticket.status === "Forwarded" && (
        <div className={cssClass({ marginBottom: 12, padding: "10px 14px", background: "#f5f3ff",
          border: "1px solid #ddd6fe", borderRadius: 8, fontSize: 13, color: "#7c3aed" })}>
          📨 Forwarded to <strong>{ticket.forwarded_to_team}</strong> — take ownership and start working
        </div>
      )}
      {ticket.status === "Reopened" && (
        <div className={cssClass({ marginBottom: 12, padding: "10px 14px", background: "#fff1f2",
          border: "1px solid #fecdd3", borderRadius: 8, fontSize: 13, color: "#be123c" })}>
          ↩ Employee was <strong>not satisfied</strong> with the resolution — please re-examine the issue
        </div>
      )}

      {["Forwarded", "In Progress", "Reopened"].includes(ticket.status) && (
        <div className={cssClass({ display: "flex", gap: 8, flexWrap: "wrap" })}>
          {["Forwarded", "Reopened"].includes(ticket.status) && (
            <button onClick={() => doStatusUpdate("In Progress")} disabled={saving}
              className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
                borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: "#c2410c", color: "#fff", fontSize: 13, fontWeight: 700,
                opacity: saving ? 0.7 : 1 })}>
              Start Working (In Progress)
            </button>
          )}
          {ticket.status === "In Progress" && (
            <button onClick={() => doStatusUpdate("Resolved")} disabled={saving}
              className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
                borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700,
                opacity: saving ? 0.7 : 1 })}>
              <CheckCircle size={15} /> Mark as Resolved
            </button>
          )}
        </div>
      )}

      {["Resolved", "Closed", "Rejected"].includes(ticket.status) && (
        <div className={cssClass({ padding: "10px 14px", borderRadius: 8, background: sc.bg,
          border: `1px solid ${sc.color}33`, fontSize: 13, color: sc.color, fontWeight: 600 })}>
          {ticket.status === "Resolved" ? "✓ Issue resolved — awaiting employee confirmation" :
            ticket.status === "Closed"  ? "✓ Ticket closed by employee" :
            "✕ Rejected by manager"}
        </div>
      )}
    </div>
  );
});

AdminWorkPanel.displayName = "AdminWorkPanel";
export default AdminWorkPanel;
