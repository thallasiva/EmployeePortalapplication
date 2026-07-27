import { useState, useEffect, useCallback } from "react";
import { getAllAppraisalCycles } from "../../../../api/appraisal.api";

export function useCycles() {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCycles((await getAllAppraisalCycles()) || []); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateInList = useCallback((updated) => {
    setCycles((prev) => prev.map((c) => c.cycle_id === updated.cycle_id ? updated : c));
  }, []);

  const prependCycle = useCallback((newCycle) => {
    setCycles((prev) => [newCycle, ...prev]);
  }, []);

  return { cycles, loading, load, updateInList, prependCycle };
}
