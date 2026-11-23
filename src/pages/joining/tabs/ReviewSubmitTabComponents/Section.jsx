import React from "react";
const Section = ({
  title,
  children
}) => <div className="mb-6">
    <h3 className="text-[13px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-200 pb-1 mb-3">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</div>
  </div>;
export { Section };
