import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const LeaveBalanceCard = React.memo(function LeaveBalanceCard({ loading, leaveBalance }) {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>Leave Balance</div>
      {loading ? (
        <div className={cssClass({ color: "#94a3b8", fontSize: 13 })}>Loading…</div>
      ) : leaveBalance.length === 0 ? (
        <div className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" })}>
          No leave balance data.
        </div>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {leaveBalance.map((lb) => {
            const used = Number(lb.used_days ?? lb.used ?? 0);
            const total = Number(lb.total_days ?? lb.total ?? lb.annual_quota ?? 0);
            const avail = Number(lb.available ?? lb.balance ?? total - used);
            const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
            return (
              <div key={lb.leave_type_id || lb.id}>
                <div className={cssClass({ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 })}>
                  <span className={cssClass({ color: "#334155", fontWeight: 600 })}>{lb.leave_type_name || lb.name}</span>
                  <span className={cssClass({ color: "#64748b" })}>
                    <span className={cssClass({ fontWeight: 700, color: "#16a34a" })}>{avail}</span> / {total} avail
                  </span>
                </div>
                <div className={cssClass({ height: 6, background: "#f1f5f9", borderRadius: 3 })}>
                  <div className={cssClass({
                    height: "100%", borderRadius: 3, width: `${pct}%`,
                    background: pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#f18200",
                    transition: "width 0.4s",
                  })} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default LeaveBalanceCard;
