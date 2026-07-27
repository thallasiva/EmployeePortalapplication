import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { SecHdr } from "./TablePrimitives";
import { FourColTable, SlabInfoPanel } from "./FourColTable";

/** Section O — Annual Tax */
export const SectionO = React.memo(function SectionO({ open, onToggle, totalTax, regime, taxableIncome, rawTax, cess }) {
  return (
    <>
      <SecHdr label="O. Annual Tax" amount={totalTax} expanded={open} onToggle={onToggle} />
      {open && (
        <>
          <SlabInfoPanel regime={regime} taxableIncome={taxableIncome} />
          <FourColTable rows={[{ label: "Total Annual Tax", raw: rawTax, surcharge: 0, cess, total: totalTax, bold: true }]} />
        </>
      )}
    </>
  );
});

/** Section P — Tax Paid Till Date */
export const SectionP = React.memo(function SectionP({ open, onToggle, taxPaid }) {
  return (
    <>
      <SecHdr label="P. Tax Paid Till Date" amount={taxPaid} expanded={open} onToggle={onToggle} />
      {open && (
        <FourColTable
          rows={[
            { label: "Deduction (through Payroll)", raw: 0, surcharge: 0, cess: 0, total: 0 },
            { label: "Direct TDS", raw: 0, surcharge: 0, cess: 0, total: 0 },
            { label: "Previous Employment", raw: 0, surcharge: 0, cess: 0, total: 0 },
            { label: "Total", raw: 0, surcharge: 0, cess: 0, total: 0, bold: true },
          ]}
        />
      )}
    </>
  );
});

/** Section Q — Balance Payable */
export const SectionQ = React.memo(function SectionQ({ open, onToggle, remaining, rawTax, cess }) {
  return (
    <>
      <SecHdr label="Q. Balance Payable" amount={remaining} expanded={open} onToggle={onToggle} />
      {open && <FourColTable rows={[{ label: "", raw: rawTax, surcharge: 0, cess, total: remaining }]} />}
    </>
  );
});

/** Section R — TDS Recovered in Current Month */
export const SectionR = React.memo(function SectionR({ open, onToggle, monthlyTDS, monthlyRaw, monthlyCess }) {
  return (
    <>
      <SecHdr label="R. TDS Recovered in Current Month" amount={monthlyTDS} expanded={open} onToggle={onToggle} />
      {open && (
        <>
          <div className={cssClass({ padding: "6px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#64748b" })}>(i) Monthly Tax</span>
          </div>
          <FourColTable rows={[{ label: "", raw: monthlyRaw, surcharge: 0, cess: monthlyCess, total: monthlyTDS }]} />
        </>
      )}
    </>
  );
});
