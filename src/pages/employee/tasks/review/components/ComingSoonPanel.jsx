import React from "react";
import { Construction } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const ComingSoonPanel = React.memo(function ComingSoonPanel({ label }) {
  return (
    <div className={cssClass({ textAlign: "center", padding: "60px 24px" })}>
      <Construction size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
      <p className={cssClass({ fontSize: 14, color: "#94a3b8", margin: 0 })}>
        <strong className={cssClass({ color: "#64748b" })}>{label}</strong> will be available here soon.
      </p>
    </div>
  );
});

export default ComingSoonPanel;
