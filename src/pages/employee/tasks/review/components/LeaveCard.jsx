import React from "react";
import { Calendar, User } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { sc } from "../constants";
import { fmtDate, empName } from "../utils";
import Badge from "./Badge";

const LeaveCard = React.memo(function LeaveCard({ r, isPrivileged }) {
  const cfg = sc(r.status);
  const days = Number(r.total_days ?? r.days ?? 0);
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
        {isPrivileged && (
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 })}>
            <div className={cssClass({ width: 26, height: 26, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" })}>
              <User size={13} className={cssClass({ color: "#0369a1" })} />
            </div>
            <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{empName(r)}</span>
            {r.emp_code && (
              <span className={cssClass({ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 })}>{r.emp_code}</span>
            )}
          </div>
        )}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{r.leave_type_name || "Leave"}</span>
          <span className={cssClass({ fontSize: 11, background: "#f0f9ff", color: "#0369a1", padding: "1px 8px", borderRadius: 4, fontWeight: 600 })}>
            {days} day{days !== 1 ? "s" : ""}
          </span>
        </div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginTop: 5 })}>
          <Calendar size={12} className={cssClass({ color: "#94a3b8" })} />
          <span className={cssClass({ fontSize: 12, color: "#64748b" })}>{fmtDate(r.from_date)} – {fmtDate(r.to_date)}</span>
        </div>
        {r.reason && (
          <p className={cssClass({ fontSize: 12, color: "#64748b", margin: "4px 0 0" })}>
            <span className={cssClass({ color: "#94a3b8" })}>Reason: </span>{r.reason}
          </p>
        )}
        {r.remarks && (
          <p className={cssClass({ fontSize: 12, color: "#475569", margin: "3px 0 0" })}>
            <span className={cssClass({ color: "#94a3b8" })}>Remarks: </span>{r.remarks}
          </p>
        )}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" })}>
          {r.reviewer_name?.trim() && (
            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>
              Reviewed by <span className={cssClass({ color: "#475569", fontWeight: 600 })}>{r.reviewer_name.trim()}</span>
              {r.reviewed_on ? ` on ${fmtDate(r.reviewed_on)}` : ""}
            </span>
          )}
          {(r.applied_on || r.created_at) && (
            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>Applied {fmtDate(r.applied_on || r.created_at)}</span>
          )}
        </div>
      </div>
      <Badge status={r.status} />
    </div>
  );
});

export default LeaveCard;
