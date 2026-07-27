import React, { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDate, empName } from "../utils";
import { useRegularizationData } from "../hooks/useRegularizationData";
import RegCard from "./RegCard";

const isPending = (r) => ["pending", "Pending"].includes(r.status);

const RegularizationPanel = React.memo(function RegularizationPanel({ search, statusFilter }) {
  const { rows, loading, isPrivileged } = useRegularizationData();

  const byTab = useMemo(() => {
    if (statusFilter === "pending") return rows.filter(isPending);
    if (statusFilter === "decided") return rows.filter((r) => !isPending(r));
    return rows;
  }, [rows, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((r) =>
      [r.status, r.reason, r.remarks, fmtDate(r.attendance_date), empName(r)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [byTab, search]);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading…</div>;
  }

  if (!filtered.length) {
    return (
      <div className={cssClass({ textAlign: "center", padding: "60px 24px" })}>
        <CalendarClock size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>
          {statusFilter === "pending" ? "No pending regularization requests." : "No regularization records found."}
        </p>
      </div>
    );
  }

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
      {filtered.map((r, i) => (
        <RegCard key={r.regularization_id ?? r.id ?? i} r={r} isPrivileged={isPrivileged} idx={i} />
      ))}
    </div>
  );
});

export default RegularizationPanel;
