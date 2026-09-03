import { useState, useEffect, useCallback, useMemo } from "react";
import { listLeaveRequests, reviewLeaveRequest } from "../../../../api/leaveRequest.api";
import { listAttendance } from "../../../../api/attendance.api";
import { listEmployees } from "../../../../api/employee.api";
import { apiErrorToast, successToast, errorToast } from "../../../../utils/ToastControllers";

export function useTeamOverview() {
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [att, setAtt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      listEmployees({ status: "Active", limit: 500 })
        .then((r) => setTeam(Array.isArray(r) ? r : r?.rows ?? r?.data ?? []))
        .catch(() => {}),
      listLeaveRequests({})
        .then((r) => setLeaves(Array.isArray(r) ? r : r?.data ?? []))
        .catch(() => {}),
      listAttendance({ from_date: today, to_date: today, limit: 500 })
        .then(({ data }) => setAtt(data || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(
    () => ({
      presentToday: att.filter((a) => (a.status || "").toLowerCase() === "present").length,
      absentToday: att.filter((a) => (a.status || "").toLowerCase() === "absent").length,
      lateToday: att.filter((a) => (a.status || "").toLowerCase() === "late").length,
      pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
    }),
    [att, leaves]
  );

  const departments = useMemo(() => {
    const s = new Set(
      team.map((e) => e.department_name || e.department || "").filter(Boolean)
    );
    return ["All", ...Array.from(s).sort()];
  }, [team]);

  const deptBreakdown = useMemo(() => {
    const map = {};
    team.forEach((e) => {
      const d = e.department_name || e.department || "Other";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [team]);

  const pendingLeavesRows = useMemo(
    () => leaves.filter((l) => l.status === "Pending").slice(0, 8),
    [leaves]
  );

  const handleLeave = useCallback(
    async (id, action) => {
      setReviewing(id);
      try {
        await reviewLeaveRequest(id, {
          status: action === "approve" ? "Approved" : "Rejected",
        });
        successToast(`Leave ${action === "approve" ? "approved" : "rejected"}`);
        load();
      } catch (err) {
        apiErrorToast(err, "complete this action");
      } finally {
        setReviewing(null);
      }
    },
    [load]
  );

  return {
    team,
    att,
    leaves,
    loading,
    kpis,
    departments,
    deptBreakdown,
    pendingLeavesRows,
    reviewing,
    handleLeave,
  };
}
