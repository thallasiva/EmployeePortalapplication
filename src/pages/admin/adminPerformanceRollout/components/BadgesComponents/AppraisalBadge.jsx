import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const AppraisalBadge = React.memo(function AppraisalBadge({
  status
}) {
  const map = {
    draft: {
      bg: "#fef9c3",
      color: "#92400e",
      label: "Draft"
    },
    submitted: {
      bg: "#dcfce7",
      color: "#166534",
      label: "Submitted"
    },
    manager_review: {
      bg: "#ffedd5",
      color: "#3730a3",
      label: "Manager review"
    },
    hr_review: {
      bg: "#ffedd5",
      color: "#9b4c00",
      label: "HR review"
    },
    changes_requested: {
      bg: "#ffedd5",
      color: "#9a3412",
      label: "Changes requested"
    },
    shared: {
      bg: "#f3e8ff",
      color: "#6b21a8",
      label: "Shared"
    },
    acknowledged: {
      bg: "#dcfce7",
      color: "#166534",
      label: "Acknowledged"
    },
    closed: {
      bg: "#f1f5f9",
      color: "#475569",
      label: "Closed"
    }
  };
  const s = map[status] || {
    bg: "#f1f5f9",
    color: "#64748b",
    label: "New"
  };
  return <span className={cssClass({
    background: s.bg,
    color: s.color,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 700
  })}>{s.label}</span>;
});
export { AppraisalBadge };
