import React from "react";
const SectionCard = ({
  icon: Icon,
  title,
  action,
  children
}) => <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6B5133] to-[#8B7355]">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-white/20"><Icon size={15} className="text-white" /></div>
        <h3 className="text-[13px] font-bold text-white tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>;
export { SectionCard };
