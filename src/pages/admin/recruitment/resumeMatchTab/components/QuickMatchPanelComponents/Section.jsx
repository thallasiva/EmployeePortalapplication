import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
function Section({
  title,
  children,
  defaultOpen = true
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="border border-[#e2e8f0] rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#f8fafc] hover:  transition-colors">
        <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp size={13} className="text-[#94a3b8]" /> : <ChevronDown size={13} className="text-[#94a3b8]" />}
      </button>
      {open && <div className="px-3.5 pb-3 pt-1">{children}</div>}
    </div>;
}
/* ── Parsed resume detail panel ── */
export { Section };
