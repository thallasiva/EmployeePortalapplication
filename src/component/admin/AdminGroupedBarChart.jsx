import React, { useMemo, useState } from "react";
import "./adminCharts.css";

function barHeight(value, yMax, chartHeight) {
  if (!value || value <= 0 || !yMax) return 0;
  return Math.max(Math.round((value / yMax) * chartHeight), value > 0 ? 4 : 0);
}

function computeYMax(data, seriesKeys) {
  let max = 0;
  data.forEach((row) => {
    seriesKeys.forEach((key) => {
      max = Math.max(max, row[key] ?? 0);
    });
  });
  if (max <= 5) return 5;
  if (max <= 10) return 10;
  if (max <= 20) return 20;
  return Math.ceil(max / 5) * 5;
}

function buildYTicks(yMax) {
  const step = yMax <= 10 ? 5 : yMax / 4;
  const ticks = [];
  for (let v = yMax; v >= 0; v -= step) {
    ticks.push(Math.round(v));
  }
  if (ticks[ticks.length - 1] !== 0) ticks.push(0);
  return ticks;
}

/**
 * Grouped bar chart for admin dashboards.
 * data: [{ label, sick, earned, ... }] or custom keys via series prop
 * series: [{ key, name, color }]
 */
export default function AdminGroupedBarChart({
  title,
  subtitle,
  data = [],
  series = [],
  yLabel = "Count",
  height = 200,
  yMax: yMaxProp,
}) {
  const [hovered, setHovered] = useState(null);
  const seriesKeys = series.map((s) => s.key);
  const yMax = yMaxProp ?? computeYMax(data, seriesKeys);
  const yTicks = useMemo(() => buildYTicks(yMax), [yMax]);

  return (
    <div className="admin-chart">
      {(title || subtitle) && (
        <div className="admin-chart__header">
          <div>
            {title && <p className="admin-chart__title">{title}</p>}
            {subtitle && <p className="admin-chart__subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      <div className="admin-chart__body">
        <div className="admin-chart__y-label">{yLabel}</div>
        <div className="admin-chart__plot-wrap">
          <div className="admin-chart__plot">
            <div className="admin-chart__y-ticks" aria-hidden>
              {yTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>

            <div
              className="admin-chart__bars-area"
              style={{ height, position: "relative" }}
            >
              {yTicks.slice(1, -1).map((tick) => (
                <div
                  key={tick}
                  className="admin-chart__grid-line"
                  style={{ bottom: `${28 + (tick / yMax) * (height - 28)}px` }}
                />
              ))}

              {data.map((row, idx) => (
                <div
                  key={row.label}
                  className="admin-chart__bar-group"
                  style={{ height: "100%" }}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {hovered === idx && (
                    <div className="admin-chart__tooltip">
                      <div className="admin-chart__tooltip-title">{row.label}</div>
                      {series.map((s) => (
                        <div key={s.key} className="admin-chart__tooltip-row">
                          <span
                            className="admin-chart__swatch"
                            style={{ background: s.color }}
                          />
                          {s.name}: {row[s.key] ?? 0}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="admin-chart__bar-stack">
                    {series.map((s) => (
                      <div
                        key={s.key}
                        className="admin-chart__bar"
                        style={{
                          height: barHeight(row[s.key], yMax, height - 28),
                          background: s.color,
                        }}
                      />
                    ))}
                  </div>
                  <span className="admin-chart__x-label">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-chart__legend">
        {series.map((s) => (
          <span key={s.key} className="admin-chart__legend-item">
            <span className="admin-chart__swatch" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
