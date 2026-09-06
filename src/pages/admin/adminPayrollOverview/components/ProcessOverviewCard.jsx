import React from "react";
import { PieChart } from "lucide-react";
import Card from "./Card";
import Donut from "./Donut";
import ChecklistRow from "./ChecklistRow";

export default function ProcessOverviewCard({ steps = [] }) {
  const done = steps.filter((s) => s.status === "done").length;
  const total = steps.length || 1;
  const percent = Math.round((done / total) * 100);
  return (
    <Card title="Payroll Process Overview" icon={<PieChart size={16} color="#2563eb" />}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Donut percent={percent} color="#2563eb" center={`${done}/${total}`} sub="Completed" />
        <div style={{ flex: 1 }}>
          {steps.map((s) => (
            <ChecklistRow key={s.label} label={s.label} ok={s.status === "done"} note={s.status === "done" ? "Completed" : s.status === "current" ? "Pending" : "Pending"} />
          ))}
        </div>
      </div>
    </Card>
  );
}
