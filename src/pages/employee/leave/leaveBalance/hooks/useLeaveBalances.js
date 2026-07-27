import { useState, useEffect } from "react";
import { getMyLeaveBalances } from "../../../../../api/leaveRequest.api";

export function useLeaveBalances() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyLeaveBalances({ year })
      .then((rows) => {
        const mapped = (rows || []).map((r) => {
          const granted = Number(r.granted ?? r.annual_quota ?? 0);
          const balance = Number(r.balance ?? r.annual_quota ?? 0);
          const opening = Number(r.opening_balance ?? 0);
          const consumed = Number(r.availed ?? 0);
          const total = granted + opening || Number(r.annual_quota ?? 0) || balance;
          return {
            leaveTypeId: r.leave_type_id,
            title: r.leave_type_name,
            granted,
            balance,
            consumed,
            total,
          };
        });
        setLeaveData(mapped);
      })
      .catch(() => setLeaveData([]))
      .finally(() => setLoading(false));
  }, [year]);

  return { year, setYear, leaveData, loading };
}
