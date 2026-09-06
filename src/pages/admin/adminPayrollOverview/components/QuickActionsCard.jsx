import React from "react";
import { Zap } from "lucide-react";
import Card from "./Card";
import { cssClass } from "../../../../utils/classStyles";

// actions = [{ label, icon, onClick, primary, disabled }]
export default function QuickActionsCard({ actions = [] }) {
  return (
    <Card title="Quick Actions" icon={<Zap size={16} color="#f18200" />}>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} disabled={a.disabled}
            className={cssClass({
              display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 9, cursor: a.disabled ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 700, opacity: a.disabled ? 0.55 : 1,
              background: a.primary ? "#2563eb" : "#f8fafc", color: a.primary ? "#fff" : "#344054",
              border: a.primary ? "none" : "1px solid #eef0f3",
            })}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
