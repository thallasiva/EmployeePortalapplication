import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { CYCLE_TYPE_MAP } from "../constants";

const CycleTypeBadge = React.memo(function CycleTypeBadge({ type }) {
  const t = CYCLE_TYPE_MAP[type] || {
    label: type || "Yearly",
    color: "#166534",
    bg: "#dcfce7",
    icon: "🏆",
  };
  return (
    <span
      className={cssClass({
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: t.bg,
        color: t.color,
        borderRadius: 999,
        padding: "3px 12px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
      })}
    >
      {t.icon} {t.label} Appraisal
    </span>
  );
});

export default CycleTypeBadge;
