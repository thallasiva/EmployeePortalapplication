import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { CYCLE_TYPES } from "../constants";

export const CycleTypeBadge = React.memo(function CycleTypeBadge({ type }) {
  const t = CYCLE_TYPES.find((x) => x.val === type) || { label: type || "Yearly", color: "#166534", bg: "#dcfce7" };
  return (
    <span className={cssClass({ background: t.bg, color: t.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.2 })}>
      {t.label}
    </span>
  );
});

export const StatusBadge = React.memo(function StatusBadge({ status }) {
  const map = {
    active: { bg: "#dcfce7", color: "#166534", label: "Active" },
    inactive: { bg: "#f1f5f9", color: "#64748b", label: "Inactive" }
  };
  const s = map[status] || map.inactive;
  return (
    <span className={cssClass({ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 })}>{s.label}</span>
  );
});

export const AppraisalBadge = React.memo(function AppraisalBadge({ status }) {
  const map = {
    draft: { bg: "#fef9c3", color: "#92400e", label: "Draft" },
    submitted: { bg: "#dcfce7", color: "#166534", label: "Submitted" },
    reviewed: { bg: "#dbeafe", color: "#1e40af", label: "Reviewed" }
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#64748b", label: "New" };
  return (
    <span className={cssClass({ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700 })}>{s.label}</span>
  );
});
