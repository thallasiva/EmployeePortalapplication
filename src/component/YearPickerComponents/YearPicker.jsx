import { Calendar } from "lucide-react";
import { getYearOptions } from "../../lib/dateUtils";
function YearPicker({
  value,
  onChange,
  className = "",
  selectClassName = "",
  showIcon = true,
  ariaLabel = "Select year"
}) {
  const years = getYearOptions();
  return <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      {showIcon && <Calendar size={18} className="text-brand shrink-0" aria-hidden />}
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={ariaLabel} className={selectClassName || "h-10 min-w-[5.5rem] border border-gray-200 rounded-lg bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"}>
        {years.map(year => <option key={year} value={String(year)}>
            {year}
          </option>)}
      </select>
    </label>;
}
export { YearPicker };
