import React from "react";

const SkillPills = React.memo(function SkillPills({ skills, matched }) {
  if (!skills?.length) return <span className="text-[12px] text-gray-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((s) => (
        <span
          key={s}
          className={`text-[11px] font-semibold px-2 py-[3px] rounded-full ${
            matched ? "bg-[#fff7ed] text-[#f18200]" : "bg-red-100 text-red-800"
          }`}
        >
          {matched ? "✔" : "✖"} {s}
        </span>
      ))}
    </div>
  );
});

export default SkillPills;
