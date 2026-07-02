import React, { useMemo } from "react";
import "./adminCharts.css";import { cssClass, joinClasses } from "../../utils/classStyles";

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angleRad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function AdminDonutChart({
  title,
  subtitle,
  segments = [],
  centerValue,
  centerLabel = "Total",
  size = 160,
  strokeWidth = 22
}) {
  const total = useMemo(
    () => segments.reduce((sum, s) => sum + (s.value || 0), 0),
    [segments]
  );

  const arcs = useMemo(() => {
    let cursor = 0;
    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - strokeWidth) / 2;

    return segments.map((seg) => {
      const slice = total ? seg.value / total * 360 : 0;
      const start = cursor;
      const end = cursor + slice;
      cursor = end;
      return {
        ...seg,
        d: describeArc(cx, cy, radius, start, end - 0.5)
      };
    });
  }, [segments, total, size, strokeWidth]);

  const displayCenter = centerValue ?? total;

  return (
    <div className="admin-chart">
      {(title || subtitle) &&
      <div className="admin-chart__header">
          <div>
            {title && <p className="admin-chart__title">{title}</p>}
            {subtitle && <p className="admin-chart__subtitle">{subtitle}</p>}
          </div>
        </div>
      }

      <div className="admin-donut">
        <div className={joinClasses("admin-donut__svg-wrap", cssClass({ width: size, height: size }))}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size - strokeWidth) / 2}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={strokeWidth} />
            
            {arcs.map((arc) =>
            arc.value > 0 ?
            <path
              key={arc.label}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt" /> :

            null
            )}
          </svg>
          <div className="admin-donut__center">
            <span className="admin-donut__center-value">{displayCenter}</span>
            <span className="admin-donut__center-label">{centerLabel}</span>
          </div>
        </div>

        <div className="admin-donut__legend">
          {segments.map((seg) =>
          <div key={seg.label} className="admin-donut__legend-row">
              <span className="admin-donut__legend-label">
                <span
                className={joinClasses("admin-chart__swatch", cssClass(
                  { background: seg.color, width: 10, height: 10 }))} />
              
                {seg.label}
              </span>
              <span className="admin-donut__legend-value">
                {seg.value}
                {total > 0 &&
              <span className="text-gray-400 font-normal ml-1">
                    ({Math.round(seg.value / total * 100)}%)
                  </span>
              }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>);

}
