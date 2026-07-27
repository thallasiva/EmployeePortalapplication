import { useState, useEffect, useCallback, useMemo } from "react";
import { getTeamAppraisals } from "../../../../api/appraisal.api";

export function usePerformanceAppraisal() {
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(null);
  const [team, setTeam] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getTeamAppraisals();
      setCycle(d.cycle);
      setTeam(d.team || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitted = useMemo(
    () => team.filter((m) => m.appraisal_status === "submitted" || m.appraisal_status === "approved"),
    [team]
  );

  const pending = useMemo(
    () => team.filter((m) => m.appraisal_status === "draft" || !m.appraisal_status),
    [team]
  );

  const isActive = cycle?.status === "active";

  return { loading, cycle, team, submitted, pending, isActive, load };
}
