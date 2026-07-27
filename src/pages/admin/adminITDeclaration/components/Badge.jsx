import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const Badge = React.memo(function Badge({ status, map }) {
  const c = map[status] || { bg: "#f1f5f9", color: "#64748b", label: status || "—" };
  return (
    <span
      className={cssClass({
        fontSize: 11, fontWeight: 700, padding: "2px 10px",
        borderRadius: 999, background: c.bg, color: c.color,
      })}
    >
      {c.label}
    </span>
  );
});

export default Badge;
