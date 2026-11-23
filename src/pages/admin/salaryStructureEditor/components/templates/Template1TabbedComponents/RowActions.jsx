import React from "react";
import { Edit2, Trash2 } from "lucide-react";
// ─── Row actions ──────────────────────────────────────────────────────────────
function RowActions({
  line,
  onEdit,
  onRemove
}) {
  return <div className="flex items-center gap-1">
      <button onClick={() => onEdit(line)} className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
        <Edit2 size={13} />
      </button>
      <button onClick={() => onRemove(line)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 size={13} />
      </button>
    </div>;
}
// ─── Earnings table ───────────────────────────────────────────────────────────
export { RowActions };
