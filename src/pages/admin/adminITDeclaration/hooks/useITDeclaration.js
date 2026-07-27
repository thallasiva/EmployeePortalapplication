import { useState, useEffect, useCallback, useMemo } from "react";
import { usePagination } from "../../../../components/Pagination";
import {
  getAllITCycles, toggleITCycle, getAllITDeclarations,
} from "../../../../api/itDeclaration.api";

export function useITDeclaration() {
  const [cycle, setCycle] = useState(null);
  const [data, setData] = useState({ declarations: [] });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [tab, setTab] = useState("submissions");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cyclesRes, declRes] = await Promise.all([
        getAllITCycles().catch(() => []),
        getAllITDeclarations().catch(() => ({ cycle: null, declarations: [] })),
      ]);
      const all = Array.isArray(cyclesRes) ? cyclesRes : [];
      setCycle(all[0] || declRes.cycle || null);
      setData(declRes);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async () => {
    if (!cycle) return;
    setToggling(true);
    try {
      const updated = await toggleITCycle(cycle.cycle_id);
      setCycle(updated);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || "Error");
    }
    setToggling(false);
  }, [cycle, load]);

  const isActive = cycle?.status === "active";

  const visible = useMemo(() => {
    let list = data.declarations || [];
    if (filter !== "all") {
      list = list.filter((r) => (r.declaration?.status || "not_started") === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.employee_name?.toLowerCase().includes(q) ||
        r.emp_code?.toLowerCase().includes(q) ||
        r.department_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.declarations, filter, search]);

  const stats = useMemo(() => {
    const list = data.declarations || [];
    return {
      total:       list.length,
      submitted:   list.filter((r) => r.declaration?.status === "submitted").length,
      approved:    list.filter((r) => r.declaration?.status === "approved").length,
      rejected:    list.filter((r) => r.declaration?.status === "rejected").length,
      not_started: list.filter((r) => !r.declaration?.status || r.declaration?.status === "not_started").length,
    };
  }, [data.declarations]);

  const pagination = usePagination(visible);

  return {
    cycle, loading, toggling, tab, setTab,
    search, setSearch, filter, setFilter,
    isActive, visible, stats, pagination, load, handleToggle,
  };
}
