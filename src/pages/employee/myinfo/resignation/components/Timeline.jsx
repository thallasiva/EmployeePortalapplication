import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
import { fmtDT } from "../utils";

const mkInitials = (name) =>
  (name || "").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "—";

const Timeline = React.memo(function Timeline({ resignation, profile }) {
  const empName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "You";

  const events = [
    {
      name: empName, initials: mkInitials(empName), color: BRAND,
      time: resignation.created_at, action: "Submitted Application", remarks: null,
    },
    ...(resignation.manager_reviewed_at ? [{
      name: resignation.manager_reviewed_by_name || "Reporting Manager",
      initials: mkInitials(resignation.manager_reviewed_by_name || "Reporting Manager"),
      color: resignation.status === "rm_rejected" ? "#dc2626" : "#3b82f6",
      time: resignation.manager_reviewed_at,
      action: resignation.status === "rm_rejected" ? "Manager Rejected" : "Manager Approved — Sent to HR",
      remarks: resignation.manager_remarks,
    }] : []),
    ...(resignation.reviewed_at ? [{
      name: resignation.reviewed_by_name || "HR",
      initials: mkInitials(resignation.reviewed_by_name || "HR"),
      color: resignation.status === "accepted" ? "#16a34a" : "#dc2626",
      time: resignation.reviewed_at,
      action: resignation.status === "accepted" ? "HR Accepted" : "HR Rejected",
      remarks: resignation.admin_remarks,
    }] : []),
    ...(resignation.status === "withdrawn" ? [{
      name: empName, initials: mkInitials(empName), color: "#64748b",
      time: resignation.updated_at, action: "Withdrew Application", remarks: null,
    }] : []),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 })}>
      <p className={cssClass({ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" })}>
        Timeline
      </p>
      <div className={cssClass({ position: "relative" })}>
        {events.map((ev, i) => (
          <div key={i} className={cssClass({ display: "flex", gap: 12, position: "relative", paddingBottom: i < events.length - 1 ? 20 : 0 })}>
            {i < events.length - 1 && (
              <div className={cssClass({ position: "absolute", left: 17, top: 34, bottom: 0, width: 2, background: "#f1f5f9" })} />
            )}
            <div className={cssClass({ width: 34, height: 34, borderRadius: "50%", background: ev.color, color: "#fff", fontWeight: 800, fontSize: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 3px ${ev.color}22` })}>
              {ev.initials}
            </div>
            <div className={cssClass({ paddingTop: 2, flex: 1 })}>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{ev.name}</p>
              <p className={cssClass({ margin: "2px 0", fontSize: 10, color: "#94a3b8" })}>{fmtDT(ev.time)}</p>
              <span className={cssClass({ fontSize: 11, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 8px" })}>
                {ev.action}
              </span>
              {ev.remarks && (
                <p className={cssClass({ margin: "6px 0 0", fontSize: 12, color: "#374151", background: "#f8fafc", borderRadius: 6, padding: "6px 10px", border: "1px solid #e2e8f0", lineHeight: 1.5 })}>
                  "{ev.remarks}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Timeline;
