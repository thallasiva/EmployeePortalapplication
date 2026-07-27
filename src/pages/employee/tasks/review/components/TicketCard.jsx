import React from "react";
import { User } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { TICKET_STATUS_CONFIG } from "../constants";
import { fmtDate } from "../utils";
import TicketBadge from "./TicketBadge";

const TicketCard = React.memo(function TicketCard({ t, isPrivileged }) {
  const cfg = TICKET_STATUS_CONFIG[t.status] || { border: "#cbd5e1" };
  return (
    <div
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
      className={cssClass({
        background: "#fff", border: "1px solid #e8edf2",
        borderLeft: `4px solid ${cfg.border}`, borderRadius: 10,
        padding: "14px 18px", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 14, transition: "box-shadow 0.15s",
      })}>
      <div className={cssClass({ flex: 1, minWidth: 0 })}>
        {isPrivileged && t.employee_name && (
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 })}>
            <div className={cssClass({ width: 26, height: 26, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" })}>
              <User size={13} className={cssClass({ color: "#0369a1" })} />
            </div>
            <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{t.employee_name}</span>
          </div>
        )}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{t.subject || t.title || "—"}</span>
          {t.category && (
            <span className={cssClass({ fontSize: 11, background: "#f0f9ff", color: "#0369a1", padding: "1px 8px", borderRadius: 4, fontWeight: 600 })}>{t.category}</span>
          )}
          {t.priority && (
            <span className={cssClass({ fontSize: 11, background: "#fff7ed", color: "#c2410c", padding: "1px 8px", borderRadius: 4, fontWeight: 600 })}>{t.priority}</span>
          )}
        </div>
        {t.description && (
          <p className={cssClass({ fontSize: 12, color: "#64748b", margin: "4px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" })}>
            {t.description}
          </p>
        )}
        <div className={cssClass({ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" })}>
          {t.created_at && <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>Raised {fmtDate(t.created_at)}</span>}
          {t.assigned_to_name && (
            <span className={cssClass({ fontSize: 11, color: "#64748b" })}>
              <span className={cssClass({ color: "#94a3b8" })}>Assigned to: </span>{t.assigned_to_name}
            </span>
          )}
          {t.forwarded_to_team && (
            <span className={cssClass({ fontSize: 11, color: "#7c3aed" })}>
              <span className={cssClass({ color: "#94a3b8" })}>Team: </span>{t.forwarded_to_team}
            </span>
          )}
        </div>
      </div>
      <TicketBadge status={t.status} />
    </div>
  );
});

export default TicketCard;
