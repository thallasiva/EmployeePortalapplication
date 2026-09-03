import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listEmployees } from "../../../../api/employee.api";
import {
  listSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  generatePayslip
} from "../../../../api/payroll.api";
import { apiErrorToast, successToast, errorToast } from "../../../../utils/ToastControllers";
import { usePagination } from "../../../../components/Pagination";
import { getFullName } from "../utils";

export function usePayRoll() {
  const navigate = useNavigate();
  const now = new Date();

  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [exportOpen, setExportOpen] = useState(false);
  const [slipEmployee, setSlipEmployee] = useState(null);
  const [slipMonth, setSlipMonth] = useState(now.getMonth() + 1);
  const [slipYear, setSlipYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [salaryModal, setSalaryModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empResult, ssResult] = await Promise.all([
        listEmployees({ limit: 200, status: "Active" }),
        listSalaryStructures({ limit: 200 })
      ]);
      setEmployees(empResult.data || []);
      setSalaryStructures(ssResult.data || []);
    } catch {
      setEmployees([]);
      setSalaryStructures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const enriched = useMemo(() =>
    employees.map((emp) => {
      const structure = salaryStructures
        .filter((s) => s.employee_id === emp.employee_id)
        .sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from))[0] || null;
      return { ...emp, structure, basic: structure?.basic ?? 0 };
    }),
    [employees, salaryStructures]
  );

  const filtered = useMemo(() => {
    let list = enriched;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        getFullName(e).toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.emp_code?.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case "name-asc": sorted.sort((a, b) => getFullName(a).localeCompare(getFullName(b))); break;
      case "salary-desc": sorted.sort((a, b) => b.basic - a.basic); break;
      case "salary-asc": sorted.sort((a, b) => a.basic - b.basic); break;
      case "joining-desc":
        sorted.sort((a, b) => new Date(b.emp_joining_date || 0) - new Date(a.emp_joining_date || 0));
        break;
      default: break;
    }
    return sorted;
  }, [enriched, search, sortBy]);

  const paginationData = usePagination(filtered);

  const handleSaveSalary = useCallback(async (employeeId, basic, breakdown) => {
    setSaving(true);
    try {
      const effectiveFrom = new Date().toISOString().slice(0, 10);
      const payload = {
        employee_id: Number(employeeId),
        basic: breakdown.basic,
        hra: breakdown.hra,
        conveyance: breakdown.conveyance,
        medical_allowance: breakdown.medicalAllowance,
        special_allowance: breakdown.specialAllowance,
        pf_employee: breakdown.pf,
        pf_employer: breakdown.employerPf,
        professional_tax: breakdown.professionalTax,
        income_tax: breakdown.tds,
        ctc: breakdown.ctc,
        effective_from: effectiveFrom
      };

      const existing = salaryStructures
        .filter((s) => s.employee_id === Number(employeeId))
        .sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from))[0];

      if (existing) {
        await updateSalaryStructure(existing.id, payload);
      } else {
        await createSalaryStructure(payload);
      }

      successToast("Salary structure saved.");
      setSalaryModal(null);
      await loadData();
    } catch (err) {
      apiErrorToast(err, 'save salary');
    } finally {
      setSaving(false);
    }
  }, [salaryStructures, loadData]);

  const handleGenerateSlip = useCallback(async () => {
    if (!slipEmployee) return;
    setGenerating(true);
    try {
      const record = await generatePayslip({
        employee_id: slipEmployee.employee_id,
        month: slipMonth,
        year: slipYear
      });
      setSlipEmployee(null);
      navigate(`/payslip/${record.payslip_id}/print`);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate payslip.");
    } finally {
      setGenerating(false);
    }
  }, [slipEmployee, slipMonth, slipYear, navigate]);

  const handleExport = useCallback((format) => {
    setExportOpen(false);
    successToast(`Exporting as ${format}…`);
  }, []);

  return {
    loading,
    search,
    setSearch,
    sortBy,
    setSortBy,
    exportOpen,
    setExportOpen,
    slipEmployee,
    setSlipEmployee,
    slipMonth,
    setSlipMonth,
    slipYear,
    setSlipYear,
    generating,
    salaryModal,
    setSalaryModal,
    saving,
    enriched,
    paginationData,
    handleSaveSalary,
    handleGenerateSlip,
    handleExport
  };
}
