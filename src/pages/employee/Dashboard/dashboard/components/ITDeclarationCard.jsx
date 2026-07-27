import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const ITDeclarationCard = React.memo(function ITDeclarationCard() {
  return (
    <div className={cssClass({
      background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: 20, borderLeft: "4px solid #f18200",
    })}>
      <div className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 10 })}>IT Declaration</div>
      <div className={cssClass({ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 })}>
        <AlertCircle size={18} color="#f18200" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
        <p className={cssClass({ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 })}>
          Submit your IT declaration before the window closes to ensure correct TDS deduction.
        </p>
      </div>
      <Link
        to="/employee/payroll/it-declaration"
        className={cssClass({
          display: "block", textAlign: "center", padding: "9px 0",
          border: "1px solid #f18200", borderRadius: 8, color: "#f18200",
          fontWeight: 600, fontSize: 13, textDecoration: "none",
        })}
      >
        Declare Now
      </Link>
    </div>
  );
});

export default ITDeclarationCard;
