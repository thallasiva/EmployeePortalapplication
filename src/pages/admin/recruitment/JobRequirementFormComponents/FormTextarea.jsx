import React from "react";
function FormTextarea({
  label,
  required
}) {
  return <div className="grid grid-cols-[170px_1fr] gap-4">
            <label className="text-gray-700 text-sm pt-2">
                {required && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>
            <textarea rows={5} className="w-full border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400" />
        </div>;
}
export { FormTextarea };
