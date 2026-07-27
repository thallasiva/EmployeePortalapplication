import { useState, useEffect, useMemo, useCallback } from "react";
import apiClient, { unwrap } from "../../../../api/client";
import { buildTeams } from "../utils";

export function useTeams() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [extraTeams, setExtraTeams] = useState([]);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get("/employees/org-chart")
      .then(unwrap)
      .then((data) => {
        setRows(data);
        const built = buildTeams(data);
        if (built.length) setExpandedId((prev) => prev || built[0].id);
      })
      .catch((e) => setError(e?.response?.data?.message || "Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const apiTeams = useMemo(() => buildTeams(rows), [rows]);
  const managerCount = apiTeams.length;

  const allTeams = useMemo(() => {
    const combined = [...apiTeams, ...extraTeams];
    if (!search.trim()) return combined;
    const q = search.toLowerCase();
    return combined.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.lead?.name.toLowerCase().includes(q) ||
        t.members.some((m) => m.name.toLowerCase().includes(q))
    );
  }, [apiTeams, extraTeams, search]);

  const handleCreateTeam = useCallback(({ name, department, description }) => {
    setExtraTeams((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        department,
        description: description || "",
        lead: null,
        members: [],
        avgTenure: "—",
        badgeIdx: prev.length,
      },
    ]);
  }, []);

  const toggleExpanded = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return {
    rows,
    loading,
    error,
    expandedId,
    modalOpen,
    setModalOpen,
    search,
    setSearch,
    allTeams,
    managerCount,
    handleCreateTeam,
    fetchData,
    toggleExpanded,
  };
}
