import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { TH, TSS, TN } from "../constants";

export const ColHead = React.memo(function ColHead({ fiscalMonths }) {
  return (
    <thead>
      <tr>
        <th className={cssClass({ ...TH, textAlign: "left", position: "sticky", left: 0, zIndex: 2, minWidth: 160, borderRight: "1px solid #d5dbe3" })}>Items</th>
        <th className={cssClass({ ...TH, textAlign: "right", position: "sticky", left: 160, zIndex: 2, minWidth: 110, borderRight: "1px solid #d5dbe3" })}>Total</th>
        {fiscalMonths.map((c) => (
          <th key={c.key} className={cssClass({ ...TH, textAlign: "right", minWidth: 90 })}>{c.label}</th>
        ))}
      </tr>
    </thead>
  );
});

export const SecHdr = React.memo(function SecHdr({ label, amount, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 14px", background: "#e8f4fa", borderBottom: "1px solid #d5dbe3",
        cursor: onToggle ? "pointer" : "default", userSelect: "none",
      })}
    >
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
        <span className={cssClass({ fontSize: 13, color: "#475569", lineHeight: 1 })}>{onToggle ? (expanded ? "−" : "+") : ""}</span>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{label}</span>
      </div>
      {amount != null && (
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>
          {"₹"}{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
    </div>
  );
});

export const CalcRow = React.memo(function CalcRow({ label, amount }) {
  return (
    <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "#d6e4f0", borderBottom: "1px solid #d5dbe3" })}>
      <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>{label}</span>
      <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#1e293b" })}>
        {"₹"}{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
});

export const NoData = React.memo(function NoData() {
  return (
    <div className={cssClass({ padding: "20px 14px", textAlign: "center", color: "#f18200", fontSize: 12, fontWeight: 600, background: "#fff", borderBottom: "1px solid #e2e8f0" })}>
      No data to display !!!
    </div>
  );
});
