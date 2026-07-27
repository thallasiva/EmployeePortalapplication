import React from "react";
import { RotateCcw, Paperclip } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import apiClient from "../../../../../api/client";
import { BRAND, STATUS_CFG } from "../constants";
import { fmtDate, diffDays } from "../utils";
import Chip from "./Chip";
import DetailRow from "./DetailRow";
import Timeline from "./Timeline";

const ResignCard = React.memo(function ResignCard({ data, profile, onWithdraw, withdrawing, isHistory }) {
  const cfg = STATUS_CFG[data.status] || STATUS_CFG.pending;
  const empName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "—";
  const noticeDays = data.start_date && data.end_date
    ? Math.max(0, diffDays(data.start_date, data.end_date))
    : null;
  const attachUrl = data.attachment_path
    ? `${apiClient.defaults.baseURL}/resignations/my/${data.resignation_id}/attachment`
    : null;

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 250px", gap: 16, alignItems: "start" })}>
      {/* Main card */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>
        {/* Header */}
        <div className={cssClass({ padding: "14px 20px", background: "#fafafa", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
            <div className={cssClass({ width: 36, height: 36, borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 })}>
              {(empName || "U").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{empName}</p>
              <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>Applied on {fmtDate(data.created_at)}</p>
            </div>
          </div>
          <span className={cssClass({ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` })}>
            {cfg.label}
          </span>
        </div>

        {/* Date chips */}
        <div className={cssClass({ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, borderBottom: "1px solid #f1f5f9" })}>
          <Chip label="Start Date"      value={fmtDate(data.start_date)}    color="#64748b" />
          <Chip label="End Date (LWD)"  value={fmtDate(data.end_date)}      color={BRAND} />
          <Chip label="Tentative LWD"   value={fmtDate(data.tentative_lwd)} color="#3b82f6" />
          <Chip
            label="Shortfall"
            value={(data.shortfall_days ?? 0) === 0 ? "None" : `${data.shortfall_days} days`}
            color={(data.shortfall_days ?? 0) > 0 ? "#dc2626" : "#16a34a"}
          />
        </div>

        {/* Details */}
        <div className={cssClass({
          padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px 24px",
          borderBottom: attachUrl || (!isHistory && data.status === "pending") ? "1px solid #f1f5f9" : undefined,
        })}>
          <DetailRow label="Reason"          value={data.reason} />
          <DetailRow label="Notice Given"    value={noticeDays !== null ? `${noticeDays} days` : "—"} />
          <DetailRow label="Alternate Email" value={data.alternate_email} />
          <DetailRow label="Alternate Mobile" value={data.alternate_mobile} />
          <DetailRow label="Applying To"    value={profile?.reporting_to_name || profile?.manager_name} />
          {data.remarks && <DetailRow label="Remarks" value={data.remarks} />}
          {data.admin_remarks && (
            <div className={cssClass({ gridColumn: "1/-1", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 })}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" })}>HR Remarks</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" })}>{data.admin_remarks}</p>
            </div>
          )}
        </div>

        {/* Attachment */}
        {attachUrl && (
          <div className={cssClass({ padding: "10px 20px", borderBottom: !isHistory && data.status === "pending" ? "1px solid #f1f5f9" : undefined, display: "flex", alignItems: "center", gap: 8 })}>
            <div className={cssClass({ width: 28, height: 28, borderRadius: 6, background: `${BRAND}15`, display: "flex", alignItems: "center", justifyContent: "center" })}>
              <Paperclip size={13} color={BRAND} />
            </div>
            <a href={attachUrl} target="_blank" rel="noreferrer" className={cssClass({ fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
              {data.attachment_name || "Download Attachment"}
            </a>
          </div>
        )}

        {/* Withdraw */}
        {!isHistory && data.status === "pending" && (
          <div className={cssClass({ padding: "12px 20px", display: "flex", justifyContent: "flex-end" })}>
            <button
              onClick={() => onWithdraw(data.resignation_id)}
              disabled={withdrawing}
              className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: withdrawing ? "not-allowed" : "pointer", border: "1.5px solid #fecaca", background: "#fef2f2", color: "#dc2626", opacity: withdrawing ? 0.6 : 1, transition: "all 0.15s" })}
            >
              <RotateCcw size={13} />
              {withdrawing ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        )}
      </div>

      <Timeline resignation={data} profile={profile} />
    </div>
  );
});

export default ResignCard;
