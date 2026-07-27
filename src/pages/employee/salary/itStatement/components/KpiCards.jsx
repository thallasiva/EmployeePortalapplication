import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const tbl = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const KpiCard = React.memo(function KpiCard({ label, value, isLabel, green, orange }) {
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #d5dbe3", borderRadius: 6, padding: "10px 16px", flex: 1, minWidth: 0 })}>
      <div className={cssClass({ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 6 })}>{label}</div>
      {isLabel
        ? <div className={cssClass({ fontSize: 13, fontWeight: 700, color: green ? "#16a34a" : orange ? "#f18200" : "#1e293b" })}>{value}</div>
        : <div className={cssClass({ fontSize: 16, fontWeight: 800, color: "#1e293b" })}>{tbl(value)}</div>
      }
    </div>
  );
});

const KpiCards = React.memo(function KpiCards({ isNew, stdDed, ch8Ded, totalTax, monthlyTDS }) {
  return (
    <div className={cssClass({ display: "flex", gap: 10, marginBottom: 16 })}>
      <KpiCard label="Tax Calculated As Per" value={isNew ? "NEW TAX REGIME" : "OLD TAX REGIME"} isLabel green={isNew} orange={!isNew} />
      <KpiCard label="Standard Deduction" value={stdDed} />
      <KpiCard label={isNew ? "Chapter VIII Deduction" : "Chapter VI-A Deduction (80C PF)"} value={ch8Ded} />
      <KpiCard label="Net Tax In ₹" value={totalTax} />
      <KpiCard label="Tax Deductible Per Month In ₹" value={monthlyTDS} />
    </div>
  );
});

export default KpiCards;
