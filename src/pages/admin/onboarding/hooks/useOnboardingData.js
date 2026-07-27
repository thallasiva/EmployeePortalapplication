import { useState, useEffect, useMemo, useCallback } from "react";
import { listEmployees } from "../../../../api/employee.api";
import { listDocuments } from "../../../../api/document.api";
import { errorToast } from "../../../../utils/ToastControllers";
import { ONBOARDING_DAYS, CHECKLIST_TEMPLATE } from "../constants";
import {
  daysSince,
  progressFromDays,
  buildChecklist,
} from "../utils";

export function useOnboardingData() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [employeeDocs, setEmployeeDocs] = useState({});
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listEmployees({ limit: 200, status: "active" })
      .then(({ data }) => setEmployees(data || []))
      .catch(() => errorToast("Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  const { activeOnboardings, completedOnboardings } = useMemo(() => {
    const active = [];
    const completed = [];
    employees.forEach((emp) => {
      if (daysSince(emp.date_of_joining) <= ONBOARDING_DAYS) active.push(emp);
      else completed.push(emp);
    });
    return { activeOnboardings: active, completedOnboardings: completed };
  }, [employees]);

  const overdueTasks = useMemo(() => {
    return activeOnboardings
      .filter((emp) => daysSince(emp.date_of_joining) > 7)
      .flatMap((emp) => {
        const days = daysSince(emp.date_of_joining);
        return CHECKLIST_TEMPLATE.flatMap((group) =>
          group.items
            .filter((item) => item.dueDays <= days - 7)
            .map((item) => ({
              title: item.title,
              owner: `${emp.first_name} ${emp.last_name || ""}`.trim(),
              dueDays: item.dueDays,
            }))
        );
      })
      .slice(0, 5);
  }, [activeOnboardings]);

  const avgDays = useMemo(() => {
    if (!activeOnboardings.length) return "—";
    const total = activeOnboardings.reduce(
      (sum, e) => sum + daysSince(e.date_of_joining),
      0
    );
    return `${Math.round(total / activeOnboardings.length)}d`;
  }, [activeOnboardings]);

  const loadDocsForEmployee = useCallback(
    async (emp) => {
      if (!emp) return;
      const id = emp.employee_id;
      if (employeeDocs[id] !== undefined) return;
      setDocsLoading(true);
      try {
        const { data } = await listDocuments({ employee_id: id, limit: 100 });
        setEmployeeDocs((prev) => ({ ...prev, [id]: data || [] }));
      } catch {
        setEmployeeDocs((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setDocsLoading(false);
      }
    },
    [employeeDocs]
  );

  const handleSelectEmployee = useCallback(
    (emp) => {
      setSelectedEmployee(emp);
      loadDocsForEmployee(emp);
    },
    [loadDocsForEmployee]
  );

  const handleAfterUpload = useCallback(() => {
    if (!uploadTarget) return;
    const id = uploadTarget.employee_id;
    setEmployeeDocs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTimeout(() => {
      setDocsLoading(true);
      listDocuments({ employee_id: id, limit: 100 })
        .then(({ data }) =>
          setEmployeeDocs((prev) => ({ ...prev, [id]: data || [] }))
        )
        .catch(() => {})
        .finally(() => setDocsLoading(false));
    }, 500);
  }, [uploadTarget]);

  const selectedDays = selectedEmployee ? daysSince(selectedEmployee.date_of_joining) : 0;
  const selectedChecklist = selectedEmployee ? buildChecklist(selectedDays) : [];
  const selectedProgress = selectedEmployee ? progressFromDays(selectedDays) : 0;
  const selectedDocs = selectedEmployee
    ? employeeDocs[selectedEmployee.employee_id] || []
    : [];

  return {
    employees,
    loading,
    selectedEmployee,
    uploadTarget,
    docsLoading,
    activeOnboardings,
    completedOnboardings,
    overdueTasks,
    avgDays,
    selectedDays,
    selectedChecklist,
    selectedProgress,
    selectedDocs,
    setUploadTarget,
    handleSelectEmployee,
    handleAfterUpload,
  };
}
