import React from "react";

const InfoChip = React.memo(function InfoChip({ icon: Icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "#f8fafc",
          border: "1px solid #e8eef5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} color="#94a3b8" />
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
});

export default InfoChip;
