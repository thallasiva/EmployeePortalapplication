import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, STATUS_CFG, fmtDate, fmtDT } from "../constants";

const FINAL_STATUSES = ["accepted", "rejected"];

const ResignRow = React.memo(function ResignRow({ row, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[row.status] || STATUS_CFG.pending;
  const isFinal = FINAL_STATUSES.includes(row.status);

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" })}>
      <div onClick={() => setExpanded((e) => !e)}
        className={cssClass({ padding: "14px 20px", display: "flex", alignItems: "center",
          gap: 14, cursor: "pointer" })}>
        {/* Avatar */}
        <div className={cssClass({ width: 38, height: 38, borderRadius: "50%", background: BRAND,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 13, flexShrink: 0 })}>
          {(row.employee_name || "?").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase()}
        </div>

        {/* Name + code */}
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{row.employee_name}</p>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>{row.emp_code} · {row.department_name || "—"}</p>
        </div>

        {/* Date columns */}
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>START</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.start_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>END DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.end_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>MANAGER</p>
          <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 600, color: "#64748b" })}>{row.manager_reviewed_by_name || "—"}</p>
        </div>

        {/* Status badge */}
        <span className={cssClass({ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" })}>
          {cfg.label}
        </span>

        {/* Action button */}
        <button onClick={(e) => { e.stopPropagation(); onReview(row); }}
          className={cssClass({ padding: "7px 16px", borderRadius: 7, fontWeight: 700, fontSize: 12,
            border: "none", cursor: "pointer", flexShrink: 0,
            background: isFinal ? "#f1f5f9" : BRAND,
            color: isFinal ? "#64748b" : "#fff" })}>
          {isFinal ? "View" : "Review"}
        </button>

        <ChevronDown size={14} color="#94a3b8"
          className={cssClass({ transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 })} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className={cssClass({ borderTop: "1px solid #f1f5f9", padding: "14px 20px",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px 20px", background: "#fafafa" })}>
          {[
            ["Reason",       row.reason],
            ["Shortfall",    row.shortfall_days > 0 ? `${row.shortfall_days} days` : "None"],
            ["Tentative LWD", fmtDate(row.tentative_lwd)],
            ["Applied On",   fmtDT(row.created_at)],
            ["Mgr Remarks",  row.manager_remarks || "—"],
            ["HR Remarks",   row.admin_remarks || "—"],
          ].map(([l, v]) => (
            <div key={l}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, color: "#94a3b8",
                fontWeight: 700, textTransform: "uppercase" })}>{l}</p>
              <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e293b" })}>{v || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ResignRow;
