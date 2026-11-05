import React from "react";
import { cssClass } from "../../../../utils/classStyles";
const STATUS_CONFIG = {
  submitted: { bg: "#dcfce7", color: "#15803d", label: "Submitted" },
  draft: { bg: "#fef9c3", color: "#ca8a04", label: "Draft" },
  manager_review: { bg: "#e0e7ff", color: "#3730a3", label: "Manager review" },
  hr_review: { bg: "#dbeafe", color: "#1d4ed8", label: "HR review" },
  changes_requested: { bg: "#ffedd5", color: "#9a3412", label: "Changes requested" },
  shared: { bg: "#f3e8ff", color: "#6b21a8", label: "Shared" },
  acknowledged: { bg: "#dcfce7", color: "#15803d", label: "Acknowledged" },
  closed: { bg: "#f1f5f9", color: "#475569", label: "Closed" },
  not_started: { bg: "#f1f5f9", color: "#64748b", label: "Not Started" },
  approved: { bg: "#dbeafe", color: "#1d4ed8", label: "Approved" },
};
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: "#f1f5f9", color: "#64748b", label: status || "Pending" };
  return (
    <span
      className={cssClass({
        fontSize: 11, fontWeight: 600, padding: "2px 10px",
        borderRadius: 999, background: cfg.bg, color: cfg.color,
      })}
    >
      {cfg.label}
    </span>
  );
}
export default React.memo(StatusBadge);
