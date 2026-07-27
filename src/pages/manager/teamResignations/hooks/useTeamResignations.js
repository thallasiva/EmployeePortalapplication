import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../../../api/client";

export function useTeamResignations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/resignations/manager/team");
      const data = res.data;
      setRows(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load resignations");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => rows.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.employee_name?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [rows, filter, search]);

  const pending = useMemo(
    () => rows.filter((r) => r.status === "pending").length,
    [rows]
  );

  return { rows, loading, error, search, setSearch, filter, setFilter, visible, pending, load };
}
