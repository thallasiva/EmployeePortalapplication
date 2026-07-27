import { useState, useEffect, useCallback, useMemo } from "react";
import { usePagination } from "../../../../components/Pagination";
import apiClient from "../../../../api/client";

export function useResignations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/resignations/admin/all");
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
      r.emp_code?.toLowerCase().includes(q) ||
      r.department_name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [rows, filter, search]);

  const counts = useMemo(() => ({
    pending:     rows.filter((r) => r.status === "pending").length,
    rm_approved: rows.filter((r) => r.status === "rm_approved").length,
    accepted:    rows.filter((r) => r.status === "accepted").length,
    rejected:    rows.filter((r) => ["rejected", "rm_rejected"].includes(r.status)).length,
  }), [rows]);

  const pagination = usePagination(visible);

  return {
    loading, error,
    search, setSearch, filter, setFilter,
    reviewing, setReviewing,
    load, visible, counts, pagination,
  };
}
