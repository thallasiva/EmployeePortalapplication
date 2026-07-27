import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const TeamsStats = React.memo(function TeamsStats({ totalEmployees, managerCount, visibleCount }) {
  const stats = [
    { label: "Total Employees", value: totalEmployees, color: "#f18200" },
    { label: "Reporting Managers", value: managerCount, color: "#6366f1" },
    { label: "Teams Visible", value: visibleCount, color: "#10b981" },
  ];

  return (
    <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap" })}>
      {stats.map((s) => (
        <div
          key={s.label}
          className={cssClass({
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "10px 20px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            minWidth: 140,
          })}
        >
          <div className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color })}>{s.value}</div>
          <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>{s.label}</div>
        </div>
      ))}
    </div>
  );
});

export default TeamsStats;
