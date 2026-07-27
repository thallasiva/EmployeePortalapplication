import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { dash, mask } from "../utils";

const Field = React.memo(function Field({ label, value, masked, show, onToggle, color }) {
  return (
    <div className={cssClass({ marginBottom: 16 })}>
      <div className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 })}>
        {label}
      </div>
      <div className={cssClass({ fontSize: 13, color: color || "#1e293b", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 })}>
        {masked ? mask(value, show) : dash(value)}
        {masked && value && (
          <button onClick={onToggle} className={cssClass({ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex" })}>
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  );
});

export default Field;
