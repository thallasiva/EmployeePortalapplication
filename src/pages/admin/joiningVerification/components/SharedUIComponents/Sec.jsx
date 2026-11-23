import React from "react";
const Sec = React.memo(function Sec({
  icon: Icon,
  title,
  children
}) {
  return <div className="bg-white rounded-xl border border-amber-100 overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6B5133] to-[#8B7355]">
        <Icon size={13} className="text-white/80" />
        <span className="text-[12px] font-bold text-white uppercase tracking-wide">{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>;
});
export { Sec };
