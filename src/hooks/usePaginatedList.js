








import { useCallback, useEffect, useRef, useState } from "react";
import { captureError } from "../utils/sentry";
import { getErrorMessage } from "../api/client";

export const DEFAULT_PAGE_SIZE = 20;

export function usePaginatedList(fetchFn, deps = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async (p) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const offset = (p - 1) * pageSize;
      const result = await fetchFn({ limit: pageSize, offset });
      if (!ctrl.signal.aborted) {

        setRows(result.data ?? result.rows ?? []);
        setTotal(result.meta?.total ?? result.total ?? 0);
        setLoading(false);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        setError(getErrorMessage(err));
        setLoading(false);
        captureError(err, { hook: "usePaginatedList" });
      }
    }

  }, [pageSize, ...deps]);


  useEffect(() => {
    setPage(1);
    load(1);
    return () => abortRef.current?.abort();

  }, [load]);


  const goToPage = useCallback((p) => {
    setPage(p);
    load(p);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { rows, total, page, totalPages, goToPage, loading, error, refetch: () => load(page) };
}
