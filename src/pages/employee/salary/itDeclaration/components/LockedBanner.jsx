import React from "react";
import { Lock } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

function LockedBanner() {
  return (
    <div className={cssClass({ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 12, marginBottom: 20 })}>
      <Lock size={20} className={cssClass({ color: "#94a3b8", flexShrink: 0 })} />
      <div>
        <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 600, color: "#64748b" })}>IT Declaration cycle is not active</p>
        <p className={cssClass({ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" })}>Admin must open the declaration window before you can submit.</p>
      </div>
    </div>
  );
}

export default React.memo(LockedBanner);
