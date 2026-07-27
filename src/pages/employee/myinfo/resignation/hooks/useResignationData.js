import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../../../api/client";

/**
 * Fetches and manages resignation list + employee profile.
 * Returns { resignations, profile, loading, reload }.
 */
export function useResignationData() {
  const [resignations, setResignations] = useState([]);
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        apiClient.get("/resignations/my").then((r) => r.data),
        apiClient.get("/employees/me").then((r) => r.data?.data || r.data),
      ]);
      setResignations(Array.isArray(rRes) ? rRes : []);
      setProfile(pRes);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { resignations, profile, loading, reload };
}
