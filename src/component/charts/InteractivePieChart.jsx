import React, { useState } from "react";

import { cssClass, joinClasses } from "../../utils/classStyles";
function getCoordinatesForPercent(percent) {
  const angle = 2 * Math.PI * (percent - 0.25);
  return [Math.cos(angle), Math.sin(angle)];
}

export const formatINR = (value) => `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;












export default function InteractivePieChart({ data, size = 180, donut = true, valueFormatter = formatINR, title, legendBelow = false }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const r = size / 2;
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const nonZero = data.filter((d) => Number(d.value) > 0);

  let cumulative = 0;
  const slices = data.map((d) => {
    const value = Number(d.value) || 0;
    const percent = total > 0 ? value / total : 0;
    const start = cumulative;
    cumulative += percent;
    const mid = start + percent / 2;
    return { ...d, value, percent, start, end: cumulative, mid };
  });

  const innerRadius = donut ? r * 0.6 : 0;
  const active = activeIndex != null ? slices[activeIndex] : null;
  const singleIndex = nonZero.length === 1 ? data.indexOf(nonZero[0]) : -1;

  return (
    <div className={legendBelow ? "flex flex-col items-center gap-3" : "flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6"}>
      {title && <h3 className="sr-only">{title}</h3>}
      <div className={joinClasses("relative shrink-0", cssClass({ width: size, height: size }))}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={title || "Pie chart"}>
          {total <= 0 ?
          <circle cx={r} cy={r} r={r} fill="#f1f5f9" /> :
          nonZero.length === 1 ?
          <circle
            cx={r}
            cy={r}
            r={r}
            fill={nonZero[0].color}
            opacity={activeIndex == null || activeIndex === singleIndex ? 1 : 0.45}
            onMouseEnter={() => setActiveIndex(singleIndex)}
            onMouseLeave={() => setActiveIndex(null)}>

              <title>{`${nonZero[0].label}: ${valueFormatter(nonZero[0].value)} (100%)`}</title>
            </circle> :

          slices.map((slice, i) => {
            if (slice.value <= 0) return null;
            const [sx, sy] = getCoordinatesForPercent(slice.start);
            const [ex, ey] = getCoordinatesForPercent(slice.end);
            const largeArc = slice.percent > 0.5 ? 1 : 0;
            const path = [
            `M ${r + sx * r} ${r + sy * r}`,
            `A ${r} ${r} 0 ${largeArc} 1 ${r + ex * r} ${r + ey * r}`,
            `L ${r} ${r}`,
            "Z"].
            join(" ");
            return (
              <path
                key={slice.label}
                d={path}
                fill={slice.color}
                stroke="#fff"
                strokeWidth={1}
                opacity={activeIndex == null || activeIndex === i ? 1 : 0.45}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0} className={cssClass(
                  { cursor: "pointer", outline: "none" })}>

                  <title>{`${slice.label}: ${valueFormatter(slice.value)} (${Math.round(slice.percent * 100)}%)`}</title>
                </path>);

          })
          }
          {donut && <circle cx={r} cy={r} r={innerRadius} fill="white" />}
        </svg>

        {}
        {donut &&
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            {active ?
          <>
                <p className="text-[11px] font-medium text-gray-500 truncate max-w-full">{active.label}</p>
                <p className="text-base font-bold text-gray-800">{valueFormatter(active.value)}</p>
                <p className="text-[11px] text-gray-400">{Math.round(active.percent * 100)}%</p>
              </> :

          <>
                <p className="text-[11px] font-medium text-gray-500">Total</p>
                <p className="text-base font-bold text-gray-800">{valueFormatter(total)}</p>
              </>
          }
          </div>
        }
      </div>

      {}
      <div className="flex-1 w-full space-y-2">
        {slices.map((slice, i) =>
        <div
          key={slice.label}
          className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
          activeIndex === i ? "bg-gray-50" : ""}`
          }
          onMouseEnter={() => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(null)}>

            <span className="flex items-center gap-2 text-gray-600">
              <span className={joinClasses("h-2.5 w-2.5 shrink-0 rounded-full", cssClass({ backgroundColor: slice.color }))} />
              {slice.label}
            </span>
            <span className="font-medium text-gray-800">
              {valueFormatter(slice.value)}
              <span className="ml-1.5 text-xs text-gray-400">({Math.round(slice.percent * 100)}%)</span>
            </span>
          </div>
        )}
      </div>
    </div>);

}
