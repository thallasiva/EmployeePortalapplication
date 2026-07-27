import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const StatCard = React.memo(function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "18px 20px", display: "flex", alignItems: "center", gap: 16,
      flex: 1, minWidth: 160,
    })}>
      <div className={cssClass({
        width: 44, height: 44, borderRadius: 10, background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      })}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className={cssClass({ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 })}>
          {value ?? "—"}
        </div>
        <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 3 })}>{label}</div>
        {sub && (
          <div className={cssClass({ fontSize: 11, color: color, marginTop: 2, fontWeight: 600 })}>{sub}</div>
        )}
      </div>
    </div>
  );
});

export default StatCard;
