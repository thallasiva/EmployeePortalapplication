import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_CFG } from "../constants";

function StatusBanner({ declaration, status, onEditResubmit }) {
  const statusCfg = STATUS_CFG[status] || null;
  if (!statusCfg) return null;

  return (
    <div className={cssClass({ background: statusCfg.bg, border: `1px solid ${statusCfg.color}30`, borderRadius: 10,
      padding: "12px 18px", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 })}>
      <span className={cssClass({ color: statusCfg.color, marginTop: 1 })}>{statusCfg.icon}</span>
      <div className={cssClass({ flex: 1 })}>
        <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: statusCfg.color })}>{statusCfg.label}</p>
        {declaration?.submitted_at && (
          <p className={cssClass({ margin: "2px 0 0", fontSize: 12, color: "#64748b" })}>
            Submitted: {new Date(declaration.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        {declaration?.admin_remarks && (
          <p className={cssClass({ margin: "6px 0 0", fontSize: 13, color: "#334155", background: "rgba(0,0,0,0.04)", borderRadius: 6, padding: "6px 10px" })}>
            <strong>Admin remarks:</strong> {declaration.admin_remarks}
          </p>
        )}
        {status === "rejected" && (
          <button onClick={onEditResubmit} className={cssClass({ marginTop: 8, fontSize: 12, color: "#f18200", background: "none", border: "1px solid #f18200", borderRadius: 6, padding: "4px 12px", cursor: "pointer" })}>
            Edit & Resubmit
          </button>
        )}
      </div>
    </div>
  );
}

export default React.memo(StatusBanner);
