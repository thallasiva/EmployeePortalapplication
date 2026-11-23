import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
const Badge = React.memo(function Badge({
  children,
  color = "#16a34a"
}) {
  return <span className={cssClass({
    background: color + "18",
    color,
    border: `1px solid ${color}40`,
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700
  })}>
      {children}
    </span>;
});
export { Badge };
