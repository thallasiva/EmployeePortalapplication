import React from "react";
const PrimaryButton = ({
  children,
  className = "",
  ...props
}) => <button {...props} className={`h-10 px-4 rounded-xl bg-[#e87500] hover:bg-[#e07000] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors ${className}`}>
    {children}
  </button>;
export { PrimaryButton };
