import React, { memo } from "react";
const MemoizedSummaryCard = memo(function MemoizedSummaryCard({
  title,
  description,
  value
}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-3 text-xl font-bold text-orange-500">{value}</p>
    </div>;
});
export { MemoizedSummaryCard };
