import React from "react";
function Input({
  label,
  required,
  error,
  ...props
}) {
  return <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-semibold text-[#475569]">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>}
      <input className={`h-[40px] border rounded-lg px-3 text-[13px] text-[#1e293b] bg-white outline-none transition-all
          ${error ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-[#e2e8f0] focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10"}`} {...props} />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>;
}
export { Input };
