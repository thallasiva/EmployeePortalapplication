import React, { useMemo } from "react";

function buildPath(values, width, height, padding) {
  const max = Math.max(...values, 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const step = innerW / (values.length - 1 || 1);

  return values
    .map((v, i) => {
      const x = padding + i * step;
      const y = padding + innerH - (v / max) * innerH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function ReportLineChart({ present, absent, labels, presentColor = "#22c55e", absentColor = "#ec4899" }) {
  const width = 480;
  const height = 200;
  const padding = 24;

  const presentPath = useMemo(
    () => buildPath(present, width, height, padding),
    [present]
  );
  const absentPath = useMemo(
    () => buildPath(absent, width, height, padding),
    [absent]
  );

  return (
    <div className="report-line-chart">
      <div className="report-line-legend">
        <span><i style={{ background: presentColor }} /> Present</span>
        <span><i style={{ background: absentColor }} /> Absent</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding + (height - padding * 2) * (1 - tick / 100);
          return (
            <line
              key={tick}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          );
        })}
        <path d={absentPath} fill="none" stroke={absentColor} strokeWidth="2.5" />
        <path d={presentPath} fill="none" stroke={presentColor} strokeWidth="2.5" />
        {labels.map((label, i) => {
          const innerW = width - padding * 2;
          const step = innerW / (labels.length - 1 || 1);
          const x = padding + i * step;
          return (
            <text
              key={label}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
