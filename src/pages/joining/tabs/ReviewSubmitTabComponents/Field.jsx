import React from "react";
const Field = ({
  label,
  value
}) => <div>
    <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
    <p className="text-[13px] text-gray-800 font-medium mt-0.5">{value || <span className="text-gray-300 italic">—</span>}</p>
  </div>;
export { Field };
