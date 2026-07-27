import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { SecHdr } from "./TablePrimitives";

const tbl = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Section F — HRA Exemption */
export const SectionF = React.memo(function SectionF({ open, onToggle, hraExemption, T, showHRA, setShowHRA }) {
  return (
    <>
      <SecHdr label="F. Exemption Under Section 11" amount={hraExemption} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Items</span>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Exemption</span>
          </div>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", borderBottom: "1px solid #f1f5f9" })}>
            <span className={cssClass({ fontSize: 12, color: "#475569" })}>HOUSE RENT ALLOWANCE : Section 11 (Sch III (11))</span>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 20 })}>
              <button type="button" onClick={() => setShowHRA(!showHRA)} className={cssClass({ fontSize: 11, color: "#1e6b9e", background: "none", border: "none", cursor: "pointer", fontWeight: 600 })}>
                {showHRA ? "Hide HRA Details" : "Show HRA Details"}
              </button>
              <span className={cssClass({ fontSize: 12, color: "#334155", minWidth: 60, textAlign: "right" })}>{tbl(hraExemption)}</span>
            </div>
          </div>
          {showHRA && [
            { label: "TOTAL RENT PAID P.A.", value: 0 },
            { label: "HRA RECEIVED", value: T.hra, hi: true },
            { label: "60% OF BASIC", value: T.basic * 0.6 },
            { label: "RENT PAID - 10% (BASIC)", value: 0 },
          ].map(({ label, value, hi }) => (
            <div key={label} className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px 7px 28px", borderBottom: "1px solid #f1f5f9" })}>
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>{label}</span>
              <span className={cssClass({ fontSize: 12, fontWeight: 500, color: hi ? "#f18200" : "#334155", minWidth: 60, textAlign: "right" })}>{tbl(value)}</span>
            </div>
          ))}
          <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#f8fafc" })}>
            <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>Total</span>
            <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{tbl(hraExemption)}</span>
          </div>
        </div>
      )}
    </>
  );
});

/** Section G — Income from Previous Employer */
export const SectionG = React.memo(function SectionG({ open, onToggle, prevEmployerInc }) {
  const rows = ["TOTAL INCOME", "INCOME TAX", "PROFESSIONAL TAX", "PROVIDENT FUND"];
  return (
    <>
      <SecHdr label="G. Income From Previous Employer" amount={prevEmployerInc} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Items</span>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Amount</span>
          </div>
          {rows.map((label) => (
            <div key={label} className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", borderBottom: "1px solid #f1f5f9" })}>
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>{label}</span>
              <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>{tbl(0)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
});
