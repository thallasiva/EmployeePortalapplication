import React from "react";
function SectionCard({
  title,
  subtitle,
  children,
  action,
  noPad
}) {
  return <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      {(title || action) && <div className="px-5 py-4 border-b border-[#e8eef5] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-[#e87500]">{title}</p>
            {subtitle && <p className="text-[12px] text-[#94a3b8] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>}
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>;
}
export { SectionCard };
