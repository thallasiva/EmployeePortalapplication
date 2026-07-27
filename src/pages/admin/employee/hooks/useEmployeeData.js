import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { listEmployees, createEmployee } from "../../../../api/employee.api";
import { getErrorMessage } from "../../../../api/client";
import { parseEmployeeCsv, mapCsvRowToEmployee, downloadEmployeeCsvTemplate } from "../../../../utils/employeeCsvImport";
import { downloadEmployeeCsv } from "../../../../utils/employeeCsvExport";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { getEmployeeStatus } from "../../../../utils/employeeStatus";
import { getDepartmentName } from "../../../../utils/employeeDisplay";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "../constants";

export function useEmployeeData() {
  const csvInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTab, setSelectedTab] = useState("All");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(new Set());
  const [filterDept, setFilterDept] = useState(new Set());
  const [filterType, setFilterType] = useState(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const refreshEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listEmployees({ limit: 500 });
      setEmployees(data);
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshEmployees(); }, [refreshEmployees]);

  const deptOptions = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      const d = e.department_name || "General";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [employees]);

  const statusOptions = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      const { label } = getEmployeeStatus(e);
      counts[label] = (counts[label] || 0) + 1;
    });
    return STATUS_OPTIONS.map((o) => ({ ...o, count: counts[o.value] || 0 })).filter(
      (o) => o.count > 0
    );
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (filterStatus.size > 0) {
      list = list.filter((e) => {
        const { label } = getEmployeeStatus(e);
        return filterStatus.has(label);
      });
    }
    if (filterDept.size > 0) {
      list = list.filter((e) => filterDept.has(e.department_name || "General"));
    }
    if (filterType.size > 0) {
      list = list.filter((e) => filterType.has(e.employee_type || "Full-Time"));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const name = [e.first_name, e.last_name].filter(Boolean).join(" ").toLowerCase();
        return (
          name.includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.emp_code?.toLowerCase().includes(q) ||
          e.department_name?.toLowerCase().includes(q) ||
          e.emp_job_title?.toLowerCase().includes(q) ||
          e.mobile?.includes(q)
        );
      });
    }
    return list;
  }, [employees, search, filterStatus, filterDept, filterType]);

  const activeFilterCount = filterStatus.size + filterDept.size + filterType.size;

  const clearAllFilters = useCallback(() => {
    setFilterStatus(new Set());
    setFilterDept(new Set());
    setFilterType(new Set());
    setSearch("");
  }, []);

  const activePills = useMemo(() => {
    const pills = [];
    filterStatus.forEach((v) =>
      pills.push({
        id: `status:${v}`,
        label: `Status: ${v}`,
        remove: () => setFilterStatus((s) => { const n = new Set(s); n.delete(v); return n; }),
      })
    );
    filterDept.forEach((v) =>
      pills.push({
        id: `dept:${v}`,
        label: `Dept: ${v}`,
        remove: () => setFilterDept((s) => { const n = new Set(s); n.delete(v); return n; }),
      })
    );
    filterType.forEach((v) =>
      pills.push({
        id: `type:${v}`,
        label: `Type: ${v}`,
        remove: () => setFilterType((s) => { const n = new Set(s); n.delete(v); return n; }),
      })
    );
    return pills;
  }, [filterStatus, filterDept, filterType]);

  const handleCsvImport = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        let rows = [];
        try { rows = parseEmployeeCsv(event.target.result); }
        catch { errorToast("Failed to parse CSV. Check file format."); e.target.value = ""; return; }
        const codeToId = new Map();
        employees.forEach((emp) => { if (emp.emp_code) codeToId.set(String(emp.emp_code), emp.employee_id); });
        let created = 0, failed = 0;
        for (const row of rows) {
          const { employee, contactInfo, bankDetails, managerEmployeeNumber } = mapCsvRowToEmployee(row);
          if (!employee.first_name && !employee.email) continue;
          const reportingTo =
            managerEmployeeNumber && codeToId.has(managerEmployeeNumber)
              ? codeToId.get(managerEmployeeNumber)
              : null;
          try {
            await createEmployee({
              ...employee,
              role_id: Number(employee.role) || 2,
              reporting_to: reportingTo,
              contactInfo,
              bankDetails,
            });
            created++;
          } catch { failed++; }
        }
        await refreshEmployees();
        if (created) successToast(`${created} employee(s) imported from CSV`);
        if (failed) errorToast(`${failed} row(s) failed to import`);
        e.target.value = "";
      };
      reader.readAsText(file);
    },
    [employees, refreshEmployees]
  );

  const handleCsvExport = useCallback(() => {
    if (!employees.length) { errorToast("No employees to export"); return; }
    downloadEmployeeCsv(employees, `employees-${new Date().toISOString().slice(0, 10)}.csv`);
    successToast("Employee list exported");
  }, [employees]);

  const filterSections = useMemo(
    () => [
      { id: "status", label: "Status", options: statusOptions, selected: filterStatus, onChange: setFilterStatus },
      { id: "dept", label: "Department", options: deptOptions, selected: filterDept, onChange: setFilterDept },
      { id: "type", label: "Employee Type", options: TYPE_OPTIONS, selected: filterType, onChange: setFilterType },
    ],
    [statusOptions, deptOptions, filterStatus, filterDept, filterType]
  );

  return {
    csvInputRef,
    employees,
    loading,
    viewMode,
    setViewMode,
    selectedTab,
    setSelectedTab,
    search,
    setSearch,
    filterPanelOpen,
    setFilterPanelOpen,
    filteredEmployees,
    activeFilterCount,
    activePills,
    clearAllFilters,
    filterSections,
    handleCsvImport,
    handleCsvExport,
  };
}
