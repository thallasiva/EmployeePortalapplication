import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "./useDebounce";

/**
 * Client-side search + multi-key filter hook.
 * Eliminates the duplicated filter/search logic scattered across list pages.
 *
 * @param {Array}  items                    — raw data array
 * @param {object} options
 * @param {string[]} [options.searchFields] — which keys to full-text search
 * @param {object}   [options.initialFilters] — { key: value }
 * @param {number}   [options.debounceMs=300]
 *
 * @returns {{
 *   filtered:     Array,
 *   search:       string,
 *   setSearch:    (q: string) => void,
 *   filters:      object,
 *   setFilter:    (key: string, value: any) => void,
 *   clearFilters: () => void,
 *   hasActiveFilters: boolean,
 * }}
 *
 * @example
 * const { filtered, search, setSearch, setFilter } = useFilter(employees, {
 *   searchFields: ["name", "email", "emp_code"],
 *   initialFilters: { department: "", status: "" },
 * });
 */
export function useFilter(items, { searchFields = [], initialFilters = {}, debounceMs = 300 } = {}) {
  const [search,  setSearch]  = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const debouncedSearch = useDebounce(search, debounceMs);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilters(initialFilters);
  }, [initialFilters]);

  const filtered = useMemo(() => {
    if (!items) return [];

    let result = items;

    /* full-text search */
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) =>
          String(item[field] ?? "").toLowerCase().includes(q)
        )
      );
    }

    /* discrete filters */
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value != null && value !== "all") {
        result = result.filter((item) => String(item[key] ?? "") === String(value));
      }
    });

    return result;
  }, [items, debouncedSearch, filters, searchFields]);

  const hasActiveFilters = useMemo(
    () => search !== "" || Object.values(filters).some((v) => v !== "" && v != null && v !== "all"),
    [search, filters]
  );

  return { filtered, search, setSearch, filters, setFilter, clearFilters, hasActiveFilters };
}
