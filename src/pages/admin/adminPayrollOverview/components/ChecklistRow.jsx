import React from "react";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

// Small reusable check row used by health & process-overview cards.
export default function ChecklistRow({ label, ok, warn = false, note }) {
  const color = warn ? "#d97706" : ok ? "#16a34a" : "#cbd5e1";
  const Icon = warn ? AlertTriangle : ok ? CheckCircle2 : Circle;
  return (
    <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" })}>
      <Icon size={16} color={color} />
      <span className={cssClass({ fontSize: 12.5, fontWeight: 600, color: "#344054", flex: 1 })}>{label}</span>
      {note != null && <span className={cssClass({ fontSize: 12, fontWeight: 800, color })}>{note}</span>}
    </div>
  );
}
