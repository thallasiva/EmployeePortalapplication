import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, BRAND_LIGHT, TEAMS, STATUS_COLOR, TEAM_COLOR } from "../constants";
import { managerAction } from "../../../../../api/helpdesk.api";

const ManagerDecisionPanel = React.memo(({ ticket, onUpdated }) => {
  const sc = STATUS_COLOR[ticket.status] || STATUS_COLOR["Open"];
  const [step,      setStep]      = useState("idle");
  const [team,      setTeam]      = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [actLoading, setActLoading] = useState(false);
  const [actError,   setActError]   = useState(null);

  const alreadyActioned = ticket.status !== "Open";

  const doManagerAction = async (action) => {
    if (action === "approve" && !team)              { setActError("Select a team to forward to."); return; }
    if (action === "reject" && !rejectMsg.trim())   { setActError("Reason is required."); return; }
    setActLoading(true); setActError(null);
    try {
      await managerAction(ticket.ticket_id, action, team || null, rejectMsg.trim() || null);
      onUpdated();
    } catch (e) {
      setActError(e?.response?.data?.message || "Action failed.");
    } finally { setActLoading(false); }
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
            ticket.status === "Rejected" ? "✕ Request rejected" : `Status: ${ticket.status}`}
        </div>
      ) : (
        <>
          {actError && (
            <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
              padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 10 })}>
              {actError}
            </div>
          )}

          {step === "idle" && (
            <div className={cssClass({ display: "flex", gap: 8 })}>
              <button onClick={() => { setStep("pick-team"); setActError(null); }}
                className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700 })}>
                <ThumbsUp size={15} /> Approve & Forward
              </button>
              <button onClick={() => { setStep("reject"); setActError(null); }}
                className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                  background: "#fff", border: "1.5px solid #b91c1c", color: "#b91c1c", fontSize: 13, fontWeight: 700 })}>
                <ThumbsDown size={15} /> Reject
              </button>
            </div>
          )}

          {step === "pick-team" && (
            <div>
              <p className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 8px" })}>
                Forward to which team?
              </p>
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 })}>
                {TEAMS.map((t) => {
                  const tc2 = TEAM_COLOR[t] || {};
                  return (
                    <button key={t} onClick={() => setTeam(t)}
                      className={cssClass({ padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", textAlign: "left",
                        border: team === t ? `2px solid ${tc2.color || BRAND}` : "1.5px solid #e2e8f0",
                        background: team === t ? tc2.bg || BRAND_LIGHT : "#fff",
                        color: team === t ? tc2.color || BRAND : "#374151" })}>
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className={cssClass({ marginBottom: 8 })}>
                <label className={cssClass({ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 })}>
                  Note to team (optional)
                </label>
                <textarea value={rejectMsg === "" ? "" : rejectMsg} onChange={(e) => setRejectMsg(e.target.value)}
                  placeholder="Any instructions for the team…" rows={2}
                  onFocus={(e) => e.target.style.borderColor = BRAND}
                  onBlur={(e) => e.target.style.borderColor = "#dbe2ea"}
                  className={cssClass({ width: "100%", padding: "7px 10px", border: "1px solid #dbe2ea",
                    borderRadius: 6, fontSize: 12, outline: "none", resize: "none",
                    fontFamily: "inherit", boxSizing: "border-box" })} />
              </div>
              <div className={cssClass({ display: "flex", gap: 8 })}>
                <button onClick={() => doManagerAction("approve")} disabled={actLoading || !team}
                  className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "9px 0", borderRadius: 8, border: "none",
                    cursor: actLoading || !team ? "not-allowed" : "pointer",
                    background: "#15803d", color: "#fff", fontSize: 13, fontWeight: 700,
                    opacity: actLoading || !team ? 0.6 : 1 })}>
                  <ArrowRight size={14} /> Forward to {team || "Team"}
                </button>
                <button onClick={() => { setStep("idle"); setTeam(""); setRejectMsg(""); setActError(null); }}
                  className={cssClass({ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer" })}>
                  Back
                </button>
              </div>
            </div>
          )}

          {step === "reject" && (
            <div>
              <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151",
                display: "block", marginBottom: 6 })}>
                Reason for rejection <span className={cssClass({ color: "#ef4444" })}>*</span>
              </label>
              <textarea value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)}
                placeholder="Explain why this request is being rejected…" rows={3}
                onFocus={(e) => e.target.style.borderColor = "#b91c1c"}
                onBlur={(e) => e.target.style.borderColor = "#dbe2ea"}
                className={cssClass({ width: "100%", padding: "8px 10px", border: "1px solid #dbe2ea",
                  borderRadius: 6, fontSize: 12, outline: "none", resize: "none",
                  fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" })} />
              <div className={cssClass({ display: "flex", gap: 8 })}>
                <button onClick={() => doManagerAction("reject")} disabled={actLoading || !rejectMsg.trim()}
                  className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "9px 0", borderRadius: 8, border: "none",
                    cursor: actLoading || !rejectMsg.trim() ? "not-allowed" : "pointer",
                    background: "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 700,
                    opacity: actLoading || !rejectMsg.trim() ? 0.6 : 1 })}>
                  <ThumbsDown size={14} /> Confirm Reject
                </button>
                <button onClick={() => { setStep("idle"); setRejectMsg(""); setActError(null); }}
                  className={cssClass({ padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer" })}>
                  Back
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

ManagerDecisionPanel.displayName = "ManagerDecisionPanel";
export default ManagerDecisionPanel;
