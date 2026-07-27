import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { SecHdr } from "./TablePrimitives";

const tbl = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Section I — Standard Deduction */
export const SectionI = React.memo(function SectionI({ open, onToggle, isNew, stdDed, STD_DED }) {
  const label = isNew
    ? "I. Less Deduction under Section 19 (Standard Deduction)"
    : "I. Less Deduction under Section 16 (Standard Deduction)";

  const rows = [
    {
      label: isNew
        ? "TAX ON EMPLOYMENT - Section 19(1)(1)"
        : "TAX ON EMPLOYMENT - Section 16(b)(iii)",
      value: 0,
    },
    {
      label: isNew
        ? "STANDARD DEDUCTION - Section 19(1)(2) (₹75,000)"
        : "STANDARD DEDUCTION - Section 16(1)(2) (₹50,000)",
      value: STD_DED,
    },
  ];

  return (
    <>
      <SecHdr label={label} amount={stdDed} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Items</span>
            <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Amount</span>
          </div>
          {rows.map(({ label: rowLabel, value }) => (
            <div key={rowLabel} className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", borderBottom: "1px solid #f1f5f9" })}>
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>{rowLabel}</span>
              <span className={cssClass({ fontSize: 12, color: value > 0 ? "#334155" : "#94a3b8" })}>{tbl(value)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
});

/** Section K — Income from Other Sources */
export const SectionK = React.memo(function SectionK({ open, onToggle, openKi, onToggleKi, openKh, onToggleKh }) {
  return (
    <>
      <SecHdr label="K. Income From Other Sources (Including House Properties)" amount={0} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
          <div onClick={onToggleKi} className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
              {openKi ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>Other Incomes</span>
            </div>
            <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>{tbl(0)}</span>
          </div>
          <div onClick={onToggleKh} className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
              {openKh ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>Income/Loss from house properties</span>
            </div>
            <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>{tbl(0)}</span>
          </div>
        </div>
      )}
    </>
  );
});

/** Section M — Chapter deductions */
export const SectionM = React.memo(function SectionM({ open, onToggle, isNew, ch8Ded }) {
  const label = isNew
    ? "M. Deduction Under Chapter VIII (Not applicable under New Regime)"
    : "M. Deduction Under Chapter VI-A (80C, 80D, etc.)";

  return (
    <>
      <SecHdr label={label} amount={ch8Ded} expanded={open} onToggle={onToggle} />
      {open && (
        isNew ? (
          <div className={cssClass({ padding: "12px 14px", background: "#fffbeb", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#92400e" })}>
            Chapter VIII deductions are <strong>not applicable</strong> under the New Tax Regime (IT Act 2025). Switch to Old Tax Regime to claim 80C, 80D and other deductions.
          </div>
        ) : (
          <div className={cssClass({ background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" })}>
              <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Section</span>
              <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#475569" })}>Amount</span>
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "7px 14px", borderBottom: "1px solid #f1f5f9" })}>
              <span className={cssClass({ fontSize: 12, color: "#475569" })}>Section 80C — Provident Fund (capped ₹1,50,000)</span>
              <span className={cssClass({ fontSize: 12, color: "#334155" })}>{tbl(ch8Ded)}</span>
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#f8fafc" })}>
              <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>Total</span>
              <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{tbl(ch8Ded)}</span>
            </div>
          </div>
        )
      )}
    </>
  );
});
