import React from "react";
const Toggle = ({
  on,
  onToggle
}) => <button onClick={onToggle} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${on ? "bg-[#e87500]" : "bg-[#cbd5e1]"}`}>
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
  </button>;
export { Toggle };
