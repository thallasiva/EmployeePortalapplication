import React from "react";
function FormInput({
  label,
  required,
  defaultValue = ""
}) {
  return <div className="grid grid-cols-[170px_1fr] items-center gap-4">
            <label className="text-gray-700 text-sm">
                {required && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>
            <input defaultValue={defaultValue} className="w-full h-10 border border-orange-400 rounded px-3 outline-none focus:ring-2 focus:ring-orange-400" />
        </div>;
}
export { FormInput };
