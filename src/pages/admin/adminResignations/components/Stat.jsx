import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const Stat = React.memo(function Stat({ label, value, color }) {
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      padding: "16px 20px", borderLeft: `3px solid ${color}` })}>
      <p className={cssClass({ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</p>
      <p className={cssClass({ margin: 0, fontSize: 26, fontWeight: 900, color: "#1e293b" })}>{value}</p>
    </div>
  );
});

export default Stat;
