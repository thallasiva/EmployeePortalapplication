import React from "react";

const NumField = React.memo(function NumField({ label, name, value, onChange, suffix = "" }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <input
          type="number" name={name} value={value} onChange={onChange} min={0}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white" />

        {suffix &&
        <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 h-full flex items-center">
            {suffix}
          </span>
        }
      </div>
    </div>
  );
});

export default NumField;
