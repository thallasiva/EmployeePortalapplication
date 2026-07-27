import { useState, useEffect, useCallback } from "react";
import {
  getManagerTimesheets,
  getManagerDashboardCounts,
} from "../../../../api/timesheet.api";

export function useManagerTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [counts, setCounts] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      setTimesheets(await getManagerTimesheets(params));
      setCounts(await getManagerDashboardCounts());
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return { timesheets, loading, filter, setFilter, counts, err, load };
}
