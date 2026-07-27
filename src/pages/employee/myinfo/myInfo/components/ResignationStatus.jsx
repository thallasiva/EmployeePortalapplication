import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_CFG } from "../constants";
import { fmtDate } from "../utils";

const ResignationStatus = React.memo(function ResignationStatus({ data, onWithdraw, withdrawing }) {
  const cfg = STATUS_CFG[data.status] || STATUS_CFG.pending;
  return (
    <div className={cssClass({ border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "14px 18px", background: cfg.bg, marginTop: 16 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 })}>
        <span className={cssClass({ color: cfg.color })}>{cfg.icon}</span>
        <span className={cssClass({ fontSize: 14, fontWeight: 700, color: cfg.color })}>{cfg.label}</span>
        {data.status === "pending" && (
          <button onClick={onWithdraw} disabled={withdrawing} className={cssClass({ marginLeft: "auto", fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${cfg.border}`, background: "#fff", color: cfg.color, fontWeight: 600, cursor: "pointer" })}>
            {withdrawing ? "Withdrawing…" : "Withdraw"}
          </button>
        )}
      </div>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 16px" })}>
        {[
          ["Reason", data.reason],
          ["Last Working Day", fmtDate(data.last_working_day)],
          ["Notice Period", `${data.notice_period} days`],
          ["Submitted", fmtDate(data.created_at)],
          ...(data.reviewed_at ? [["Reviewed", fmtDate(data.reviewed_at)]] : []),
          ...(data.reviewed_by_name ? [["Reviewed By", data.reviewed_by_name]] : []),
        ].map(([k, v]) => (
          <div key={k}>
            <p className={cssClass({ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" })}>{k}</p>
            <p className={cssClass({ fontSize: 12, fontWeight: 600, color: "#1e293b", margin: 0 })}>{v}</p>
          </div>
        ))}
      </div>
      {data.admin_remarks && (
        <div className={cssClass({ marginTop: 12, padding: "8px 12px", borderRadius: 7, background: "rgba(0,0,0,0.04)", fontSize: 12, color: "#334155" })}>
          <strong>HR Remarks:</strong> {data.admin_remarks}
        </div>
      )}
      {data.comments && (
        <div className={cssClass({ marginTop: 8, fontSize: 12, color: "#64748b" })}>
          <strong>Your message:</strong> {data.comments}
        </div>
      )}
    </div>
  );
});

export default ResignationStatus;
