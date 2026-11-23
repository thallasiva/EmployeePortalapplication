import React from "react";
/* ── Bar chart (SVG) ── */
function BarChart({
  data
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 520,
    H = 160,
    barW = 30,
    gap = (W - data.length * barW) / (data.length + 1);
  return <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" style={{
    overflow: "visible"
  }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e87500" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
      const barH = Math.round(d.value / max * H);
      const x = gap + i * (barW + gap);
      const y = H - barH;
      return <g key={i}>
            <rect x={x} y={y} width={barW} height={barH || 2} fill={d.value > 0 ? "url(#barGrad)" : "#f1f5f9"} rx={4} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8">{d.label}</text>
            {d.value > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill="#64748b">
                {Math.round(d.value / 1000)}k
              </text>}
          </g>;
    })}
    </svg>;
}
/* ── Collapsible section header row ── */
export { BarChart };
