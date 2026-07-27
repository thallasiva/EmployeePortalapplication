import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const Chip = React.memo(function Chip({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={cssClass({
      background: "#fff", border: `1.5px solid ${color}22`,
      borderRadius: 10, padding: "12px 14px", position: "relative",
      borderLeft: `3px solid ${color}`,
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 })}>
        {Icon && <Icon size={12} color={color} />}
        <span className={cssClass({ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" })}>
          {label}
        </span>
      </div>
      <p className={cssClass({ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" })}>{value}</p>
      {sub && <p className={cssClass({ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" })}>{sub}</p>}
    </div>
  );
});

export default Chip;
