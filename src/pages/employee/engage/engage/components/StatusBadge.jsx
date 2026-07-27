import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { STATUS_CFG } from "../constants";

const StatusBadge = React.memo(function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["new"];
  const { label, bg, color, Icon } = cfg;
  return (
    <span
      className={cssClass({
        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
        fontWeight: 600, background: bg, color, padding: "3px 9px", borderRadius: 20,
      })}
    >
      <Icon size={11} />
      {label}
    </span>
  );
});

export default StatusBadge;
