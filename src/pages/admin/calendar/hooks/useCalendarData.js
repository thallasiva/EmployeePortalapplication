import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDashboardStats, getDashboardEvents } from '../../../../api/dashboard.api';
import { listHolidays } from '../../../../api/holiday.api';
import { listLeaveRequests } from '../../../../api/leaveRequest.api';
import { listCalendarEvents, deleteCalendarEvent } from '../../../../api/calendar.api';
import { errorToast, successToast } from '../../../../utils/ToastControllers';
import { toYMD, sameMonthDay, leaveCoversDay } from '../utils/calendarUtils';

export function useCalendarData(year, month, typeFilter) {
  const today = useMemo(() => new Date(), []);

  const [stats, setStats] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, holidayData, leaveData, birthdayData, eventData] =
        await Promise.allSettled([
          getDashboardStats(),
          listHolidays({ year, limit: 200 }),
          listLeaveRequests({ status: 'approved', limit: 500 }),
          getDashboardEvents(month),
          listCalendarEvents({ year, month, limit: 200 }),
        ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value || {});
      if (holidayData.status === 'fulfilled') setHolidays(holidayData.value?.data || []);
      if (leaveData.status === 'fulfilled') setLeaves(leaveData.value?.data || []);
      if (birthdayData.status === 'fulfilled') setBirthdays(birthdayData.value || []);
      if (eventData.status === 'fulfilled') setCustomEvents(eventData.value?.data || []);
    } catch {
      // errors handled per-settled above
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const eventMap = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      const key = toYMD(dateStr);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    };

    holidays.forEach((h) => {
      addEvent(h.holiday_date, { type: 'holiday', label: h.holiday_name, id: `h-${h.holiday_id}` });
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    leaves.forEach((lr) => {
      const empName =
        lr.employee_name || `${lr.first_name || ''} ${lr.last_name || ''}`.trim() || 'Employee';
      for (let d = 1; d <= daysInMonth; d++) {
        if (leaveCoversDay(lr.from_date, lr.to_date, year, month, d)) {
          const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (!map[key]) map[key] = [];
          if (!map[key].some((e) => e.id === `l-${lr.leave_request_id}-${d}`)) {
            map[key].push({
              type: 'leave',
              label: `${empName} Leave`,
              id: `l-${lr.leave_request_id}-${d}`,
              raw: lr,
            });
          }
        }
      }
    });

    birthdays.forEach((emp) => {
      const name = emp.employee_name || 'Employee';
      if (emp.dob && sameMonthDay(emp.dob, undefined, month)) {
        const d = new Date(emp.dob);
        const key = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'birthday', label: `${name} Birthday`, id: `b-${emp.employee_id}` });
      }
      if (emp.emp_joining_date && sameMonthDay(emp.emp_joining_date, undefined, month)) {
        const d = new Date(emp.emp_joining_date);
        const key = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'anniversary', label: `${name} Anniversary`, id: `a-${emp.employee_id}` });
      }
    });

    customEvents.forEach((ce) => {
      addEvent(ce.event_date, {
        type: ce.event_type?.toLowerCase() || 'training',
        label: ce.title,
        id: `ce-${ce.event_id}`,
        event_id: ce.event_id,
        deletable: true,
      });
    });

    return map;
  }, [holidays, leaves, birthdays, customEvents, year, month]);

  const filteredMap = useMemo(() => {
    if (typeFilter === 'all') return eventMap;
    const filtered = {};
    Object.entries(eventMap).forEach(([date, events]) => {
      const evts = events.filter((e) => e.type === typeFilter);
      if (evts.length) filtered[date] = evts;
    });
    return filtered;
  }, [eventMap, typeFilter]);

  const totalEmployees = stats.employees_count ?? stats.total_employees ?? '—';

  const onLeaveTodayCount = useMemo(() => {
    const todayStr = toYMD(today);
    return (
      (filteredMap[todayStr] || []).filter((e) => e.type === 'leave').length ||
      leaves.filter((lr) =>
        leaveCoversDay(
          lr.from_date,
          lr.to_date,
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        )
      ).length
    );
  }, [leaves, filteredMap, today]);

  const birthdaysThisMonth = useMemo(
    () => Object.values(eventMap).flat().filter((e) => e.type === 'birthday').length,
    [eventMap]
  );

  const holidaysThisMonth = useMemo(
    () =>
      holidays.filter((h) => {
        const d = new Date(h.holiday_date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }).length,
    [holidays, year, month]
  );

  const upcomingEvents = useMemo(() => {
    const results = [];
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 30);

    Object.entries(eventMap).forEach(([dateStr, events]) => {
      const d = new Date(dateStr);
      if (d >= now && d <= limit) {
        events.forEach((evt) => results.push({ ...evt, date: dateStr, dateObj: d }));
      }
    });

    return results.sort((a, b) => a.dateObj - b.dateObj).slice(0, 6);
  }, [eventMap]);

  const handleDeleteEvent = useCallback(
    async (event_id) => {
      try {
        await deleteCalendarEvent(event_id);
        successToast('Event removed');
        fetchData();
      } catch {
        errorToast('Failed to delete event');
      }
    },
    [fetchData]
  );

  return {
    today,
    loading,
    eventMap,
    filteredMap,
    totalEmployees,
    onLeaveTodayCount,
    birthdaysThisMonth,
    holidaysThisMonth,
    upcomingEvents,
    fetchData,
    handleDeleteEvent,
  };
}
