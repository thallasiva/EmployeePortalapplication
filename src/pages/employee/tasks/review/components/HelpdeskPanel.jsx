import React, { useMemo } from "react";
import { MailOpen } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { useHelpdeskData } from "../hooks/useHelpdeskData";
import TicketCard from "./TicketCard";
import StatChip from "./StatChip";

const OPEN_STATUSES     = ["open", "pending", "in-progress", "Forwarded", "Reopened"];
const RESOLVED_STATUSES = ["resolved", "closed", "Approved", "Rejected"];

const HelpdeskPanel = React.memo(function HelpdeskPanel({ search, statusFilter }) {
  const { rows, loading, isPrivileged } = useHelpdeskData();

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter === "pending") list = rows.filter((r) => OPEN_STATUSES.includes(r.status));
    else if (statusFilter === "decided") list = rows.filter((r) => RESOLVED_STATUSES.includes(r.status));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.subject, r.title, r.category, r.priority, r.status, r.employee_name, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, statusFilter, search]);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading…</div>;
  }

  if (!rows.length) {
    return (
      <div className={cssClass({ textAlign: "center", padding: "60px 24px" })}>
        <MailOpen size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>
          {isPrivileged ? "No helpdesk tickets found." : "You haven't raised any helpdesk tickets."}
        </p>
      </div>
    );
  }

  const open     = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length;
  const resolved = rows.filter((r) => ["resolved", "closed", "Approved"].includes(r.status)).length;

  return (
    <>
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" })}>
        <StatChip color="#64748b" label="Total"    count={rows.length} />
        <StatChip color="#60a5fa" label="Open"     count={open} />
        <StatChip color="#22c55e" label="Resolved" count={resolved} />
      </div>
      {!filtered.length ? (
        <p className={cssClass({ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 })}>
          No results match your filter.
        </p>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {filtered.map((t) => <TicketCard key={t.ticket_id} t={t} isPrivileged={isPrivileged} />)}
        </div>
      )}
    </>
  );
});

export default HelpdeskPanel;
