import React from "react";
import { Trash2 } from "lucide-react";
/* ── Field edit panel ── */
function FieldEditor({
  field,
  onChange,
  onDelete
}) {
  return <div className="bg-[#fff8f0] border border-[#fed7aa] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#e87500] uppercase tracking-wide">Editing: {field.type}</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Label</label>
        <input value={field.label} onChange={e => onChange({
        ...field,
        label: e.target.value
      })} className="w-full h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] outline-none focus:border-[#e87500]" />
      </div>
      {["text", "number", "textarea"].includes(field.type) && <div>
          <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Placeholder</label>
          <input value={field.placeholder} onChange={e => onChange({
        ...field,
        placeholder: e.target.value
      })} className="w-full h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[12px] outline-none focus:border-[#e87500]" />
        </div>}
      {["checkbox", "radio", "select"].includes(field.type) && <div>
          <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Options (one per line)</label>
          <textarea rows={3} value={field.options.join("\n")} onChange={e => onChange({
        ...field,
        options: e.target.value.split("\n").filter(Boolean)
      })} className="w-full border border-[#e2e8f0] rounded-lg p-2 text-[12px] outline-none focus:border-[#e87500] resize-none" />
        </div>}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={field.required} onChange={e => onChange({
        ...field,
        required: e.target.checked
      })} className="accent-[#e87500]" />
        <span className="text-[12px] text-[#374151]">Required field</span>
      </label>
    </div>;
}
/* ── Field preview ── */
export { FieldEditor };
