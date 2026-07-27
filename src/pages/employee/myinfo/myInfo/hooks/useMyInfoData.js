import { useState, useEffect, useCallback } from "react";
import apiClient, { unwrap } from "../../../../../api/client";

/**
 * Fetches employee profile + active resignation.
 * Returns { profile, resignation, loading, error, loadResignation, setResignation }.
 */
export function useMyInfoData() {
  const [profile,     setProfile]     = useState(null);
  const [resignation, setResignation] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const loadResignation = useCallback(async () => {
    try {
      const res = await apiClient.get("/resignations/my");
      setResignation(res.data || null);
    } catch {
      setResignation(null);
    }
  }, []);

  useEffect(() => {
    apiClient.get("/employees/me")
      .then(unwrap)
      .then(setProfile)
      .catch((e) => setError(e?.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
    loadResignation();
  }, [loadResignation]);

  return { profile, resignation, setResignation, loading, error, loadResignation };
}
