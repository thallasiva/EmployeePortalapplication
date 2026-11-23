import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { KpiCard } from "./KpiCard";
const KpiCards = React.memo(function KpiCards({
  isNew,
  stdDed,
  ch8Ded,
  totalTax,
  monthlyTDS
}) {
  return <div className={cssClass({
    display: "flex",
    gap: 10,
    marginBottom: 16
  })}>
      <KpiCard label="Tax Calculated As Per" value={isNew ? "NEW TAX REGIME" : "OLD TAX REGIME"} isLabel green={isNew} orange={!isNew} />
      <KpiCard label="Standard Deduction" value={stdDed} />
      <KpiCard label={isNew ? "Chapter VIII Deduction" : "Chapter VI-A Deduction (80C PF)"} value={ch8Ded} />
      <KpiCard label="Net Tax In ₹" value={totalTax} />
      <KpiCard label="Tax Deductible Per Month In ₹" value={monthlyTDS} />
    </div>;
});
export { KpiCards };
