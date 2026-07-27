import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const POICard = React.memo(function POICard() {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 })}>POI</div>
      <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" })}>
        <FileText size={36} color="#cbd5e1" className={cssClass({ marginBottom: 10 })} />
        <p className={cssClass({ fontSize: 13, color: "#64748b", textAlign: "center", margin: "0 0 14px" })}>
          Submit Proof of Investments once the window is released.
        </p>
        <Link
          to="/employee/payroll/proof-investment"
          className={cssClass({
            padding: "8px 24px", border: "1px solid #f18200", borderRadius: 8,
            color: "#f18200", fontWeight: 600, fontSize: 13, textDecoration: "none",
          })}
        >
          Track
        </Link>
      </div>
    </div>
  );
});

export default POICard;
