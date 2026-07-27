import { useState, useCallback, useEffect, useMemo } from "react";
import {
  listHolidays,
  listHolidayLocations,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../../../api/holiday.api";

export function useHolidays(year) {
  const [allHolidays, setAll] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hols, locs] = await Promise.all([
        listHolidays({ year, limit: 500 }).catch(() => []),
        listHolidayLocations().catch(() => []),
      ]);
      setAll(Array.isArray(hols) ? hols : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async (form) => {
    if (form.holiday_id) {
      await updateHoliday(form.holiday_id, form);
    } else {
      await createHoliday(form);
    }
    showToast(form.holiday_id ? "Holiday updated" : "Holiday added");
    load();
  }, [load, showToast]);

  const handleDelete = useCallback(async (h) => {
    if (!window.confirm(`Delete "${h.holiday_name}"?`)) return;
    try {
      await deleteHoliday(h.holiday_id);
      showToast("Deleted");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [load, showToast]);

  const handleCSVImported = useCallback((count) => {
    showToast(`${count} holidays imported and distributed by shift`);
    load();
  }, [load, showToast]);

  const allLocations = useMemo(() => {
    const s = new Set([...locations, ...allHolidays.map((h) => h.location).filter(Boolean)]);
    return [...s];
  }, [allHolidays, locations]);

  return {
    allHolidays,
    allLocations,
    loading,
    toast,
    handleSave,
    handleDelete,
    handleCSVImported,
  };
}
