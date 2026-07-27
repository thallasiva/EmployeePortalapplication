import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { empName } from "../utils";
import { useLeaveData } from "../hooks/useLeaveData";
import LeaveCard from "./LeaveCard";
import StatChip from "./StatChip";

const isPending = (r) => ["pending", "Pending"].includes(r.status);

const LeaveDecisionsPanel = React.memo(function LeaveDecisionsPanel({ search, statusFilter }) {
  const { rows, loading, isPrivileged } = useLeaveData("decisions");

  const byTab = useMemo(() => {
    if (statusFilter === "pending") return rows.filter(isPending);
    if (statusFilter === "decided") return rows.filter((r) => !isPending(r));
    return rows;
  }, [rows, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((r) =>
      [r.leave_type_name, r.status, r.reason, r.remarks, empName(r)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [byTab, search]);

  if (loading) {
    return (
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={cssClass({ height: 90, borderRadius: 10, background: "linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" })} />
        ))}
      </div>
    );
  }

  const pendingCount = rows.filter(isPending).length;

  return (
    <>
      {rows.length > 0 && (
        <div className={cssClass({ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" })}>
          <StatChip color="#64748b" label="Total" count={rows.length} />
          <StatChip color="#facc15" label="Pending" count={pendingCount} />
          <StatChip color="#22c55e" label="Approved" count={rows.filter((r) => ["approved", "Approved"].includes(r.status)).length} />
          <StatChip color="#ef4444" label="Rejected" count={rows.filter((r) => ["rejected", "Rejected"].includes(r.status)).length} />
        </div>
      )}
      {filtered.length === 0 ? (
        <div className={cssClass({ textAlign: "center", padding: "60px 24px" })}>
          <Calendar size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
          <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>
            {statusFilter === "pending"
              ? isPrivileged ? "No pending requests to review." : "You have no pending leave requests."
              : statusFilter === "decided"
              ? isPrivileged ? "No decided requests found." : "No approved or rejected requests yet."
              : isPrivileged ? "No leave requests found." : "You haven't applied any leaves yet."}
          </p>
        </div>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {filtered.map((r) => <LeaveCard key={r.leave_request_id} r={r} isPrivileged={isPrivileged} />)}
        </div>
      )}
    </>
  );
});

export default LeaveDecisionsPanel;
