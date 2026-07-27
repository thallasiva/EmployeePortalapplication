import React from "react";
import { User } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { RESIGN_STATUS_CONFIG } from "../constants";
import { fmtDate, empName } from "../utils";
import ResignBadge from "./ResignBadge";

const ResignCard = React.memo(function ResignCard({ r, isPrivileged }) {
  const cfg = RESIGN_STATUS_CONFIG[r.status] || RESIGN_STATUS_CONFIG.pending;
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
            <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{r.employee_name || empName(r)}</span>
            {r.emp_code && <span className={cssClass({ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 })}>{r.emp_code}</span>}
            {r.job_title && <span className={cssClass({ fontSize: 11, color: "#64748b" })}>{r.job_title}</span>}
          </div>
        )}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" })}>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Resignation</span>
          {r.department_name && (
            <span className={cssClass({ fontSize: 11, background: "#f0f9ff", color: "#0369a1", padding: "1px 8px", borderRadius: 4, fontWeight: 600 })}>
              {r.department_name}
            </span>
          )}
        </div>
        <div className={cssClass({ display: "flex", gap: 18, marginTop: 6, flexWrap: "wrap" })}>
          {r.resignation_date && (
            <span className={cssClass({ fontSize: 12, color: "#64748b" })}>
              <span className={cssClass({ color: "#94a3b8" })}>Submitted: </span>{fmtDate(r.resignation_date)}
            </span>
          )}
          {r.last_working_day && (
            <span className={cssClass({ fontSize: 12, color: "#64748b" })}>
              <span className={cssClass({ color: "#94a3b8" })}>Last Day: </span>
              <strong>{fmtDate(r.last_working_day)}</strong>
            </span>
          )}
        </div>
        {r.reason && (
          <p className={cssClass({ fontSize: 12, color: "#64748b", margin: "4px 0 0" })}>
            <span className={cssClass({ color: "#94a3b8" })}>Reason: </span>{r.reason}
          </p>
        )}
        {(r.manager_remarks || r.admin_remarks) && (
          <p className={cssClass({ fontSize: 12, color: "#475569", margin: "3px 0 0" })}>
            <span className={cssClass({ color: "#94a3b8" })}>Remarks: </span>
            {r.manager_remarks || r.admin_remarks}
          </p>
        )}
      </div>
      <ResignBadge status={r.status} />
    </div>
  );
});

export default ResignCard;
