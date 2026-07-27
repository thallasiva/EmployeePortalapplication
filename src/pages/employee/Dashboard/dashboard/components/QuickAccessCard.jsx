import React from "react";
import { Link } from "react-router-dom";
import { cssClass } from "../../../../../utils/classStyles";
import { QUICK_LINKS } from "../constants";

const QuickAccessCard = React.memo(function QuickAccessCard() {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>Quick Access</div>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cssClass({
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", background: "#fff8f0", borderRadius: 8, border: "1px solid #fde8c8",
              color: "#f18200", fontWeight: 600, fontSize: 13, textDecoration: "none",
            })}
          >
            {item.label}
            <span>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
});

export default QuickAccessCard;
