import React from "react";
const Radio = ({
  name,
  value,
  checked,
  onChange,
  label
}) => <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] text-gray-700">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-[#d97706] w-3.5 h-3.5" />
    {label}
  </label>;
export { Radio };
