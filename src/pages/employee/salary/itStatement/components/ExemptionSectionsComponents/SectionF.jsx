import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { tbl } from "./shared";
const SectionF = React.memo(function SectionF({
  open,
  onToggle,
  hraExemption,
  T,
  showHRA,
  setShowHRA
}) {
  return <>
      <SecHdr label="F. Exemption Under Section 11" amount={hraExemption} expanded={open} onToggle={onToggle} />
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
        })}>Exemption</span>
          </div>
          <div className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 14px",
        borderBottom: "1px solid #f1f5f9"
      })}>
            <span className={cssClass({
          fontSize: 12,
          color: "#475569"
        })}>HOUSE RENT ALLOWANCE : Section 11 (Sch III (11))</span>
            <div className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 20
        })}>
              <button type="button" onClick={() => setShowHRA(!showHRA)} className={cssClass({
            fontSize: 11,
            color: "#cf6900",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          })}>
                {showHRA ? "Hide HRA Details" : "Show HRA Details"}
              </button>
              <span className={cssClass({
            fontSize: 12,
            color: "#334155",
            minWidth: 60,
            textAlign: "right"
          })}>{tbl(hraExemption)}</span>
            </div>
          </div>
          {showHRA && [{
        label: "TOTAL RENT PAID P.A.",
        value: 0
      }, {
        label: "HRA RECEIVED",
        value: T.hra,
        hi: true
      }, {
        label: "60% OF BASIC",
        value: T.basic * 0.6
      }, {
        label: "RENT PAID - 10% (BASIC)",
        value: 0
      }].map(({
        label,
        value,
        hi
      }) => <div key={label} className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 14px 7px 28px",
        borderBottom: "1px solid #f1f5f9"
      })}>
              <span className={cssClass({
          fontSize: 12,
          color: "#475569"
        })}>{label}</span>
              <span className={cssClass({
          fontSize: 12,
          fontWeight: 500,
          color: hi ? "#e87500" : "#334155",
          minWidth: 60,
          textAlign: "right"
        })}>{tbl(value)}</span>
            </div>)}
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
        })}>{tbl(hraExemption)}</span>
          </div>
        </div>}
    </>;
});
export { SectionF };
