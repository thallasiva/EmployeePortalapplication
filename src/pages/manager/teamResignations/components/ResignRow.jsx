import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Paperclip } from "lucide-react";
import apiClient from "../../../../api/client";
import { fmtDate, fmtDT } from "../utils/formatters";
import { BRAND, STATUS_CFG } from "../constants";
import { cssClass } from "../../../../utils/classStyles";
import Avatar from "./Avatar";

const ResignRow = React.memo(function ResignRow({ row, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[row.status] || STATUS_CFG.pending;
  const attachUrl = row.attachment_path
    ? `${apiClient.defaults.baseURL}/resignations/my/${row.resignation_id}/attachment`
    : null;

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden" })}>

      <div onClick={() => setExpanded((e) => !e)}
        className={cssClass({ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" })}>
        <Avatar name={row.employee_name} />
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{row.employee_name}</p>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>
            {row.job_title || "—"} · {row.department_name || "—"}
          </p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>START DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.start_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>END DATE</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{fmtDate(row.end_date)}</p>
        </div>
        <div className={cssClass({ textAlign: "center" })}>
          <p className={cssClass({ margin: "0 0 1px", fontSize: 10, color: "#94a3b8", fontWeight: 600 })}>SHORTFALL</p>
          <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700,
            color: row.shortfall_days > 0 ? "#dc2626" : "#16a34a" })}>
            {row.shortfall_days > 0 ? `${row.shortfall_days}d` : "None"}
          </p>
        </div>
        <span className={cssClass({ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" })}>
          {cfg.label}
        </span>
        <ChevronDown size={16} color="#94a3b8"
          className={cssClass({ transform: expanded ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 })} />
      </div>

      {expanded && (
        <div className={cssClass({ borderTop: "1px solid #f1f5f9" })}>
          <div className={cssClass({ padding: "16px 20px", display: "grid",
            gridTemplateColumns: "repeat(3,1fr)", gap: "14px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <div className={cssClass({ gridColumn: "1/-1" })}>
              <p className={cssClass({ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase" })}>Reason</p>
              <p className={cssClass({ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 })}>{row.reason}</p>
            </div>
            {[
              ["Alternate Email", row.alternate_email],
              ["Alternate Mobile", row.alternate_mobile],
              ["Submitted On", fmtDT(row.created_at)],
              ["Tentative LWD", fmtDate(row.tentative_lwd)],
              ...(row.remarks ? [["Remarks", row.remarks]] : []),
            ].map(([l, v]) => (
              <div key={l}>
                <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" })}>{l}</p>
                <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{v || "—"}</p>
              </div>
            ))}
          </div>

          {row.manager_remarks && (
            <div className={cssClass({ padding: "12px 20px", background: "#f0fdf4",
              borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8 })}>
              <CheckCircle2 size={15} color="#16a34a" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
              <div>
                <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" })}>Your Remarks</p>
                <p className={cssClass({ margin: 0, fontSize: 13, color: "#15803d" })}>{row.manager_remarks}</p>
              </div>
            </div>
          )}

          {attachUrl && (
            <div className={cssClass({ padding: "10px 20px", borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: 8 })}>
              <Paperclip size={14} color={BRAND} />
              <a href={attachUrl} target="_blank" rel="noreferrer"
                className={cssClass({ fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
                {row.attachment_name || "View Attachment"}
              </a>
            </div>
          )}

          <div className={cssClass({ padding: "12px 20px", display: "flex", justifyContent: "flex-end" })}>
            {row.status === "pending" ? (
              <button onClick={() => onReview(row)} className={cssClass(
                { padding: "9px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                  border: "none", cursor: "pointer", background: BRAND, color: "#fff",
                  boxShadow: "0 2px 8px rgba(241,130,0,0.3)" })}>
                Review & Decide
              </button>
            ) : (
              <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>
                Reviewed on {fmtDT(row.manager_reviewed_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ResignRow;
