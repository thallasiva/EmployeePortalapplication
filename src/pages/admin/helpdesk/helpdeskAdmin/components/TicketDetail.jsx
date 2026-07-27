import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_COLOR, TEAM_COLOR } from "../constants";
import { fmtDate, fmtTime } from "../utils/dateUtils";
import ManagerDecisionPanel from "./ManagerDecisionPanel";
import AdminWorkPanel from "./AdminWorkPanel";
import CommentsPanel from "./CommentsPanel";

const TicketDetail = React.memo(({ ticket, isAdminUser, onClose, onUpdated }) => {
  const sc = STATUS_COLOR[ticket.status] || STATUS_COLOR["Open"];
  const tc = TEAM_COLOR[ticket.forwarded_to_team] || {};

  return (
    <div onClick={onClose}
      className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" })}>
      <div onClick={(e) => e.stopPropagation()}
        className={cssClass({ width: 520, height: "100vh", background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", overflowY: "auto" })}>

        {/* header */}
        <div className={cssClass({ padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 })}>
            <div className={cssClass({ flex: 1, minWidth: 0 })}>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 })}>
                <span className={cssClass({ fontSize: 11, background: sc.bg, color: sc.color,
                  padding: "3px 10px", borderRadius: 20, fontWeight: 700 })}>{ticket.status}</span>
                {ticket.forwarded_to_team && (
                  <span className={cssClass({ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600,
                    background: tc.bg || "#f3f4f6", color: tc.color || "#374151" })}>
                    → {ticket.forwarded_to_team}
                  </span>
                )}
              </div>
              <h3 className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0, lineHeight: 1.4 })}>
                {ticket.subject}
              </h3>
            </div>
            <button onClick={onClose}
              className={cssClass({ background: "none", border: "none", fontSize: 18,
                color: "#94a3b8", cursor: "pointer", padding: 4, flexShrink: 0 })}>✕</button>
          </div>
        </div>

        {/* metadata grid */}
        <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", flexShrink: 0 })}>
          {[
            { label: "Raised by",     value: ticket.employee_name || "—" },
            { label: "Employee Code", value: ticket.emp_code || "—" },
            { label: "Category",      value: ticket.category || "—" },
            { label: "Raised on",     value: `${fmtDate(ticket.created_at)} ${fmtTime(ticket.created_at)}` },
            { label: "Forwarded to",  value: ticket.forwarded_to_team || "—" },
            { label: "Resolved at",   value: ticket.resolved_at ? fmtDate(ticket.resolved_at) : "—" },
          ].map((m) => (
            <div key={m.label}>
              <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" })}>{m.label}</p>
              <p className={cssClass({ fontSize: 13, color: "#1e293b", margin: 0, fontWeight: 500 })}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* description */}
        {ticket.description && (
          <div className={cssClass({ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 })}>
            <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" })}>Request Details</p>
            <p className={cssClass({ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0,
              whiteSpace: "pre-line" })}>{ticket.description}</p>
          </div>
        )}

        {/* action panels */}
        {!isAdminUser && <ManagerDecisionPanel ticket={ticket} onUpdated={onUpdated} />}
        {isAdminUser  && <AdminWorkPanel       ticket={ticket} onUpdated={onUpdated} />}

        {/* comments */}
        <CommentsPanel ticket={ticket} onUpdated={onUpdated} />
      </div>
    </div>
  );
});

TicketDetail.displayName = "TicketDetail";
export default TicketDetail;
