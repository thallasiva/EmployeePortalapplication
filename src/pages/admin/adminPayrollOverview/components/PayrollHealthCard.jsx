import React from "react";
import { Activity } from "lucide-react";
import Card from "./Card";
import Donut from "./Donut";
import ChecklistRow from "./ChecklistRow";

export default function PayrollHealthCard({ percent, checks = [], exceptionsTotal = 0 }) {
  const color = percent >= 80 ? "#16a34a" : percent >= 50 ? "#f18200" : "#dc2626";
  return (
    <Card title="Payroll Health" icon={<Activity size={16} color="#16a34a" />}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Donut percent={percent} color={color} center={`${percent}%`} sub="Ready" />
        <div style={{ flex: 1 }}>
          {checks.map((c) => <ChecklistRow key={c.label} label={c.label} ok={c.ok} />)}
          <ChecklistRow label={`${exceptionsTotal} Exceptions`} warn={exceptionsTotal > 0} ok={exceptionsTotal === 0} />
        </div>
      </div>
    </Card>
  );
}
