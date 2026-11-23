import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
/* ── Collapsible section header row ── */
function SectionHeader({
  label,
  expanded,
  onToggle,
  colCount
}) {
  return <tr onClick={onToggle} className="cursor-pointer select-none bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors">
      <td colSpan={colCount} className="px-4 py-2.5 font-bold text-[#e87500] border-b border-[#e2e8f0] text-[12px]">
        <span className="flex items-center gap-2">
          {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          {label}
        </span>
      </td>
    </tr>;
}
export { SectionHeader };
