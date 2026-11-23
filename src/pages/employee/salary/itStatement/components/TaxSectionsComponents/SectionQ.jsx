import React from "react";
import { SecHdr } from ".././TablePrimitives";
import { FourColTable } from ".././FourColTable";
/** Section O — Annual Tax */

const SectionQ = React.memo(function SectionQ({
  open,
  onToggle,
  remaining,
  rawTax,
  cess
}) {
  return <>
      <SecHdr label="Q. Balance Payable" amount={remaining} expanded={open} onToggle={onToggle} />
      {open && <FourColTable rows={[{
      label: "",
      raw: rawTax,
      surcharge: 0,
      cess,
      total: remaining
    }]} />}
    </>;
});
export { SectionQ };
