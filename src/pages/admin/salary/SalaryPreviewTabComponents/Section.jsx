import React from "react";
import { fmtINR } from ".././salaryHelpers";
function Section({
  title,
  items,
  colorClass
}) {
  const total = items.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  return <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${colorClass}`}>{title}</p>
      <div className="space-y-1.5">
        {items.map(c => <div key={c.component_code} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{c.component_name}</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">{fmtINR(c.monthly_amount)}</span>
              <span className="text-[10px] text-gray-400 ml-2">{fmtINR(c.annual_amount)}/yr</span>
            </div>
          </div>)}
      </div>
      {items.length > 0 && <div className={`flex justify-between items-center mt-2 pt-2 border-t font-semibold text-sm ${colorClass}`}>
          <span>Total {title}</span>
          <span>{fmtINR(total)}</span>
        </div>}
    </div>;
}
export { Section };
