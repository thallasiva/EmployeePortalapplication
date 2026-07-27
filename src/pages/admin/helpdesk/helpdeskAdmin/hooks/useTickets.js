import { useState, useCallback, useEffect } from "react";
import { allTickets, teamTickets } from "../../../../../api/helpdesk.api";

export function useTickets({ isAdminUser, defaultTeam }) {
  const [tickets, setTickets]   = useState([]);
  const [total,   setTotal]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [statusF, setStatusF]   = useState("");
  const [teamF,   setTeamF]     = useState(defaultTeam);
  const [page,    setPage]      = useState(1);
  const [limit,   setLimit]     = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit, offset: (page - 1) * limit,
        ...(search  ? { search }                     : {}),
        ...(statusF ? { status: statusF }            : {}),
        ...(teamF   ? { forwarded_to_team: teamF }   : {}),
      };
      const fn = isAdminUser ? allTickets : teamTickets;
      const data = await fn(params);
      setTickets(Array.isArray(data) ? data : data?.rows || []);
      setTotal(data?.total || 0);
    } catch {
      setTickets([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [isAdminUser, page, search, statusF, teamF, limit]);

  useEffect(() => { load(); }, [load]);

  const handleSearch       = useCallback((v) => { setSearch(v);  setPage(1); }, []);
  const handleStatusChange = useCallback((v) => { setStatusF(v); setPage(1); }, []);
  const handleTeamChange   = useCallback((v) => { setTeamF(v);   setPage(1); }, []);
  const handleClear        = useCallback(() => {
    setSearch(""); setStatusF(""); if (!isAdminUser) setTeamF(""); setPage(1);
  }, [isAdminUser]);

  return {
    tickets, total, loading,
    search, statusF, teamF, page, limit,
    setPage, setLimit, load,
    handleSearch, handleStatusChange, handleTeamChange, handleClear,
  };
}
