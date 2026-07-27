import React from "react";
import { Check, X } from "lucide-react";

const Toggle = React.memo(function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      value ?
      "bg-green-50 border-green-300 text-green-700" :
      "bg-gray-50 border-gray-200 text-gray-500"}`
      }>

      {value ? <Check size={12} /> : <X size={12} />}
      {label}
    </button>
  );
});

export default Toggle;
