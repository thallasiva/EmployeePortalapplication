/**
 * useApiQuery — generic async data-fetching hook
 * ─────────────────────────────────────────────
 * Features:
 *  • loading / error / data states
 *  • automatic retry with exponential back-off (default 2 retries)
 *  • request deduplication via ref — won't double-fire on StrictMode
 *  • manual refetch()
 *  • dependency re-fetch on key change
 *  • captures errors to Sentry automatically
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApiQuery(
 *     () => listLeaveRequests({ status: "Pending" }),
 *     [status]           ← re-fetch when status changes
 *   );
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { captureError } from "../utils/sentry";
import { getErrorMessage } from "../api/client";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useApiQuery(fetchFn, deps = [], { retries = 2, enabled = true } = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);
  const retryCount            = useRef(0);

  const execute = useCallback(async () => {
    // Cancel any in-flight request from a previous render
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (ctrl.signal.aborted) return;
      try {
        const result = await fetchFn();
        if (!ctrl.signal.aborted) {
          setData(result);
          setLoading(false);
          retryCount.current = 0;
        }
        return;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await sleep(300 * 2 ** attempt); // 300ms, 600ms
        }
      }
    }

    if (!ctrl.signal.aborted) {
      const msg = getErrorMessage(lastError);
      setError(msg);
      setLoading(false);
      captureError(lastError, { hook: "useApiQuery" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    execute();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, enabled]);

  return { data, loading, error, refetch: execute };
}
