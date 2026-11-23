import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { tbl } from "./shared";
const SectionG = React.memo(function SectionG({
  open,
  onToggle,
  prevEmployerInc
}) {
  const rows = ["TOTAL INCOME", "INCOME TAX", "PROFESSIONAL TAX", "PROVIDENT FUND"];
  return <>
      <SecHdr label="G. Income From Previous Employer" amount={prevEmployerInc} expanded={open} onToggle={onToggle} />
      {open && <div className={cssClass({
      background: "#fff",
      borderBottom: "1px solid #e2e8f0"
    })}>
          <div className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 14px",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0"
      })}>
            <span className={cssClass({
          fontSize: 11,
          fontWeight: 700,
          color: "#475569"
        })}>Items</span>
            <span className={cssClass({
          fontSize: 11,
          fontWeight: 700,
          color: "#475569"
        })}>Amount</span>
          </div>
          {rows.map(label => <div key={label} className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #f1f5f9"
      })}>
              <span className={cssClass({
          fontSize: 12,
          color: "#475569"
        })}>{label}</span>
              <span className={cssClass({
          fontSize: 12,
          color: "#94a3b8"
        })}>{tbl(0)}</span>
            </div>)}
        </div>}
    </>;
});
export { SectionG };
