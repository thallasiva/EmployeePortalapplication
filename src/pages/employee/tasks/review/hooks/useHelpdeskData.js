import { useState, useEffect } from "react";
import { myTickets, teamTickets, allTickets } from "../../../../../api/helpdesk.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../../../data/auth";
import { toArr } from "../utils";

/** Fetches helpdesk tickets (own / team / all depending on role). Returns { rows, loading, isPrivileged }. */
export function useHelpdeskData() {
  const user = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    const fetcher = isAdmin(user)
      ? allTickets()
      : isReportingManager(user)
      ? teamTickets()
      : myTickets();

    Promise.resolve(fetcher)
      .then((res) => { if (!dead) setRows(toArr(res)); })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, []);

  return { rows, loading, isPrivileged };
}
