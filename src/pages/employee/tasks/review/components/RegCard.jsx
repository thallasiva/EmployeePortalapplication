import React from "react";
import { User, CalendarClock } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { sc } from "../constants";
import { fmtDate, empName } from "../utils";
import Badge from "./Badge";

const RegCard = React.memo(function RegCard({ r, isPrivileged }) {
  const cfg = sc(r.status);
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
          </div>
        )}
        <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Attendance Regularization</span>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginTop: 5 })}>
          <CalendarClock size={12} className={cssClass({ color: "#94a3b8" })} />
          <span className={cssClass({ fontSize: 12, color: "#64748b" })}>
            {fmtDate(r.attendance_date ?? r.date)}
            {r.check_in && <>&nbsp;·&nbsp;In: <strong>{r.check_in}</strong></>}
            {r.check_out && <>&nbsp;·&nbsp;Out: <strong>{r.check_out}</strong></>}
          </span>
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
        {(r.applied_on || r.created_at) && (
          <span className={cssClass({ fontSize: 11, color: "#94a3b8", display: "block", marginTop: 5 })}>
            Applied {fmtDate(r.applied_on || r.created_at)}
          </span>
        )}
      </div>
      <Badge status={r.status} />
    </div>
  );
});

export default RegCard;
