import React from "react";
const Label = ({
  children,
  required
}) => <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>;
export { Label };
