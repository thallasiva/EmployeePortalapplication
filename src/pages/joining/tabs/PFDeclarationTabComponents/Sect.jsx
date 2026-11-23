import React from "react";
const Sect = ({
  title,
  children
}) => <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-gradient-to-r from-[#e87500] to-[#e87500]">
      <h3 className="text-[13px] font-bold text-white tracking-wide uppercase">{title}</h3>
    </div>
    <div className="p-5 grid grid-cols-2 gap-3">{children}</div>
  </div>;
export { Sect };
