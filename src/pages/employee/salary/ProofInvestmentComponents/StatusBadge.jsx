import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { STATUS_CFG } from "./STATUS_CFG";
function StatusBadge({
  status
}) {
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className={cssClass({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 999,
    background: s.bg,
    color: s.color
  })}>
      {s.icon}{s.label}
    </span>;
}
export { StatusBadge };
