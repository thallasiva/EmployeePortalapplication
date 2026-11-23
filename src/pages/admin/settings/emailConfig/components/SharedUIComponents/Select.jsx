import React from "react";
import { ChevronDown } from "lucide-react";
/* ── Brand token ── */

function Select({
  label,
  required,
  children,
  ...props
}) {
  return <div className="flex flex-col gap-1.5">
      {label && <label className="text-[12px] font-semibold text-[#475569]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <div className="relative">
        <select className="w-full h-[40px] border border-[#e2e8f0] rounded-lg px-3 pr-8 text-[13px] text-[#1e293b] bg-white outline-none focus:border-[#e87500] focus:ring-2 focus:ring-[#e87500]/10 appearance-none transition-all" {...props}>
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
      </div>
    </div>;
}
export { Select };
