import React from "react";
function FormSelect({
  label,
  required,
  options,
  defaultValue
}) {
  return <div className="grid grid-cols-[170px_1fr] items-center gap-4">
            <label className="text-gray-700 text-sm">
                {required && label && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>
            <select defaultValue={defaultValue} className="w-full h-10 border border-orange-400 rounded px-3 outline-none focus:ring-2 focus:ring-orange-400">
                {!defaultValue && <option>Find items</option>}
                {options.map(item => <option key={item}>{item}</option>)}
            </select>
        </div>;
}
export { FormSelect };
