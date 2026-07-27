import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { TH } from "../constants";

const tbl = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const FourColTable = React.memo(function FourColTable({ rows }) {
  return (
    <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
      <thead>
        <tr className={cssClass({ background: "#e8f4fa" })}>
          <th className={cssClass({ ...TH, textAlign: "left", minWidth: 180 })}>Items</th>
          <th className={cssClass({ ...TH, textAlign: "right", minWidth: 120 })}>Raw Tax</th>
          <th className={cssClass({ ...TH, textAlign: "right", minWidth: 100 })}>Surcharge</th>
          <th className={cssClass({ ...TH, textAlign: "right", minWidth: 140 })}>Health &amp; Edu Cess</th>
          <th className={cssClass({ ...TH, textAlign: "right", minWidth: 120 })}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={cssClass({ background: r.bold ? "#e8f4fa" : "#fff", borderBottom: "1px solid #f1f5f9" })}>
            <td className={cssClass({ padding: "7px 12px", fontSize: 12, color: "#475569", fontWeight: r.bold ? 700 : 400 })}>{r.label}</td>
            <td className={cssClass({ padding: "7px 12px", textAlign: "right", fontSize: 12, fontWeight: r.bold ? 700 : 400, color: "#334155" })}>{tbl(r.raw)}</td>
            <td className={cssClass({ padding: "7px 12px", textAlign: "right", fontSize: 12, fontWeight: r.bold ? 700 : 400, color: "#334155" })}>{tbl(r.surcharge)}</td>
            <td className={cssClass({ padding: "7px 12px", textAlign: "right", fontSize: 12, fontWeight: r.bold ? 700 : 400, color: "#334155" })}>{tbl(r.cess)}</td>
            <td className={cssClass({ padding: "7px 12px", textAlign: "right", fontSize: 12, fontWeight: r.bold ? 700 : 400, color: r.bold ? "#f18200" : "#334155" })}>{tbl(r.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export const SlabInfoPanel = React.memo(function SlabInfoPanel({ regime, taxableIncome }) {
  const slabData = regime === "new"
    ? [
        { range: "Up to ₹4,00,000", rate: "0%", from: 0, to: 400000 },
        { range: "₹4,00,001 – ₹8,00,000", rate: "5%", from: 400000, to: 800000 },
        { range: "₹8,00,001 – ₹12,00,000", rate: "10%", from: 800000, to: 1200000 },
        { range: "₹12,00,001 – ₹16,00,000", rate: "15%", from: 1200000, to: 1600000 },
        { range: "₹16,00,001 – ₹20,00,000", rate: "20%", from: 1600000, to: 2000000 },
        { range: "Above ₹20,00,000", rate: "30%", from: 2000000, to: Infinity },
      ]
    : [
        { range: "Up to ₹2,50,000", rate: "0%", from: 0, to: 250000 },
        { range: "₹2,50,001 – ₹5,00,000", rate: "5%", from: 250000, to: 500000 },
        { range: "₹5,00,001 – ₹10,00,000", rate: "20%", from: 500000, to: 1000000 },
        { range: "Above ₹10,00,000", rate: "30%", from: 1000000, to: Infinity },
      ];

  return (
    <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
      <thead>
        <tr className={cssClass({ background: "#e8f4fa" })}>
          <th className={cssClass({ ...TH, textAlign: "left" })}>Income Slab</th>
          <th className={cssClass({ ...TH, textAlign: "center" })}>Rate</th>
          <th className={cssClass({ ...TH, textAlign: "right" })}>Taxable Amount</th>
          <th className={cssClass({ ...TH, textAlign: "right" })}>Tax</th>
        </tr>
      </thead>
      <tbody>
        {slabData.map(({ range, rate, from, to }) => {
          const taxable = Math.max(0, Math.min(taxableIncome, to) - from);
          const tax = Math.round(taxable * parseFloat(rate) / 100);
          const active = taxable > 0;
          return (
            <tr key={range} className={cssClass({ background: active ? "#fffbeb" : "#fff", borderBottom: "1px solid #f1f5f9" })}>
              <td className={cssClass({ padding: "7px 12px", color: active ? "#1e293b" : "#94a3b8", fontWeight: active ? 600 : 400 })}>{range}</td>
              <td className={cssClass({ padding: "7px 12px", textAlign: "center" })}>
                <span className={cssClass({ fontSize: 11, fontWeight: 700, color: active ? "#f18200" : "#94a3b8", background: active ? "#fff7ed" : "#f8fafc", padding: "2px 8px", borderRadius: 10 })}>{rate}</span>
              </td>
              <td className={cssClass({ padding: "7px 12px", textAlign: "right", color: active ? "#334155" : "#94a3b8" })}>{active ? tbl(taxable) : "—"}</td>
              <td className={cssClass({ padding: "7px 12px", textAlign: "right", color: active ? "#1e293b" : "#94a3b8", fontWeight: active ? 700 : 400 })}>{active ? tbl(tax) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});
