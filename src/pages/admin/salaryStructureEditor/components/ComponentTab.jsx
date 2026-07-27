import React from "react";
import { Plus, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { TAB_META } from "../../salary/salaryHelpers";
import ComponentTable from "../../salary/ComponentTable";

const ComponentTab = React.memo(function ComponentTab({
  tab,
  lines,
  computed,
  onAdd,
  onEdit,
  onRemove,
  canAdd,
}) {
  const meta = TAB_META[tab] ?? {};
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white">
        <div>
          <p className="text-sm font-semibold text-gray-800">{meta.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{meta.sub}</p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="px-2.5 py-1.5 hover:bg-gray-50 border-r border-gray-200 text-gray-500"
                title="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                className="px-2.5 py-1.5 hover:bg-gray-50 border-r border-gray-200 text-gray-500"
                title="Move down"
              >
                <ArrowDown size={13} />
              </button>
              <button
                className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-500"
                title="Duplicate"
              >
                <Copy size={13} />
              </button>
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm"
            >
              <Plus size={13} /> Add Component
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <ComponentTable
          lines={lines}
          computed={computed}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
});

export default ComponentTab;
