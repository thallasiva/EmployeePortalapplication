import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmt } from "../utils/formatters";

const SalRow = React.memo(function SalRow({ label, value, show, color, bold }) {
  return (
    <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc" })}>
      <span className={cssClass({ fontSize: 13, color: "#64748b" })}>{label}</span>
      <span className={cssClass({ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || "#1e293b", letterSpacing: show ? 0 : "0.12em" })}>
        {show ? `₹${fmt(value)}` : "•••••"}
      </span>
    </div>
  );
});

const SalaryComponentsCard = React.memo(function SalaryComponentsCard({ sal, showSal, setShowSal }) {
  const earnings = [
    { label: "Basic", value: sal.basic },
    { label: "HRA", value: sal.hra },
    { label: "Special Allowance", value: sal.special },
    { label: "LTA", value: sal.lta },
    { label: "Telephone", value: sal.telephone },
    { label: "Conveyance", value: sal.conveyance },
    { label: "Medical", value: sal.medical },
  ].filter((r) => r.value > 0);

  const deductions = [
    { label: "Provident Fund", value: sal.pf },
    { label: "Professional Tax", value: sal.profTax },
  ].filter((r) => r.value > 0);

  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 })}>
        <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Salary Components</span>
        <button
          onClick={() => setShowSal((v) => !v)}
          className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#f18200", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 })}
        >
          {showSal ? <EyeOff size={12} /> : <Eye size={12} />}
          {showSal ? "Hide" : "Reveal"}
        </button>
      </div>

      <div className={cssClass({ fontSize: 10, color: "#f18200", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 })}>Earnings</div>
      {earnings.map((r) => (
        <div key={r.label} className={cssClass({ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 })}>
          <span className={cssClass({ color: "#475569" })}>{r.label}</span>
          <span className={cssClass({ color: "#1e293b", fontWeight: 500, letterSpacing: showSal ? 0 : "0.1em" })}>
            {showSal ? `₹${fmt(r.value)}` : "•••"}
          </span>
        </div>
      ))}

      <div className={cssClass({ fontSize: 10, color: "#e11d48", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 10, marginBottom: 6 })}>Deductions</div>
      {deductions.map((r) => (
        <div key={r.label} className={cssClass({ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 })}>
          <span className={cssClass({ color: "#475569" })}>{r.label}</span>
          <span className={cssClass({ color: "#e11d48", fontWeight: 500, letterSpacing: showSal ? 0 : "0.1em" })}>
            {showSal ? `₹${fmt(r.value)}` : "•••"}
          </span>
        </div>
      ))}

      <div className={cssClass({ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "2px solid #f1f5f9" })}>
        <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>Net Pay</span>
        <span className={cssClass({ fontSize: 14, fontWeight: 800, color: "#16a34a", letterSpacing: showSal ? 0 : "0.1em" })}>
          {showSal ? `₹${fmt(sal.net)}` : "•••••"}
        </span>
      </div>
    </div>
  );
});

export default SalaryComponentsCard;
