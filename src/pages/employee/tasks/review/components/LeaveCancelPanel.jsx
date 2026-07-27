import React, { useMemo } from "react";
import { XCircle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { empName } from "../utils";
import { useLeaveData } from "../hooks/useLeaveData";
import LeaveCard from "./LeaveCard";

const LeaveCancelPanel = React.memo(function LeaveCancelPanel({ search }) {
  const { rows, loading, isPrivileged } = useLeaveData("cancel");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.leave_type_name, r.status, r.reason, empName(r)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 })}>Loading…</div>;
  }

  if (!filtered.length) {
    return (
      <div className={cssClass({ textAlign: "center", padding: "60px 24px" })}>
        <XCircle size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>No leave cancellation records found.</p>
      </div>
    );
  }

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
      {filtered.map((r) => <LeaveCard key={r.leave_request_id} r={r} isPrivileged={isPrivileged} />)}
    </div>
  );
});

export default LeaveCancelPanel;
