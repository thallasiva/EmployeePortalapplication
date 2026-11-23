import React from "react";
const Field = React.memo(function Field({
  label,
  required,
  children,
  error
}) {
  return <div className="mb-3.5">
      {label && <label className="block text-[12px] font-semibold text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>}
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>;
});
export { Field };
