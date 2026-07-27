import { useState, useCallback, useMemo } from "react";
import { listWorkSchedules, saveEmployeeSchedule, resetEmployeeSchedule } from "../../../../api/workSchedule.api";
import { listEmployees } from "../../../../api/employee.api";
import { successToast, errorToast } from "../../../../utils/ToastControllers";

const toRow = (e) => ({
  employee_id: e.employee_id,
  employee_name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
  emp_code: e.emp_code,
  emp_job_title: e.emp_job_title || e.designation,
  employee_status: e.employee_status,
  department_name: e.department_name,
  schedule_id: null, schedule_type: null, work_days: null,
  start_time: null, end_time: null,
});

export function useEmployeeSchedules() {
  const [empSchedules, setEmpSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedSearch, setSchedSearch] = useState("");
  const [empDropOpen, setEmpDropOpen] = useState(false);
  const [checkedEmps, setCheckedEmps] = useState(new Set());
  const [bulkForm, setBulkForm] = useState({
    schedule_type: "fixed",
    work_days: ["mon", "tue", "wed", "thu", "fri"],
    start_time: "09:00",
    end_time: "18:00",
    rotation_pattern: "",
  });
  const [bulkSaving, setBulkSaving] = useState(false);

  const filteredEmpScheds = useMemo(() => {
    const q = schedSearch.trim().toLowerCase();
    if (!q) return empSchedules;
    return empSchedules.filter((e) =>
      (e.employee_name || "").toLowerCase().includes(q) ||
      (e.department_name || "").toLowerCase().includes(q) ||
      (e.emp_job_title || "").toLowerCase().includes(q)
    );
  }, [empSchedules, schedSearch]);

  const loadEmpSchedules = useCallback(async () => {
    setSchedLoading(true);
    try {
      const data = await listWorkSchedules();
      if (Array.isArray(data) && data.length > 0) {
        setEmpSchedules(data);
      } else {
        const res = await listEmployees({ limit: 500 });
        setEmpSchedules((res?.data || []).map(toRow));
      }
    } catch {
      try {
        const res = await listEmployees({ limit: 500 });
        setEmpSchedules((res?.data || []).map(toRow));
      } catch {}
    } finally {
      setSchedLoading(false);
    }
  }, []);

  const toggleBulkDay = useCallback((dayId) => {
    setBulkForm((f) => {
      const days = new Set(f.work_days || []);
      if (days.has(dayId)) days.delete(dayId); else days.add(dayId);
      return { ...f, work_days: [...days] };
    });
  }, []);

  const toggleCheck = useCallback((empId) => {
    setCheckedEmps((s) => {
      const n = new Set(s);
      if (n.has(empId)) n.delete(empId); else n.add(empId);
      return n;
    });
  }, []);

  const toggleAll = useCallback((currentFiltered) => {
    if (checkedEmps.size === currentFiltered.length) {
      setCheckedEmps(new Set());
    } else {
      setCheckedEmps(new Set(currentFiltered.map((e) => e.employee_id)));
    }
  }, [checkedEmps.size]);

  const applyBulk = useCallback(async () => {
    if (!checkedEmps.size) return;
    setBulkSaving(true);
    let saved = 0, failed = 0;
    for (const empId of checkedEmps) {
      try { await saveEmployeeSchedule(empId, bulkForm); saved++; }
      catch { failed++; }
    }
    if (failed === 0) successToast(`Schedule applied to ${saved} employee${saved > 1 ? "s" : ""}`);
    else errorToast(`${saved} saved, ${failed} failed`);
    setCheckedEmps(new Set());
    await loadEmpSchedules();
    setBulkSaving(false);
  }, [checkedEmps, bulkForm, loadEmpSchedules]);

  const resetSched = useCallback(async (empId) => {
    try {
      await resetEmployeeSchedule(empId);
      successToast("Schedule reset to company default");
      await loadEmpSchedules();
    } catch {
      errorToast("Failed to reset schedule");
    }
  }, [loadEmpSchedules]);

  return {
    empSchedules, schedLoading,
    schedSearch, setSchedSearch,
    empDropOpen, setEmpDropOpen,
    checkedEmps, setCheckedEmps,
    bulkForm, setBulkForm,
    bulkSaving,
    filteredEmpScheds,
    loadEmpSchedules, toggleBulkDay, toggleCheck, toggleAll, applyBulk, resetSched,
  };
}
