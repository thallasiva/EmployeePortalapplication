import React from "react";
import { ChevronRight } from "lucide-react";

export const PageHeader = React.memo(function PageHeader({ breadcrumbs = [], title, subtitle, action }) {
  return (
    <div className="mb-5">
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5 text-[12px] text-gray-400">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === breadcrumbs.length - 1 ? "text-[#f18200] font-medium" : "text-gray-400"}>
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 m-0">{title}</h1>
          {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 mb-0">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
});
