import { Calendar } from "lucide-react";
import { getCurrentFiscalYearStart, getYearOptions } from "../lib/dateUtils";

/**
 * Year selector with calendar icon — options derived from current date (not hardcoded).
 */
export function YearPicker({
  value,
  onChange,
  className = "",
  selectClassName = "",
  showIcon = true,
  ariaLabel = "Select year",
}) {
  const years = getYearOptions();

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      {showIcon && (
        <Calendar size={18} className="text-brand shrink-0" aria-hidden />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={
          selectClassName ||
          "h-10 min-w-[5.5rem] border border-gray-200 rounded-lg bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        }
      >
        {years.map((year) => (
          <option key={year} value={String(year)}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Fiscal year (Apr–Mar) selector — shows e.g. "2025 - 2026".
 */
export function FiscalYearPicker({
  value,
  onChange,
  className = "",
  selectClassName = "",
}) {
  const startYear = value ?? String(getCurrentFiscalYearStart());
  const years = getYearOptions();

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      <Calendar size={18} className="text-brand shrink-0" aria-hidden />
      <select
        value={startYear}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select fiscal year"
        className={
          selectClassName ||
          "h-10 min-w-[7.5rem] border border-gray-200 rounded-lg bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        }
      >
        {years.map((year) => (
          <option key={year} value={String(year)}>
            {year} - {year + 1}
          </option>
        ))}
      </select>
    </label>
  );
}

export default YearPicker;
