import { useState, useEffect, useCallback, useMemo } from "react";
import { getTeamAppraisals } from "../../../../api/appraisal.api";
export function usePerformanceAppraisal() {
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState(null);
  const [team, setTeam] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getTeamAppraisals();
      setCycle(d.cycle);
      setTeam(d.team || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load team appraisals.");
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const submitted = useMemo(
    () => team.filter((m) => ["submitted", "manager_review", "approved"].includes(m.appraisal_status)),
    [team]
  );
  const pending = useMemo(
    () => team.filter((m) => m.appraisal_status === "draft" || !m.appraisal_status),
    [team]
  );
  const reviewed = useMemo(
    () => team.filter((m) => ["hr_review", "changes_requested", "shared", "acknowledged", "closed"].includes(m.appraisal_status)),
    [team]
  );
  const isActive = cycle?.status === "active";
  return { loading, cycle, team, submitted, pending, reviewed, isActive, error, load };
}
