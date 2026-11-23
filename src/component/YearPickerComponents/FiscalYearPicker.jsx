import { Calendar } from "lucide-react";
import { getCurrentFiscalYearStart, getYearOptions } from "../../lib/dateUtils";
function FiscalYearPicker({
  value,
  onChange,
  className = "",
  selectClassName = ""
}) {
  const startYear = value ?? String(getCurrentFiscalYearStart());
  const years = getYearOptions();
  return <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <Calendar size={18} className="text-brand shrink-0" aria-hidden />
      <select value={startYear} onChange={e => onChange(e.target.value)} aria-label="Select fiscal year" className={selectClassName || "h-10 min-w-[7.5rem] border border-gray-200 rounded-lg bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"}>
        {years.map(year => <option key={year} value={String(year)}>
            {year} - {year + 1}
          </option>)}
      </select>
    </label>;
}
export { FiscalYearPicker };
