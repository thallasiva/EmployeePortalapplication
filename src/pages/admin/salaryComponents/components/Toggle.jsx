import React from "react";

const Toggle = React.memo(function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
        value
          ? "bg-green-50 border-green-300 text-green-700"
          : "bg-gray-50 border-gray-200 text-gray-400"
      }`}
    >
      {value ? "✓ " : ""}
      {label}
    </button>
  );
});

export default Toggle;
