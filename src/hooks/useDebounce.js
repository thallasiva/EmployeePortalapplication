/**
 * useDebounce — delays updating a value until the user stops typing
 * ─────────────────────────────────────────────────────────────────
 * Usage:
 *   const [search, setSearch] = useState("");
 *   const debouncedSearch = useDebounce(search, 400);
 *   // Use debouncedSearch in your API call — it won't fire on every keystroke
 */
import { useEffect, useState } from "react";

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
