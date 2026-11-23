import React from "react";
const SecondaryButton = ({
  children,
  className = "",
  ...props
}) => <button {...props} className={`h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors ${className}`}>
    {children}
  </button>;
export { SecondaryButton };
