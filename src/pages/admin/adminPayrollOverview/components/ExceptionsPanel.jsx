import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Card from "./Card";
import { cssClass } from "../../../../utils/classStyles";

export default function ExceptionsPanel({ items = [], total = 0, onViewAll }) {
  return (
    <Card
      title="Payroll Exceptions"
      icon={<AlertTriangle size={16} color="#dc2626" />}
      right={<button onClick={onViewAll} className={cssClass({ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" })}>View All Issues <ChevronRight size={13} /></button>}
    >
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 9, padding: "9px 12px", marginBottom: 12 })}>
        <AlertTriangle size={15} color="#dc2626" />
        <span className={cssClass({ fontSize: 12.5, fontWeight: 700, color: "#b91c1c" })}>{total} {total === 1 ? "employee requires" : "employees require"} attention</span>
      </div>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 })}>
        {items.map((x) => (
          <div key={x.key || x.label} className={cssClass({ border: "1px solid #f2f4f7", borderRadius: 10, padding: "10px 12px" })}>
            <div className={cssClass({ fontSize: 22, fontWeight: 900, color: x.count > 0 ? x.color : "#16a34a" })}>{x.count}</div>
            <div className={cssClass({ fontSize: 11.5, fontWeight: 600, color: "#667085", marginTop: 2 })}>{x.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
