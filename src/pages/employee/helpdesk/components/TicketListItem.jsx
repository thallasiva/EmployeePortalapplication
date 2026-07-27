import { memo } from "react";
import { CheckCircle } from "lucide-react";
import { getStatusStyle, fmtDate } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";

/**
 * A single row in the My Tickets list.
 * Single responsibility: render one ticket + emit onClick / onClose / onReopen actions.
 */
const TicketListItem = memo(function TicketListItem({ ticket, index, total, isClosing, onClick, onClose, onReopen }) {
  const sc         = getStatusStyle(ticket.status);
  const isResolved = ticket.status === "Resolved";
  const isReopened = ticket.status === "Reopened";

  return (
    <li
      onClick={onClick}
      onMouseEnter={(e) => { if (!isResolved && !isReopened) e.currentTarget.style.background = "#f9fafb"; }}
      onMouseLeave={(e) => { if (!isResolved && !isReopened) e.currentTarget.style.background = isResolved ? "#f0fdf4" : isReopened ? "#fff1f2" : "transparent"; }}
      className={cssClass({
        padding: "14px 18px",
        cursor: "pointer",
        borderBottom: index < total - 1 ? "1px solid #f3f4f6" : "none",
        background: isResolved ? "#f0fdf4" : isReopened ? "#fff1f2" : "transparent",
        borderLeft: isResolved ? "3px solid #15803d" : isReopened ? "3px solid #be123c" : "3px solid transparent",
      })}
    >
      <div className={cssClass({ display: "flex", alignItems: "flex-start", gap: 12 })}>
        {/* Left: subject + meta */}
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 })}>
            <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{ticket.subject}</span>
            {ticket.category && (
              <span className={cssClass({ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "1px 8px", borderRadius: 20 })}>
                {ticket.category}
              </span>
            )}
          </div>
          {ticket.description && (
            <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
              {ticket.description}
            </p>
          )}
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" })}>
            <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{fmtDate(ticket.created_at)}</span>
            {ticket.forwarded_to_team && (
              <span className={cssClass({ fontSize: 11, color: "#7c3aed", fontWeight: 500 })}>→ {ticket.forwarded_to_team}</span>
            )}
            {isResolved && (
              <span className={cssClass({ fontSize: 12, color: "#15803d", fontWeight: 600 })}>✓ Issue resolved — click to view details and confirm</span>
            )}
            {isReopened && (
              <span className={cssClass({ fontSize: 12, color: "#be123c", fontWeight: 600 })}>↩ Reopened — team is working on it again</span>
            )}
          </div>
        </div>

        {/* Right: status badge + actions */}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" })}>
          <span className={cssClass({ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color })}>
            {ticket.status}
          </span>

          {isResolved && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(ticket.ticket_id); }}
                disabled={isClosing}
                className={cssClass({
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 6, border: "none",
                  background: "#15803d", color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: isClosing ? "not-allowed" : "pointer", opacity: isClosing ? 0.7 : 1,
                })}
              >
                <CheckCircle size={13} />
                {isClosing ? "Closing…" : "Accept & Close"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReopen(ticket); }}
                className={cssClass({
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 6,
                  border: "1.5px solid #be123c", background: "#fff",
                  color: "#be123c", fontSize: 12, fontWeight: 700, cursor: "pointer",
                })}
              >
                Not Satisfied
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
});

export default TicketListItem;
