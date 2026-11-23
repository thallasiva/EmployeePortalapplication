import React from "react";
const Label = ({
  children,
  htmlFor
}) => <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{children}</label>;
/* ---------- People picker ---------- */
export { Label };
