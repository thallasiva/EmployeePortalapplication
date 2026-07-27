import React from "react";

const SkillBar = React.memo(function SkillBar({ label, score, color }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-[12px] text-gray-700 font-medium">{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-[7px] rounded bg-gray-100">
        <div
          className="h-[7px] rounded transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
});

export default SkillBar;
