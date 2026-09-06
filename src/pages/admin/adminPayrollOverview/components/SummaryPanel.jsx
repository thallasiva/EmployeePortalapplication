import React from "react";
import { BarChart3 } from "lucide-react";
import Card from "./Card";
import { cssClass } from "../../../../utils/classStyles";

export default function SummaryPanel({ employees = 0, eligible = 0, excluded = 0 }) {
  const cell = (label, value, color) => (
    <div className={cssClass({ flex: 1, textAlign: "center" })}>
      <div className={cssClass({ fontSize: 26, fontWeight: 900, color })}>{value}</div>
      <div className={cssClass({ fontSize: 11.5, fontWeight: 600, color: "#98a2b3", marginTop: 2 })}>{label}</div>
    </div>
  );
  return (
    <Card title="Payroll Summary" icon={<BarChart3 size={16} color="#6366f1" />}>
      <div className={cssClass({ display: "flex", alignItems: "center" })}>
        {cell("Employees", employees, "#111827")}
        {cell("Eligible for Payroll", eligible, "#16a34a")}
        {cell("Excluded", excluded, "#dc2626")}
      </div>
    </Card>
  );
}
