import React from "react";

const FRow = React.memo(function FRow({ label, required, optional, children, span }) {
  return (
    <div className={`mb-4 ${span ? "col-span-full" : ""}`}>
      <label className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="text-[11px] font-normal text-gray-400">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
});

export default FRow;
