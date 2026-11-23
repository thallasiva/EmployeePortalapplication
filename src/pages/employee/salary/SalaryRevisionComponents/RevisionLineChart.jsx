import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { parseDateStr } from "./shared";
function RevisionLineChart({
  rows
}) {
  if (!rows || rows.length < 1) return null;
  const W = 800,
    H = 200,
    PAD = {
      top: 20,
      right: 30,
      bottom: 40,
      left: 60
    };
  const inner = {
    w: W - PAD.left - PAD.right,
    h: H - PAD.top - PAD.bottom
  };
  const values = rows.map(r => Number(r.newCTC) || 0);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const toX = i => PAD.left + (rows.length === 1 ? inner.w / 2 : i / (rows.length - 1) * inner.w);
  const toY = v => PAD.top + inner.h - (v - min) / (max - min || 1) * inner.h;
  const points = rows.map((r, i) => `${toX(i)},${toY(Number(r.newCTC) || 0)}`).join(" ");
  const fillPoints = [`${toX(0)},${PAD.top + inner.h}`, ...rows.map((r, i) => `${toX(i)},${toY(Number(r.newCTC) || 0)}`), `${toX(rows.length - 1)},${PAD.top + inner.h}`].join(" ");
  const fmtL = n => {
    const v = Math.round(Number(n) || 0);
    return v >= 100000 ? `${(v / 100000).toFixed(2)}L` : `${(v / 1000).toFixed(0)}k`;
  };
  const yTicks = 4;
  const yTickVals = Array.from({
    length: yTicks + 1
  }, (_, i) => min + i / yTicks * (max - min));
  return <svg viewBox={`0 0 ${W} ${H}`} width="100%" className={cssClass({
    fontFamily: "var(--font-ui)"
  })}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {}
      {yTickVals.map((v, i) => <g key={i}>
          <line x1={PAD.left} y1={toY(v)} x2={PAD.left + inner.w} y2={toY(v)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={PAD.left - 6} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{fmtL(v)}</text>
        </g>)}
      {}
      <polygon points={fillPoints} fill="url(#lineGrad)" />
      {}
      <polyline points={points} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinejoin="round" />
      {}
      {rows.map((r, i) => {
      const x = toX(i);
      const y = toY(Number(r.newCTC) || 0);
      const dt = parseDateStr(r.effectiveDate);
      const label = dt ? dt.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "2-digit"
      }) : "—";
      return <g key={i}>
            <circle cx={x} cy={y} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />
            <text x={x} y={PAD.top + inner.h + 18} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>
          </g>;
    })}
    </svg>;
}
export { RevisionLineChart };
