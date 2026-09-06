import React from "react";
import { cssClass } from "../../../../utils/classStyles";

// Generic white card with an optional header (icon + title + subtitle + right slot).
export default function Card({ title, subtitle, icon, right, children, pad = 18, style = {} }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #eef0f3", borderRadius: 14,
      boxShadow: "0 1px 2px rgba(16,24,40,.04)", ...style,
    })}>
      {(title || right) && (
        <div className={cssClass({
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, padding: "13px 16px", borderBottom: "1px solid #f2f4f7",
        })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 9 })}>
            {icon}
            <div>
              <div className={cssClass({ fontSize: 14, fontWeight: 800, color: "#111827" })}>{title}</div>
              {subtitle && <div className={cssClass({ fontSize: 11.5, color: "#98a2b3", marginTop: 1 })}>{subtitle}</div>}
            </div>
          </div>
          {right}
        </div>
      )}
      <div className={cssClass({ padding: pad })}>{children}</div>
    </div>
  );
}
