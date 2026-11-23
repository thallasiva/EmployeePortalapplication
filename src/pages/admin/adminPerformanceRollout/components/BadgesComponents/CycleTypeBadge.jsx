import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { CYCLE_TYPES } from "../../constants";
const CycleTypeBadge = React.memo(function CycleTypeBadge({
  type
}) {
  const t = CYCLE_TYPES.find(x => x.val === type) || {
    label: type || "Yearly",
    color: "#166534",
    bg: "#dcfce7"
  };
  return <span className={cssClass({
    background: t.bg,
    color: t.color,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.2
  })}>
      {t.label}
    </span>;
});
export { CycleTypeBadge };
