import { useState, useEffect } from "react";
import { getMyLeaveRequests, listLeaveRequests } from "../../../../../api/leaveRequest.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../../../data/auth";
import { toArr } from "../utils";

/**
 * Fetches leave requests. mode="cancel" pre-filters to cancelled statuses.
 * Returns { rows, loading, isPrivileged }.
 */
export function useLeaveData(mode) {
  const user = getStoredUser();
  const isPrivileged = isAdmin(user) || isReportingManager(user);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    setLoading(true);
    const fetcher = isPrivileged
      ? listLeaveRequests({ limit: 200 })
      : getMyLeaveRequests({ limit: 100 });

    Promise.resolve(fetcher)
      .then((res) => {
        if (dead) return;
        const all = toArr(res);
        if (mode === "cancel") {
          setRows(
            all.filter((r) =>
              ["cancelled", "Cancelled", "cancel_pending", "approved_pending_cancel"].includes(r.status)
            )
          );
        } else {
          setRows(all);
        }
      })
      .catch(() => { if (!dead) setRows([]); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [isPrivileged, mode]);

  return { rows, loading, isPrivileged };
}
