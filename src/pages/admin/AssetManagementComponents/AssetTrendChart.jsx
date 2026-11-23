import React from "react";
function AssetTrendChart({
  rows
}) {
  const width = 620;
  const height = 220;
  const padding = {
    top: 14,
    right: 12,
    bottom: 34,
    left: 34
  };
  const max = Math.max(1, ...rows.map(row => Math.max(Number(row.total_assets), Number(row.allocated))));
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  const point = (value, index) => ({
    x: padding.left + (rows.length <= 1 ? chartWidth / 2 : index / (rows.length - 1) * chartWidth),
    y: padding.top + chartHeight - Number(value) / max * chartHeight
  });
  const path = key => rows.map((row, index) => {
    const {
      x,
      y
    } = point(row[key], index);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  const totalPath = path("total_assets");
  const allocatedPath = path("allocated");
  const last = rows.length ? point(rows[rows.length - 1].total_assets, rows.length - 1) : null;
  const areaPath = last ? `${totalPath} L ${last.x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z` : "";
  return rows.length ? <div className="w-full">
    <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-blue-500" />Total assets</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-500" />Allocated</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full" role="img" aria-label="Monthly total and allocated asset trend">
      {[0, 0.25, 0.5, 0.75, 1].map(tick => {
        const y = padding.top + chartHeight * (1 - tick);
        return <g key={tick}><line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" /><text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(max * tick)}</text></g>;
      })}
      <path d={areaPath} fill="#e87500" opacity="0.08" /><path d={totalPath} fill="none" stroke="#e87500" strokeWidth="2.5" strokeLinejoin="round" /><path d={allocatedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      {rows.map((row, index) => {
        const totalPoint = point(row.total_assets, index);
        const allocatedPoint = point(row.allocated, index);
        return <g key={row.month}><circle cx={totalPoint.x} cy={totalPoint.y} r="3" fill="#e87500"><title>{`${row.label}: ${row.total_assets} total assets`}</title></circle><circle cx={allocatedPoint.x} cy={allocatedPoint.y} r="3" fill="#10b981"><title>{`${row.label}: ${row.allocated} allocated`}</title></circle><text x={totalPoint.x} y={height - 10} textAnchor="middle" fontSize="9" fill="#64748b">{row.label}</text></g>;
      })}
    </svg>
  </div> : <p className="py-16 text-center text-sm text-slate-500">Asset history will appear here as inventory and allocations build up.</p>;
}
export { AssetTrendChart };
