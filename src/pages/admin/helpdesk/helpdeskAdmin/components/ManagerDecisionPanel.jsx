import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, TEAMS, STATUS_COLOR } from "../constants";
import { managerAction } from "../../../../../api/helpdesk.api";

const ManagerDecisionPanel = React.memo(({ ticket, onUpdated }) => {
  const sc = STATUS_COLOR[ticket.status] || STATUS_COLOR["Open"];
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const alreadyActioned = ticket.status !== "Open";

  const doApprove = async () => {
    // Ask which team to forward to
    const teamList = TEAMS.join("\n");
    const team = window.prompt(`Forward to which team?\n\n${teamList}\n\nType the team name exactly:`, TEAMS[0]);
    if (!team) return; // cancelled
    if (!TEAMS.includes(team.trim())) {
      window.alert("Invalid team name. Please choose from the list.");
      return;
    }
    setLoading(true); setError(null);
    try {
      await managerAction(ticket.ticket_id, "approve", team.trim(), "");
      onUpdated();
    } catch (e) {
      setError(e?.response?.data?.message || "Action failed.");
    } finally { setLoading(false); }
  };

  const doReject = async () => {
    const reason = window.prompt("Reason for rejection (required):");
    if (reason === null) return; // cancelled
    if (!reason.trim()) { window.alert("A reason is required to reject."); return; }
    setLoading(true); setError(null);
    try {
      await managerAction(ticket.ticket_id, "reject", null, reason.trim());
      onUpdated();
    } catch (e) {
      setError(e?.response?.data?.message || "Action failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className={cssClass({ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
      <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" })}>
        Manager Decision
      </p>

      {alreadyActioned ? (
        <div className={cssClass({ padding: "10px 14px", borderRadius: 8, background: sc.bg,
          border: `1px solid ${sc.color}33`, fontSize: 13, color: sc.color, fontWeight: 600 })}>
          {ticket.status === "Forwarded" ? `✓ Forwarded to ${ticket.forwarded_to_team}` :
            ticket.status === "Rejected"  ? "✕ Request rejected" : `Status: ${ticket.status}`}
        </div>
      ) : (
        <>
          {error && (
            <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
              padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 10 })}>
              {error}
            </div>
          )}
          <div className={cssClass({ display: "flex", gap: 8 })}>
            <button
              onClick={doApprove}
              disabled={loading}
              className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "9px 0", borderRadius: 8, border: "none",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700 })}>
              <ThumbsUp size={15} /> Approve & Forward
            </button>
            <button
              onClick={doReject}
              disabled={loading}
              className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "9px 0", borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                background: "#fff", border: "1.5px solid #b91c1c", color: "#b91c1c", fontSize: 13, fontWeight: 700 })}>
              <ThumbsDown size={15} /> Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
});

ManagerDecisionPanel.displayName = "ManagerDecisionPanel";
export default ManagerDecisionPanel;
