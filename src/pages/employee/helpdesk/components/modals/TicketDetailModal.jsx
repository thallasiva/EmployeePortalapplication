import { memo, useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { getTicket } from "../../../../../api/helpdesk.api";
import { getStatusStyle, fmtDate, fmtDateTime, getCommentStyle } from "../../utils/helpdeskUtils";
import { cssClass } from "../../../../../utils/classStyles";

/**
 * Full ticket detail modal — loads ticket by ID, shows metadata, description, and comment thread.
 * Single responsibility: fetch + display a single ticket's details.
 */
const TicketDetailModal = memo(function TicketDetailModal({ ticketId, onClose, onAction }) {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTicket(ticketId)
      .then(setTicket)
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const sc = ticket ? getStatusStyle(ticket.status) : {};

  return (
    <div onClick={onClose} className={cssClass({ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass({ width: "100%", maxWidth: 600, maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" })}>

        {/* Header */}
        <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 })}>
          <div className={cssClass({ flex: 1, minWidth: 0 })}>
            {ticket && (
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 })}>
                <span className={cssClass({ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.color })}>{ticket.status}</span>
                {ticket.forwarded_to_team && <span className={cssClass({ fontSize: 11, color: "#7c3aed", fontWeight: 500 })}>→ {ticket.forwarded_to_team}</span>}
                <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>#{ticket.ticket_id}</span>
              </div>
            )}
            <p className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
              {ticket?.subject || "Loading…"}
            </p>
          </div>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer", padding: 4, flexShrink: 0 })}>✕</button>
        </div>

        {/* Body */}
        <div className={cssClass({ flex: 1, overflowY: "auto", padding: "16px 20px" })}>
          {loading ? (
            <p className={cssClass({ textAlign: "center", color: "#9ca3af", padding: 40 })}>Loading…</p>
          ) : !ticket ? (
            <p className={cssClass({ textAlign: "center", color: "#dc2626", padding: 40 })}>Failed to load ticket.</p>
          ) : (
            <>
              {/* Meta grid */}
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 })}>
                {[
                  { label: "Category",    value: ticket.category || "—" },
                  { label: "Priority",    value: ticket.priority  || "—" },
                  { label: "Raised on",   value: fmtDate(ticket.created_at) },
                  { label: "Last update", value: fmtDate(ticket.updated_at || ticket.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} className={cssClass({ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" })}>
                    <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 })}>{label}</p>
                    <p className={cssClass({ fontSize: 13, color: "#1e293b", fontWeight: 600, margin: 0 })}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {ticket.description && (
                <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 })}>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>Your Request</p>
                  <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 })}>{ticket.description}</p>
                </div>
              )}

              {/* Comments */}
              {ticket.comments?.length > 0 ? (
                <div>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" })}>
                    Updates from Support Team ({ticket.comments.length})
                  </p>
                  <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
                    {ticket.comments.map((c, i) => {
                      const cs = getCommentStyle(c.commented_by_name, c.comment);
                      return (
                        <div key={c.comment_id || i} className={cssClass({ background: cs.bg, border: `1px solid ${cs.color}22`, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${cs.color}` })}>
                          <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 })}>
                            <span className={cssClass({ fontSize: 12, fontWeight: 700, color: cs.color })}>{cs.label}</span>
                            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{fmtDateTime(c.created_at)}</span>
                          </div>
                          <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 })}>{c.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={cssClass({ textAlign: "center", padding: "24px 0", color: "#9ca3af" })}>
                  <p className={cssClass({ fontSize: 13, margin: 0 })}>No updates yet — support team will respond soon.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {ticket && (
          <div className={cssClass({ padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#fafafa", display: "flex", gap: 8, justifyContent: "flex-end" })}>
            {ticket.status === "Resolved" && (
              <>
                <button onClick={() => { onAction("close", ticket); onClose(); }} className={cssClass({ padding: "7px 16px", borderRadius: 7, border: "none", background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 })}>
                  <CheckCircle size={14} /> Accept & Close
                </button>
                <button onClick={() => { onAction("reopen", ticket); onClose(); }} className={cssClass({ padding: "7px 16px", borderRadius: 7, border: "1.5px solid #be123c", background: "#fff", color: "#be123c", fontWeight: 700, fontSize: 13, cursor: "pointer" })}>
                  Not Satisfied
                </button>
              </>
            )}
            <button onClick={onClose} className={cssClass({ padding: "7px 16px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" })}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default TicketDetailModal;
