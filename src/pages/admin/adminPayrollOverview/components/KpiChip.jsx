import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const KpiChip = React.memo(function KpiChip({ icon, label, value, accent }) {
  return (
    <div
      className={cssClass({
        background: "#fff", border: "1px solid #f0f0f0", borderRadius: 10,
        padding: "14px 16px", boxShadow: "0 1px 3px #0000000a",
        display: "flex", alignItems: "center", gap: 12,
      })}
    >
      <div
        className={cssClass({
          width: 40, height: 40, borderRadius: 9, flexShrink: 0,
          background: (accent || BRAND) + "15",
          display: "flex", alignItems: "center", justifyContent: "center",
        })}
      >
        {icon}
      </div>
      <div>
        <div className={cssClass({ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4 })}>
          {label}
        </div>
        <div className={cssClass({ fontSize: 18, fontWeight: 800, color: accent || "#111827", lineHeight: 1.2, marginTop: 2 })}>
          {value}
        </div>
      </div>
    </div>
  );
});

export default KpiChip;
