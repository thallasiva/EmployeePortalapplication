import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { FourColTable } from ".././FourColTable";
/** Section O — Annual Tax */

const SectionR = React.memo(function SectionR({
  open,
  onToggle,
  monthlyTDS,
  monthlyRaw,
  monthlyCess
}) {
  return <>
      <SecHdr label="R. TDS Recovered in Current Month" amount={monthlyTDS} expanded={open} onToggle={onToggle} />
      {open && <>
          <div className={cssClass({
        padding: "6px 14px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0"
      })}>
            <span className={cssClass({
          fontSize: 11,
          fontWeight: 700,
          color: "#64748b"
        })}>(i) Monthly Tax</span>
          </div>
          <FourColTable rows={[{
        label: "",
        raw: monthlyRaw,
        surcharge: 0,
        cess: monthlyCess,
        total: monthlyTDS
      }]} />
        </>}
    </>;
});
export { SectionR };
