import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getLeaveSummary } from "../../../../api/leaveRequest.api";
import { getErrorMessage } from "../../../../api/client";
import { YEARS, MONTH_LABELS } from "../constants";
import { ltCode, fmt } from "../utils";

export function useLeaveSummary() {
  const CURRENT_YEAR = YEARS[0];
  const [year, setYear] = useState(CURRENT_YEAR);
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getLeaveSummary({ year, status: statusFilter || undefined });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [year, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const employees = useMemo(
    () =>
      (data?.employees || []).filter(
        (e) =>
          !search ||
          e.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
          e.emp_code?.toLowerCase().includes(search.toLowerCase()) ||
          e.department_name?.toLowerCase().includes(search.toLowerCase())
      ),
    [data, search]
  );

  const leaveTypes = data?.leaveTypes || [];

  const handleExportCSV = useCallback(() => {
    if (!employees.length) return;
    const rows = [];
    const h = ["Emp No", "Employee Name", "Status", "Department", "Designation", "DOJ"];
    leaveTypes.forEach((lt) => h.push(`Opening ${ltCode(lt.leave_type_name)}`));
    leaveTypes.forEach((lt) => h.push(`Eligibility ${ltCode(lt.leave_type_name)}`));
    leaveTypes.forEach((lt) => h.push(`Availed ${ltCode(lt.leave_type_name)}`));
    MONTH_LABELS.forEach((m) => leaveTypes.forEach((lt) => h.push(`${m} ${ltCode(lt.leave_type_name)}`)));
    leaveTypes.forEach((lt) => h.push(`Closing ${ltCode(lt.leave_type_name)}`));
    rows.push(h);

    employees.forEach((emp) => {
      const row = [
        emp.emp_code,
        emp.employee_name,
        emp.employee_status,
        emp.department_name,
        emp.designation_name,
        emp.emp_joining_date ? emp.emp_joining_date.slice(0, 10) : "",
      ];
      const ld = (ltId) => emp.leave_data?.find((d) => d.leave_type_id === ltId) || {};
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).opening_balance ?? 0));
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).granted ?? 0));
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).availed ?? 0));
      MONTH_LABELS.forEach((_, mi) =>
        leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).monthly?.[mi] ?? 0))
      );
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).closing_balance ?? 0));
      rows.push(row);
    });

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave_summary_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [employees, leaveTypes, year]);

  return {
    year,
    setYear,
    statusFilter,
    setStatus,
    search,
    setSearch,
    data,
    loading,
    error,
    tableRef,
    employees,
    leaveTypes,
    handleExportCSV,
  };
}
