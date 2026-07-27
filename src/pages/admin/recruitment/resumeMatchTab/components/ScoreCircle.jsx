import React from "react";
import { getScoreColor } from "../utils/scoreColor";

const ScoreCircle = React.memo(function ScoreCircle({ score, size = 64 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = getScoreColor(score);
  const fs = size < 60 ? 11 : 14;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + fs * 0.4} textAnchor="middle"
        fontSize={fs} fontWeight={800} fill={color}
      >
        {score}%
      </text>
    </svg>
  );
});

export default ScoreCircle;
