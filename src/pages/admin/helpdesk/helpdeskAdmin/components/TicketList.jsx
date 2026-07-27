import React from "react";
import { Headphones } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, STATUS_COLOR, TEAM_COLOR } from "../constants";
import { fmtDate } from "../utils/dateUtils";

const TicketList = React.memo(({ tickets, total, page, limit, loading, isAdminUser, onSelect, onPageChange }) => (
  <div className={cssClass({ flex: 1, background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, overflow: "hidden", minHeight: 0, display: "flex", flexDirection: "column" })}>

    {/* column headers */}
    <div className={cssClass({ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1.1fr 1fr 0.8fr",
      padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
      fontSize: 11, fontWeight: 700, color: "#64748b",
      textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 })}>
      <span>Subject</span><span>Employee</span><span>Category</span>
      <span>Forwarded To</span><span>Status</span><span>Date</span>
    </div>

    {/* rows */}
    <div className={cssClass({ flex: 1, overflowY: "auto" })}>
      {loading ? (
        <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading…</div>
      ) : tickets.length === 0 ? (
        <div className={cssClass({ padding: 60, textAlign: "center" })}>
          <Headphones size={36} strokeWidth={1.2} color="#e2e8f0" />
          <p className={cssClass({ fontSize: 13, color: "#94a3b8", marginTop: 12 })}>No tickets found.</p>
        </div>
      ) : tickets.map((t, i) => {
        const sc  = STATUS_COLOR[t.status] || STATUS_COLOR["Open"];
        const tc2 = TEAM_COLOR[t.forwarded_to_team] || {};
        const needsAction = !isAdminUser && t.status === "Open";
        const needsWork   = isAdminUser  && ["Forwarded", "In Progress", "Reopened"].includes(t.status);
        return (
          <div key={t.ticket_id} onClick={() => onSelect(t)}
            onMouseEnter={(e) => e.currentTarget.style.background = needsAction || needsWork ? "#fff7ed" : "#f8fafc"}
            onMouseLeave={(e) => e.currentTarget.style.background = needsAction || needsWork ? "#fffbf5" : "transparent"}
            className={cssClass({ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 1.1fr 1fr 0.8fr",
              padding: "12px 16px",
              borderBottom: i < tickets.length - 1 ? "1px solid #f1f5f9" : "none",
              cursor: "pointer", alignItems: "center",
              background: needsAction || needsWork ? "#fffbf5" : "transparent",
              borderLeft: needsAction || needsWork ? `3px solid ${BRAND}` : "3px solid transparent" })}>
            <div className={cssClass({ minWidth: 0 })}>
              <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{t.subject}</p>
              {t.description && (
                <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: "2px 0 0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{t.description}</p>
              )}
            </div>
            <div>
              <p className={cssClass({ fontSize: 12, color: "#374151", fontWeight: 500, margin: 0 })}>{t.employee_name || "—"}</p>
              <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: 0 })}>{t.emp_code || ""}</p>
            </div>
            <span className={cssClass({ fontSize: 12, color: "#64748b" })}>{t.category || "—"}</span>
            <span>
              {t.forwarded_to_team ? (
                <span className={cssClass({ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                  background: tc2.bg || "#f3f4f6", color: tc2.color || "#374151" })}>
                  {t.forwarded_to_team}
                </span>
              ) : (
                <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>—</span>
              )}
            </span>
            <span className={cssClass({ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: sc.bg, color: sc.color, alignSelf: "start", display: "inline-block" })}>
              {t.status}
            </span>
            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{fmtDate(t.created_at)}</span>
          </div>
        );
      })}
    </div>

    {/* pagination */}
    {total > limit && (
      <div className={cssClass({ padding: "10px 16px", borderTop: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 12, color: "#64748b", flexShrink: 0 })}>
        <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
        <div className={cssClass({ display: "flex", gap: 4 })}>
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
            className={cssClass({ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
              background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.5 : 1, fontSize: 12 })}>← Prev</button>
          <button onClick={() => onPageChange(page + 1)} disabled={page * limit >= total}
            className={cssClass({ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
              background: "#fff", cursor: page * limit >= total ? "not-allowed" : "pointer",
              opacity: page * limit >= total ? 0.5 : 1, fontSize: 12 })}>Next →</button>
        </div>
      </div>
    )}
  </div>
));

TicketList.displayName = "TicketList";
export default TicketList;
