import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyLeaveRequests, listLeaveRequests } from "../../../../../api/leaveRequest.api";
import { listHolidays } from "../../../../../api/holiday.api";
import { getStoredUser, isAdmin, isReportingManager } from "../../../../../data/auth";
import { fmt, expandDates } from "../utils";

export function useLeaveCalendar() {
  const user = getStoredUser();
  const canViewAll = isAdmin(user) || isReportingManager(user);

  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [filterType, setFilterType] = useState("Me");
  const [search, setSearch] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const month = viewDate.getMonth() + 1;
  const year = viewDate.getFullYear();

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const from = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      let data = [];
      if (filterType === "Me") {
        const res = await getMyLeaveRequests({ status: "Approved", limit: 200 });
        data = res.data || [];
      } else {
        const res = await listLeaveRequests({ status: "Approved", limit: 200 });
        data = res.data || [];
      }

      data = data.filter((lr) => {
        const lrFrom = lr.from_date?.split("T")[0] || lr.from_date;
        const lrTo = lr.to_date?.split("T")[0] || lr.to_date;
        return lrFrom <= to && lrTo >= from;
      });

      setLeaves(data);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [month, year, filterType]);

  const loadHolidays = useCallback(async () => {
    try {
      const res = await listHolidays({ year, limit: 100 });
      setHolidays(res.data || []);
    } catch {
      setHolidays([]);
    }
  }, [year]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);
  useEffect(() => { loadHolidays(); }, [loadHolidays]);

  const leaveByDate = useMemo(() => {
    const map = {};
    leaves.forEach((lr) => {
      const from = lr.from_date?.split("T")[0];
      const to = lr.to_date?.split("T")[0];
      if (!from || !to) return;
      expandDates(from, to).forEach((d) => {
        if (!map[d]) map[d] = [];
        map[d].push(lr);
      });
    });
    return map;
  }, [leaves]);

  const holidayByDate = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      const d = h.holiday_date?.split("T")[0];
      if (d) map[d] = h;
    });
    return map;
  }, [holidays]);

  const selectedStr = fmt(selected);
  const selectedHoliday = holidayByDate[selectedStr];
  const selectedLeaves = leaveByDate[selectedStr] || [];

  const monthLeaves = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaves;
    return leaves.filter(
      (lr) =>
        (lr.employee_name || "").toLowerCase().includes(q) ||
        (lr.leave_type_name || "").toLowerCase().includes(q)
    );
  }, [leaves, search]);

  return {
    user,
    canViewAll,
    viewDate,
    setViewDate,
    selected,
    setSelected,
    filterType,
    setFilterType,
    search,
    setSearch,
    leaves,
    loading,
    month,
    year,
    leaveByDate,
    holidayByDate,
    selectedHoliday,
    selectedLeaves,
    monthLeaves,
  };
}
