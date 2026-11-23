import React from "react";
import { ChevronDown } from "lucide-react";
function FilterSelect({
  label,
  value,
  onChange,
  options
}) {
  return <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none border border-slate-200 rounded-md bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400">
          {options.map(opt => <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>;
}
export { FilterSelect };
