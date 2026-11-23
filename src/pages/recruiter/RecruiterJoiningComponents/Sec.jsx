import React from "react";
const Sec = ({
  title,
  children
}) => <div className="bg-white rounded-xl border border-amber-100 overflow-hidden mb-4">
    <div className="flex items-center gap-2 px-4 py-2.5" style={{
    background: "linear-gradient(to right, #6B5133, #8B7355)"
  }}>
      <span className="text-[12px] font-bold text-white uppercase tracking-wide">{title}</span>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>;
export { Sec };
