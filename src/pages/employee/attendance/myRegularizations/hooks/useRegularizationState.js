import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser, toISODateString } from "../../../../../lib/dateUtils";
import { EXCEPTION_DAYS } from "../../../../../data/regularizations";
import { DEFAULT_EXCEPTION_ISO } from "../constants";
import { getMonthGrid } from "../utils/calendarUtils";

export function useRegularizationState(onBack) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate("/employee/attendance/daily"));
  const user = getLoggedInUser();

  const today = new Date();
  const [tab, setTab] = useState("apply");
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedIso, setSelectedIso] = useState(DEFAULT_EXCEPTION_ISO);
  const [expandedId, setExpandedId] = useState(1);
  const [detailRecord, setDetailRecord] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [reason, setReason] = useState("Early Logout");
  const [firstIn, setFirstIn] = useState("10:00");
  const [lastOut, setLastOut] = useState("19:00");

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthLabel = viewDate
    .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    .toUpperCase();

  const grid = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);
  const todayIso = toISODateString(today);

  const isException = useCallback((date) => {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;
    return EXCEPTION_DAYS.has(key);
  }, []);

  const prevMonth = useCallback(
    () => setViewDate(new Date(year, monthIndex - 1, 1)),
    [year, monthIndex]
  );

  const nextMonth = useCallback(
    () => setViewDate(new Date(year, monthIndex + 1, 1)),
    [year, monthIndex]
  );

  const toggleHistory = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const submitRegularization = useCallback(() => {
    const dateLabel = new Date(selectedIso + "T12:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setPendingItems((prev) => [
      {
        id: Date.now(),
        datesApplied: dateLabel,
        reason,
        firstIn,
        lastOut,
        status: "PENDING",
        submittedBy: user?.name || "Employee",
      },
      ...prev,
    ]);
    setTab("pending");
  }, [selectedIso, reason, firstIn, lastOut, user]);

  return {
    goBack,
    tab,
    setTab,
    year,
    monthIndex,
    monthLabel,
    grid,
    todayIso,
    selectedIso,
    setSelectedIso,
    expandedId,
    toggleHistory,
    detailRecord,
    setDetailRecord,
    pendingItems,
    reason,
    setReason,
    firstIn,
    setFirstIn,
    lastOut,
    setLastOut,
    isException,
    prevMonth,
    nextMonth,
    submitRegularization,
  };
}
