import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { sc } from "../constants";

const Badge = React.memo(function Badge({ status }) {
  const cfg = sc(status);
  return (
    <span className={cssClass({
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 999, background: cfg.bg, color: cfg.color,
      textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0,
    })}>
      {cfg.icon}{status}
    </span>
  );
});

export default Badge;
