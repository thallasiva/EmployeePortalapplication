import React, { useState, useCallback } from "react";
import { Pencil, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import StructureDetail from "./StructureDetail";

const StructureCard = React.memo(function StructureCard({
  s,
  allComponents,
  onEdit,
  onRefresh,
  onOpenEditor,
}) {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm">{s.structure_name}</span>
            {s.is_default && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-medium">
                Default
              </span>
            )}
          </div>
          {s.description && (
            <p className="text-[11px] text-gray-400 mt-0.5">{s.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenEditor(s.structure_id)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 font-medium"
          >
            <ExternalLink size={12} /> Open Editor
          </button>
          <button
            onClick={() => onEdit(s)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Pencil size={13} />
          </button>
          <button onClick={toggleOpen} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {open && (
        <StructureDetail
          structure={s}
          allComponents={allComponents}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
});

export default StructureCard;
