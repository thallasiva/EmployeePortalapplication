import React from "react";
import { Star, ChevronDown } from "lucide-react";
/* ── Field preview ── */
function FieldPreview({
  field
}) {
  return <div className="space-y-1.5">
      <label className="block text-[12px] font-semibold text-[#374151]">
        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {field.type === "text" && <input placeholder={field.placeholder || "Enter text…"} className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "number" && <input type="number" placeholder={field.placeholder || "0"} className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "date" && <input type="date" className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white" />}
      {field.type === "textarea" && <textarea rows={2} placeholder={field.placeholder || "Enter text…"} className="w-full border border-[#e2e8f0] rounded-lg p-2 text-[12px] bg-white resize-none" />}
      {field.type === "file" && <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-4 text-center text-[11px] text-[#94a3b8] bg-white">Click to upload or drag and drop</div>}
      {field.type === "rating" && <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={20} className="text-[#e2e8f0]" />)}</div>}
      {field.type === "toggle" && <div className="flex items-center gap-2">
          <div className="w-10 h-5 bg-[#e2e8f0] rounded-full" />
          <span className="text-[12px] text-[#94a3b8]">No</span>
        </div>}
      {field.type === "select" && <div className="relative">
          <select className="w-full h-[36px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] bg-white appearance-none">
            <option>Select…</option>
            {field.options.map(o => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        </div>}
      {field.type === "checkbox" && <div className="space-y-1">{field.options.map(o => <label key={o} className="flex items-center gap-2 text-[12px] text-[#374151]"><input type="checkbox" className="accent-[#e87500]" />{o}</label>)}</div>}
      {field.type === "radio" && <div className="space-y-1">{field.options.map(o => <label key={o} className="flex items-center gap-2 text-[12px] text-[#374151]"><input type="radio" className="accent-[#e87500]" />{o}</label>)}</div>}
    </div>;
}
/* ── Builder view ── */
export { FieldPreview };
