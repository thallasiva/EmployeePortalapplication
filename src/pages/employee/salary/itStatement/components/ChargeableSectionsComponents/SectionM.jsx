import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { tbl } from "./shared";
const SectionM = React.memo(function SectionM({
  open,
  onToggle,
  isNew,
  ch8Ded
}) {
  const label = isNew ? "M. Deduction Under Chapter VIII (Not applicable under New Regime)" : "M. Deduction Under Chapter VI-A (80C, 80D, etc.)";
  return <>
      <SecHdr label={label} amount={ch8Ded} expanded={open} onToggle={onToggle} />
      {open && (isNew ? <div className={cssClass({
      padding: "12px 14px",
      background: "#fffbeb",
      borderBottom: "1px solid #e2e8f0",
      fontSize: 12,
      color: "#92400e"
    })}>
            Chapter VIII deductions are <strong>not applicable</strong> under the New Tax Regime (IT Act 2025). Switch to Old Tax Regime to claim 80C, 80D and other deductions.
          </div> : <div className={cssClass({
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
        })}>Section</span>
              <span className={cssClass({
          fontSize: 11,
          fontWeight: 700,
          color: "#475569"
        })}>Amount</span>
            </div>
            <div className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #f1f5f9"
      })}>
              <span className={cssClass({
          fontSize: 12,
          color: "#475569"
        })}>Section 80C — Provident Fund (capped ₹1,50,000)</span>
              <span className={cssClass({
          fontSize: 12,
          color: "#334155"
        })}>{tbl(ch8Ded)}</span>
            </div>
            <div className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 14px",
        background: "#f8fafc"
      })}>
              <span className={cssClass({
          fontSize: 12,
          fontWeight: 700,
          color: "#1e293b"
        })}>Total</span>
              <span className={cssClass({
          fontSize: 12,
          fontWeight: 700,
          color: "#1e293b"
        })}>{tbl(ch8Ded)}</span>
            </div>
          </div>)}
    </>;
});
export { SectionM };
