import React from "react";
import { SecHdr } from ".././TablePrimitives";
import { FourColTable, SlabInfoPanel } from ".././FourColTable";
/** Section O — Annual Tax */
const SectionO = React.memo(function SectionO({
  open,
  onToggle,
  totalTax,
  regime,
  taxableIncome,
  rawTax,
  cess
}) {
  return <>
      <SecHdr label="O. Annual Tax" amount={totalTax} expanded={open} onToggle={onToggle} />
      {open && <>
          <SlabInfoPanel regime={regime} taxableIncome={taxableIncome} />
          <FourColTable rows={[{
        label: "Total Annual Tax",
        raw: rawTax,
        surcharge: 0,
        cess,
        total: totalTax,
        bold: true
      }]} />
        </>}
    </>;
});
export { SectionO };
