import { useCallback, useState } from "react";
import { captureError } from "../utils/sentry";
import { getErrorMessage } from "../api/client";

/**
 * Lightweight hook for one-shot async operations (mutations, submit, delete, etc.).
 * For data-fetching with auto-run on mount, use `useApiQuery` instead.
 *
 * @returns {{
 *   loading: boolean,
 *   error:   string | null,
 *   run:     (asyncFn: () => Promise, callbacks?: { onSuccess, onError }) => Promise,
 *   reset:   () => void,
 * }}
 *
 * @example
 * const { loading, error, run } = useAsync();
 *
 * const handleDelete = () => run(
 *   () => deleteEmployee(id),
 *   {
 *     onSuccess: () => { toast.success("Deleted"); refetch(); },
 *     onError:   (msg) => toast.error(msg),
 *   }
 * );
 */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (asyncFn, { onSuccess, onError } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      captureError(err, { hook: "useAsync" });
      onError?.(msg, err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, run, reset };
}
