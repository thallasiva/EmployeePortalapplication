import React from "react";
import { SecHdr } from ".././TablePrimitives";
import { FourColTable } from ".././FourColTable";
/** Section O — Annual Tax */

const SectionP = React.memo(function SectionP({
  open,
  onToggle,
  taxPaid
}) {
  return <>
      <SecHdr label="P. Tax Paid Till Date" amount={taxPaid} expanded={open} onToggle={onToggle} />
      {open && <FourColTable rows={[{
      label: "Deduction (through Payroll)",
      raw: 0,
      surcharge: 0,
      cess: 0,
      total: 0
    }, {
      label: "Direct TDS",
      raw: 0,
      surcharge: 0,
      cess: 0,
      total: 0
    }, {
      label: "Previous Employment",
      raw: 0,
      surcharge: 0,
      cess: 0,
      total: 0
    }, {
      label: "Total",
      raw: 0,
      surcharge: 0,
      cess: 0,
      total: 0,
      bold: true
    }]} />}
    </>;
});
export { SectionP };
