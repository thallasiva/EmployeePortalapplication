import React from "react";
import { ChevronRight } from "lucide-react";
function MiniList({
  title,
  items,
  emptyText,
  onViewAll,
  renderItem
}) {
  return <div className="admin-dash-card h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {onViewAll && <button type="button" onClick={onViewAll} className="text-xs font-medium text-emerald-600 hover:underline inline-flex items-center gap-0.5">
            View all <ChevronRight size={12} />
          </button>}
      </div>
      {!items.length ? <p className="text-sm text-gray-400 py-6 text-center">{emptyText}</p> : <ul className="space-y-2">{items.map(renderItem)}</ul>}
    </div>;
}
export { MiniList };
