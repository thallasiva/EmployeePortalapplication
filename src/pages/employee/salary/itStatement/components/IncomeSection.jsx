import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { TSS, TN } from "../constants";
import { ColHead, SecHdr, NoData } from "./TablePrimitives";

const tbl = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INCOME_ROWS = [
  { key: "basic", label: "Basic" },
  { key: "hra", label: "HRA" },
  { key: "special", label: "Special Allowance" },
  { key: "lta", label: "Lta" },
  { key: "telephone", label: "Telephone And Internet Expenses" },
];

const DED_ROWS = [
  { key: "pf", label: "PF" },
  { key: "profTax", label: "Prof Tax" },
];

/** Section A — Income */
export const SectionA = React.memo(function SectionA({ open, onToggle, fiscalMonths, monthData, T }) {
  return (
    <>
      <SecHdr label="A. Income" amount={T.gross} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ overflowX: "auto" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
            <ColHead fiscalMonths={fiscalMonths} />
            <tbody>
              <tr className={cssClass({ background: "#f8fafc" })}>
                <td colSpan={fiscalMonths.length + 2} className={cssClass({ padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" })}>{"▾"} Monthly Income</td>
              </tr>
              {INCOME_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td className={cssClass(TSS(0, false))}>{label}</td>
                  <td className={cssClass({ ...TSS(160, false), textAlign: "right" })}>{tbl(T[key])}</td>
                  {monthData.map((m, i) => <td key={i} className={cssClass({ ...TN(false), color: m[key] > 0 ? "#334155" : "#94a3b8" })}>{tbl(m[key])}</td>)}
                </tr>
              ))}
              <tr className={cssClass({ background: "#e8f4fa" })}>
                <td className={cssClass({ ...TSS(0, true), background: "#e8f4fa" })}>Sub Total</td>
                <td className={cssClass({ ...TSS(160, true), background: "#e8f4fa", textAlign: "right" })}>{tbl(T.gross)}</td>
                {monthData.map((m, i) => <td key={i} className={cssClass({ ...TN(true), color: m.gross > 0 ? "#1e293b" : "#94a3b8" })}>{tbl(m.gross)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});

/** Section B — Deductions */
export const SectionB = React.memo(function SectionB({ open, onToggle, fiscalMonths, monthData, T }) {
  return (
    <>
      <SecHdr label="B. Deductions" amount={T.pf + T.profTax} expanded={open} onToggle={onToggle} />
      {open && (
        <div className={cssClass({ overflowX: "auto" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
            <ColHead fiscalMonths={fiscalMonths} />
            <tbody>
              <tr className={cssClass({ background: "#f8fafc" })}>
                <td colSpan={fiscalMonths.length + 2} className={cssClass({ padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" })}>{"▾"} (Blanks)</td>
              </tr>
              {DED_ROWS.map(({ key, label }) => (
                <tr key={key}>
                  <td className={cssClass(TSS(0, false))}>{label}</td>
                  <td className={cssClass({ ...TSS(160, false), textAlign: "right" })}>{tbl(T[key])}</td>
                  {monthData.map((m, i) => <td key={i} className={cssClass({ ...TN(false), color: m[key] > 0 ? "#334155" : "#94a3b8" })}>{tbl(m[key])}</td>)}
                </tr>
              ))}
              <tr className={cssClass({ background: "#e8f4fa" })}>
                <td className={cssClass({ ...TSS(0, true), background: "#e8f4fa" })}>Total</td>
                <td className={cssClass({ ...TSS(160, true), background: "#e8f4fa", textAlign: "right" })}>{tbl(T.pf + T.profTax)}</td>
                {monthData.map((m, i) => <td key={i} className={cssClass({ ...TN(true), color: m.pf + m.profTax > 0 ? "#1e293b" : "#94a3b8" })}>{tbl((m.pf || 0) + (m.profTax || 0))}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});

/** Sections C & D — zero-data sections */
export const SectionC = React.memo(function SectionC({ open, onToggle }) {
  return (
    <>
      <SecHdr label="C. Perquisites" amount={0} expanded={open} onToggle={onToggle} />
      {open && <NoData />}
    </>
  );
});

export const SectionD = React.memo(function SectionD({ open, onToggle }) {
  return (
    <>
      <SecHdr label="D. Income Excluded From Tax" amount={0} expanded={open} onToggle={onToggle} />
      {open && <NoData />}
    </>
  );
});
