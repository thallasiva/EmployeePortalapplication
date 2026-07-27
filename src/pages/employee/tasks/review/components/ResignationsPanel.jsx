import React, { useMemo } from "react";
import { Briefcase } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { useResignationsData } from "../hooks/useResignationsData";
import ResignCard from "./ResignCard";
import StatChip from "./StatChip";

const ResignationsPanel = React.memo(function ResignationsPanel({ search, statusFilter }) {
  const { rows, loading, isPrivileged } = useResignationsData();

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter === "pending") list = rows.filter((r) => r.status === "pending");
    else if (statusFilter === "decided") list = rows.filter((r) => r.status !== "pending");
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.employee_name, r.emp_code, r.job_title, r.department_name, r.reason, r.status]
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
        <Briefcase size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>
          {isPrivileged ? "No resignation requests found." : "You haven't submitted a resignation."}
        </p>
      </div>
    );
  }

  const pending  = rows.filter((r) => r.status === "pending").length;
  const accepted = rows.filter((r) => ["accepted", "rm_approved"].includes(r.status)).length;
  const rejected = rows.filter((r) => ["rejected", "rm_rejected"].includes(r.status)).length;

  return (
    <>
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" })}>
        <StatChip color="#64748b" label="Total"    count={rows.length} />
        <StatChip color="#facc15" label="Pending"  count={pending} />
        <StatChip color="#22c55e" label="Accepted" count={accepted} />
        <StatChip color="#ef4444" label="Rejected" count={rejected} />
      </div>
      {!filtered.length ? (
        <p className={cssClass({ textAlign: "center", color: "#94a3b8", padding: "30px 0", fontSize: 13 })}>
          No results match your filter.
        </p>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {filtered.map((r) => <ResignCard key={r.resignation_id} r={r} isPrivileged={isPrivileged} />)}
        </div>
      )}
    </>
  );
});

export default ResignationsPanel;
