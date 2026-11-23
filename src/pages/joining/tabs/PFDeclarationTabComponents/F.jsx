import React from "react";
const F = ({
  label,
  required,
  full,
  children
}) => <div className={full ? "col-span-2" : ""}>
    <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>;
export { F };
