import React from "react";
import { Search } from "lucide-react";
import { fieldClass } from "./shared";
function FilterSearch({
  value,
  onChange,
  placeholder = "Search..."
}) {
  return <label className="relative block min-w-48"><span className="sr-only">{placeholder}</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`${fieldClass} pl-9`} /></label>;
}
export { FilterSearch };
