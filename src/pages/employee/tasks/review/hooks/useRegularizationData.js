import { useState, useEffect } from "react";
import { listRegularizations } from "../../../../../api/attendance.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../../../data/auth";
import { toArr } from "../utils";

/** Fetches regularization records. Returns { rows, loading, isPrivileged }. */
export function useRegularizationData() {
  const user = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    Promise.resolve(listRegularizations({ limit: 200 }))
      .then((res) => { if (!dead) setRows(toArr(res)); })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, []);

  return { rows, loading, isPrivileged };
}
