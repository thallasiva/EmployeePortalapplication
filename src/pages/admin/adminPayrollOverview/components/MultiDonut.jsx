import React from "react";
import { cssClass } from "../../../../utils/classStyles";

const MultiDonut = React.memo(function MultiDonut({ segments, size = 180, thickness = 26 }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pctVal = (seg.value / total) * 100;
    const dash = (pctVal / 100) * circ;
    const o = -(offset / 100) * circ;
    offset += pctVal;
    return { ...seg, dash, dashGap: circ - dash, o };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
      {arcs.map((seg, i) =>
        seg.value > 0 && (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            className={cssClass({
              strokeDasharray: `${seg.dash} ${seg.dashGap}`,
              strokeDashoffset: seg.o,
            })}
          />
        )
      )}
      <circle cx={cx} cy={cy} r={r - thickness / 2 - 2} fill="#fff" />
    </svg>
  );
});

export default MultiDonut;
