import { memo, useRef } from "react";
import { Search, X } from "lucide-react";

/**
 * Controlled search input with clear button.
 *
 * @param {string}   value
 * @param {function} onChange   — receives new string value (not event)
 * @param {string}   [placeholder]
 * @param {string}   [className] — wrapper className
 * @param {boolean}  [autoFocus]
 */
const SearchInput = memo(function SearchInput({ value, onChange, placeholder = "Search...", className = "", autoFocus = false })
{
  const inputRef = useRef(null);

  const handleClear = () =>
  {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 transition-colors"
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
          type="button"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
