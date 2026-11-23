import React from "react";
function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  icon,
  type = "button"
}) {
  const sizes = {
    sm: "h-[32px] px-3 text-[12px]",
    md: "h-[38px] px-4 text-[13px]",
    lg: "h-[42px] px-5 text-[14px]"
  };
  const variants = {
    primary: "bg-[#e87500] hover:bg-[#e07000] text-white",
    outline: "border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#374151]",
    ghost: "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
    danger: "bg-[#ef4444] hover:bg-[#dc2626] text-white",
    success: "bg-[#10b981] hover:bg-[#059669] text-white"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-all ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {icon}{children}
    </button>;
}
export { Btn };
