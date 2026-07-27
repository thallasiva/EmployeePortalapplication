import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import { fmtINR, pct } from "../utils";
import MultiDonut from "./MultiDonut";
import ProgressRow from "./ProgressRow";

const PayoutDetailsPanel = React.memo(function PayoutDetailsPanel({ payslips }) {
  let totalBasic = 0, totalHRA = 0, totalAllowances = 0;
  let totalPF = 0, totalESI = 0, totalPT = 0, totalTDS = 0;
  let totalGross = 0, totalNet = 0, totalDeductions = 0;

  payslips.forEach((p) => {
    const basic = Number(p.basic || 0);
    const hra = Number(p.hra || 0);
    const allowances = Number(p.allowances || 0);
    const gross = Number(p.gross_earnings || p.gross || 0);
    const ded = Number(p.deductions || 0);
    const net = Number(p.net_pay || p.net || 0);

    totalBasic += basic;
    totalHRA += hra;
    totalAllowances += allowances;
    totalGross += gross;
    totalDeductions += ded;
    totalNet += net;

    const pfBase = Math.min(basic, 15000);
    const pf = +(pfBase * 0.12).toFixed(2);
    const esi = gross <= 21000 ? +(gross * 0.0075).toFixed(2) : 0;
    const pt = gross < 7500 ? 0 : gross < 10000 ? 175 : gross < 15000 ? 150 : 200;
    const tds = Math.max(0, ded - pf - esi - pt);
    totalPF += pf;
    totalESI += esi;
    totalPT += pt;
    totalTDS += tds;
  });

  const earnSegs = [
    { label: "Basic",      value: totalBasic,       color: "#f18200" },
    { label: "HRA",        value: totalHRA,         color: "#fb923c" },
    { label: "Allowances", value: totalAllowances,  color: "#fbbf24" },
  ];

  const dedSegs = [
    { label: "PF (12%)",         value: totalPF,   color: "#6366f1" },
    { label: "ESI (0.75%)",      value: totalESI,  color: "#8b5cf6" },
    { label: "Prof. Tax",        value: totalPT,   color: "#a78bfa" },
    { label: "TDS / Income Tax", value: totalTDS,  color: "#c4b5fd" },
  ];

  const netRatio = pct(totalNet, totalGross);
  const dedRatio = pct(totalDeductions, totalGross);
  const count = payslips.length;

  const ringSegs = [...earnSegs, { label: "Deductions", value: totalDeductions, color: "#e0e7ff" }];

  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      padding: "24px 26px", boxShadow: "0 2px 8px #0000000d",
    })}>
      {/* Header */}
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 })}>
        <div>
          <div className={cssClass({ fontWeight: 800, fontSize: 16, color: "#111827" })}>Payout Details</div>
          <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 2 })}>{count} employees processed</div>
        </div>
        <div className={cssClass({
          background: "#fff8f0", border: `1px solid ${BRAND}30`,
          borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: BRAND,
        })}>
          {netRatio}% Net Ratio
        </div>
      </div>

      {/* Donut + Summary */}
      <div className={cssClass({ display: "flex", gap: 28, alignItems: "flex-start", marginBottom: 22 })}>
        <div className={cssClass({ flexShrink: 0, position: "relative" })}>
          <MultiDonut segments={ringSegs} size={180} thickness={28} />
          <div className={cssClass({
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none",
          })}>
            <div className={cssClass({ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 })}>Net Pay</div>
            <div className={cssClass({ fontSize: 17, fontWeight: 900, color: "#111827", lineHeight: 1.1, marginTop: 1 })}>
              {fmtINR(totalNet, true)}
            </div>
            <div className={cssClass({ fontSize: 10, color: "#9ca3af", marginTop: 2 })}>of {fmtINR(totalGross, true)}</div>
          </div>
        </div>

        <div className={cssClass({ flex: 1 })}>
          {[
            { label: "Gross Earnings",    value: totalGross,      color: BRAND,      bg: "#fff8f0" },
            { label: "Total Net Pay",     value: totalNet,        color: "#16a34a",  bg: "#f0fdf4" },
            { label: "Total Deductions",  value: totalDeductions, color: "#dc2626",  bg: "#fff1f2" },
          ].map((t) => (
            <div key={t.label} className={cssClass({
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: t.bg, borderRadius: 8, padding: "9px 12px", marginBottom: 7,
            })}>
              <span className={cssClass({ fontSize: 12, color: "#6b7280", fontWeight: 500 })}>{t.label}</span>
              <span className={cssClass({ fontSize: 14, fontWeight: 800, color: t.color })}>{fmtINR(t.value)}</span>
            </div>
          ))}

          <div className={cssClass({ marginTop: 12 })}>
            <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginBottom: 5, fontWeight: 600 })}>
              Gross split — Net vs Deductions
            </div>
            <div className={cssClass({ height: 10, background: "#f1f5f9", borderRadius: 6, overflow: "hidden", display: "flex" })}>
              <div className={cssClass({ width: `${netRatio}%`, background: "linear-gradient(90deg,#f18200,#fb923c)", transition: "width .5s", borderRadius: "6px 0 0 6px" })} />
              <div className={cssClass({ width: `${dedRatio}%`, background: "linear-gradient(90deg,#6366f1,#a78bfa)", transition: "width .5s" })} />
            </div>
            <div className={cssClass({ display: "flex", justifyContent: "space-between", marginTop: 4 })}>
              <span className={cssClass({ fontSize: 10, color: BRAND, fontWeight: 700 })}>Net {netRatio}%</span>
              <span className={cssClass({ fontSize: 10, color: "#6366f1", fontWeight: 700 })}>Ded {dedRatio}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cssClass({ borderTop: "1px dashed #f0f0f0", margin: "4px 0 20px" })} />

      {/* Earnings Breakdown */}
      <div className={cssClass({ marginBottom: 18 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 })}>
          <div className={cssClass({ width: 3, height: 14, background: BRAND, borderRadius: 2 })} />
          <span className={cssClass({ fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: .5 })}>
            Earnings Breakdown
          </span>
        </div>
        {earnSegs.map((s) => (
          <ProgressRow key={s.label} label={s.label} value={s.value} total={totalGross} color={s.color}
            sub={`${pct(s.value, totalGross)}%`} />
        ))}
      </div>

      {/* Deductions Breakdown */}
      <div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 })}>
          <div className={cssClass({ width: 3, height: 14, background: "#6366f1", borderRadius: 2 })} />
          <span className={cssClass({ fontSize: 12, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: .5 })}>
            Deductions Breakdown
          </span>
        </div>
        {dedSegs.map((s) => s.value > 0 && (
          <ProgressRow key={s.label} label={s.label} value={s.value} total={totalDeductions} color={s.color}
            sub={`${pct(s.value, totalDeductions)}%`} />
        ))}
        {totalDeductions === 0 && (
          <div className={cssClass({ fontSize: 13, color: "#aaa", textAlign: "center", padding: "12px 0" })}>No deduction data</div>
        )}
      </div>

      {/* Per Employee Avg */}
      {count > 0 && (
        <>
          <div className={cssClass({ borderTop: "1px dashed #f0f0f0", margin: "18px 0 14px" })} />
          <div className={cssClass({ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 })}>
            Per Employee Avg
          </div>
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 })}>
            {[
              { label: "Avg Gross", value: fmtINR(Math.round(totalGross / count), true), color: BRAND },
              { label: "Avg Net",   value: fmtINR(Math.round(totalNet / count), true),   color: "#16a34a" },
              { label: "Avg Ded",   value: fmtINR(Math.round(totalDeductions / count), true), color: "#6366f1" },
            ].map((a) => (
              <div key={a.label} className={cssClass({
                background: "#fafafa", borderRadius: 8, padding: "10px 12px",
                border: "1px solid #f0f0f0", textAlign: "center",
              })}>
                <div className={cssClass({ fontSize: 15, fontWeight: 800, color: a.color })}>{a.value}</div>
                <div className={cssClass({ fontSize: 10, color: "#9ca3af", marginTop: 2, fontWeight: 500 })}>{a.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default PayoutDetailsPanel;
