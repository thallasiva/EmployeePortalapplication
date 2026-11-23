import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { tbl } from "./shared";
const SectionI = React.memo(function SectionI({
  open,
  onToggle,
  isNew,
  stdDed,
  STD_DED
}) {
  const label = isNew ? "I. Less Deduction under Section 19 (Standard Deduction)" : "I. Less Deduction under Section 16 (Standard Deduction)";
  const rows = [{
    label: isNew ? "TAX ON EMPLOYMENT - Section 19(1)(1)" : "TAX ON EMPLOYMENT - Section 16(b)(iii)",
    value: 0
  }, {
    label: isNew ? "STANDARD DEDUCTION - Section 19(1)(2) (₹75,000)" : "STANDARD DEDUCTION - Section 16(1)(2) (₹50,000)",
    value: STD_DED
  }];
  return <>
      <SecHdr label={label} amount={stdDed} expanded={open} onToggle={onToggle} />
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
          {rows.map(({
        label: rowLabel,
        value
      }) => <div key={rowLabel} className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #f1f5f9"
      })}>
              <span className={cssClass({
          fontSize: 12,
          color: "#475569"
        })}>{rowLabel}</span>
              <span className={cssClass({
          fontSize: 12,
          color: value > 0 ? "#334155" : "#94a3b8"
        })}>{tbl(value)}</span>
            </div>)}
        </div>}
    </>;
});
export { SectionI };
