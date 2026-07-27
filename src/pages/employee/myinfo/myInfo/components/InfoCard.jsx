import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const InfoCard = React.memo(function InfoCard({ id, title, children, defaultOpen = true, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: open ? "1px solid #f1f5f9" : "none" })}>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#475569", textTransform: "uppercase" })}>{title}</span>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          {action}
          <button onClick={() => setOpen((v) => !v)} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" })}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {open && <div className={cssClass({ padding: "16px 20px" })}>{children}</div>}
    </div>
  );
});

export default InfoCard;
