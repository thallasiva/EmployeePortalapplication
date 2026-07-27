import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download, Pencil, Plus, Search } from "lucide-react";
import Pagination, { usePagination } from "../../components/Pagination";
import AddSalaryModal from "./AddSalaryModal";
import { listEmployees } from "../../api/employee.api";
import {
  listSalaryStructures,
  createSalaryStructure,
  updateSalaryStructure,
  generatePayslip,
} from "../../api/payroll.api";
import { successToast, errorToast } from "../../utils/ToastControllers";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, idx) => ({ value: idx + 1, label }));

function getYearOptions() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1];
}

const SORT_OPTIONS = [
  { value: "name-asc",     label: "Name (A – Z)" },
  { value: "salary-desc",  label: "Salary (High – Low)" },
  { value: "salary-asc",   label: "Salary (Low – High)" },
  { value: "joining-desc", label: "Joining Date (Newest)" },
];


const getFullName = (emp) =>
  `${emp.first_name || ""} ${emp.last_name || emp.lasst_name || ""}`.trim();

const getInitials = (emp) => {
  const name = getFullName(emp);
  const parts = name.split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const PayRollForm = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [employees, setEmployees]               = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [loading, setLoading]                   = useState(true);

  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("name-asc");
  const [exportOpen, setExportOpen]       = useState(false);

  // For "Generate Slip" — pick month/year first
  const [slipEmployee, setSlipEmployee]   = useState(null);
  const [slipMonth, setSlipMonth]         = useState(now.getMonth() + 1);
  const [slipYear, setSlipYear]           = useState(now.getFullYear());
  const [generating, setGenerating]       = useState(false);

  const [salaryModal, setSalaryModal]     = useState(null); // null | { employeeId?, basic? }
  const [saving, setSaving]               = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empResult, ssResult] = await Promise.all([
        listEmployees({ limit: 200, status: "Active" }),
        listSalaryStructures({ limit: 200 }),
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

  // ── Enrich employees with their salary structure ──────────────────────────
  const enriched = useMemo(() =>
    employees.map((emp) => {
      const structure = salaryStructures
        .filter((s) => s.employee_id === emp.employee_id)
        .sort((a, b) => new Date(b.effective_from) - new Date(a.effective_from))[0] || null;
      return { ...emp, structure, basic: structure?.basic ?? 0 };
    }),
  [employees, salaryStructures]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
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
      case "name-asc":    sorted.sort((a, b) => getFullName(a).localeCompare(getFullName(b))); break;
      case "salary-desc": sorted.sort((a, b) => b.basic - a.basic); break;
      case "salary-asc":  sorted.sort((a, b) => a.basic - b.basic); break;
      case "joining-desc": sorted.sort((a, b) => new Date(b.emp_joining_date || 0) - new Date(a.emp_joining_date || 0)); break;
      default: break;
    }
    return sorted;
  }, [enriched, search, sortBy]);

  const { paged: visible, page: pfPage, setPage: setPfPage, totalPages: pfTotalPages, from: pfFrom, to: pfTo, total: pfTotal, pageSize: pfPageSize, setPageSize: setPfPageSize } = usePagination(filtered);

  // ── Save salary structure via API ─────────────────────────────────────────
  const handleSaveSalary = async (employeeId, basic, breakdown) => {
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
        effective_from: effectiveFrom,
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
      errorToast(err?.response?.data?.message || err?.message || "Failed to save salary.");
    } finally {
      setSaving(false);
    }
  };

  // ── Generate payslip via API ──────────────────────────────────────────────
  const handleGenerateSlip = async () => {
    if (!slipEmployee) return;
    setGenerating(true);
    try {
      const record = await generatePayslip({
        employee_id: slipEmployee.employee_id,
        month: slipMonth,
        year: slipYear,
      });
      setSlipEmployee(null);
      navigate(`/payslip/${record.payslip_id}/print`);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate payslip.");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = (format) => {
    setExportOpen(false);
    successToast(`Exporting as ${format}…`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="admin-dash">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Payroll — Employee Salaries</h1>
          <p className="text-sm text-gray-500">
            Manage each employee's salary structure. Use{" "}
            <a href="/dashboard/payroll/payslips" className="text-brand hover:underline font-medium">Payslips</a>
            {" "}to generate and distribute monthly payslip documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download size={16} />
              Export
              <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <button type="button" onClick={() => handleExport("CSV")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as CSV</button>
                <button type="button" onClick={() => handleExport("PDF")} className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Export as PDF</button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSalaryModal({})}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Plus size={16} />
            Add Salary
          </button>
        </div>
      </div>

      <div className="admin-dash-card">
        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or code…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading employees…</p>
          ) : (
            <table className="admin-att-table w-full min-w-[900px]">
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Basic Salary</th>
                  <th>CTC (Annual)</th>
                  <th>Payslip</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">No employees found.</td>
                  </tr>
                ) : (
                  visible.map((emp) => {
                    const annualCTC = emp.structure?.ctc
                      ? Number(emp.structure.ctc)
                      : emp.basic
                        ? (emp.basic * 1.12) * 12   // rough estimate if ctc not stored
                        : 0;
                    return (
                      <tr key={emp.employee_id}>
                        <td className="font-medium text-gray-700">{emp.emp_code || `EMP-${emp.employee_id}`}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="admin-emp-avatar">{getInitials(emp)}</span>
                            <div>
                              <p className="font-medium text-gray-800">{getFullName(emp)}</p>
                              <p className="text-xs text-gray-400">{emp.designation_name || emp.emp_job_title || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-500">{emp.email}</td>
                        <td className="text-gray-500">{emp.department_name || "—"}</td>
                        <td className="text-gray-500">{formatDate(emp.emp_joining_date)}</td>
                        <td className="font-medium text-gray-700">{emp.basic ? formatCurrency(emp.basic) : <span className="text-amber-500 text-xs">Not set</span>}</td>
                        <td className="font-medium text-gray-700">{annualCTC ? formatCurrency(annualCTC) : "—"}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSlipEmployee(emp)}
                            disabled={!emp.basic}
                            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={!emp.basic ? "Set a salary first" : ""}
                          >
                            Generate Slip
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSalaryModal({ employeeId: String(emp.employee_id), basic: String(emp.basic || "") })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label={`Edit salary for ${getFullName(emp)}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
      <Pagination page={pfPage} setPage={setPfPage} totalPages={pfTotalPages} from={pfFrom} to={pfTo} total={pfTotal} pageSize={pfPageSize} setPageSize={setPfPageSize} />

      {/* Generate Slip — month/year picker + confirm */}
      {slipEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate Payslip</h3>
            <p className="text-sm text-gray-500 mb-4">
              For <strong>{getFullName(slipEmployee)}</strong> ({slipEmployee.emp_code})
            </p>
            <div className="flex gap-3 mb-6">
              <select value={slipMonth} onChange={(e) => setSlipMonth(Number(e.target.value))} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={slipYear} onChange={(e) => setSlipYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                {getYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSlipEmployee(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleGenerateSlip} disabled={generating} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                {generating ? "Generating…" : "Generate & View"}
              </button>
            </div>
          </div>
        </div>
      )}

      {salaryModal && (
        <AddSalaryModal
          employees={enriched}
          initial={salaryModal}
          onClose={() => setSalaryModal(null)}
          onSave={handleSaveSalary}
          saving={saving}
        />
      )}
    </div>
  );
};

export default PayRollForm;


export const formatCurrency = (value) => {
  if (value === "" || value == null || isNaN(Number(value))) return "—";
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
};

/**
 * Computes a full payslip breakdown from a monthly Basic salary.
 * Mirrors payslipBreakdown.js on the backend exactly — same percentages,
 * same PF cap (₹15,000 statutory wage ceiling), same professional tax.
 *
 * @param {number|string} basicSalary - monthly basic salary
 */
// Old-regime slab tax — mirrors backend taxCalculator.js
const _slabTax = (income) => {
  income = Math.max(0, Number(income) || 0);
  if (income <= 500000) return 0;
  let tax = 0;
  if (income > 1000000) { tax += (income - 1000000) * 0.3; income = 1000000; }
  if (income > 500000)  { tax += (income - 500000)  * 0.2; income = 500000;  }
  if (income > 250000)  { tax += (income - 250000)  * 0.05; }
  return Math.round(tax);
};

export const calculatePayslip = (basicSalary) => {
  const basic = Math.round(Number(basicSalary) || 0);

  // Earnings (as % of Basic — matches payslipBreakdown.js)
  const hra                  = Math.round(basic * 0.40);
  const specialAllowance     = Math.round(basic * 0.25);
  const lta                  = Math.round(basic * 0.045);
  const telephoneAndInternet = Math.round(basic * 0.02);
  const medicalAllowance     = Math.round(basic * 0.05);
  const conveyance           = Math.round(basic * 0.03);
  const bonus                = Math.round(basic * 0.05);
  const incentives           = Math.round(basic * 0.05);
  const arrears              = Math.round(basic * 0.075);
  const otherEarnings        = Math.round(basic * 0.01);

  const totalEarnings =
    basic + hra + specialAllowance + lta + telephoneAndInternet +
    medicalAllowance + conveyance + bonus + incentives + arrears + otherEarnings;

  // ── PF / EPS / EPF / EDLI ─────────────────────────────────────────────────
  const pfWage     = Math.min(basic, 15000);                       // statutory ceiling
  const pf         = Math.round(pfWage * 0.12);                   // employee PF (12%)
  const eps        = Math.round(pfWage * 0.0833);                 // employer EPS (8.33%)
  const epf        = Math.round(pfWage * 0.0367);                 // employer EPF (3.67%)
  const employerPf = eps + epf;                                    // = 12% of pfWage
  const edli       = Math.min(Math.round(pfWage * 0.005), 75);   // max ₹75

  // ── ESI ───────────────────────────────────────────────────────────────────
  const esiApplicable  = totalEarnings <= 21000;
  const esiEmployee    = esiApplicable ? Math.round(totalEarnings * 0.0075) : 0;
  const esiEmployer    = esiApplicable ? Math.round(totalEarnings * 0.0325) : 0;

  // ── Professional Tax (slab-based) ─────────────────────────────────────────
  const professionalTax = totalEarnings <= 15000 ? 0
                        : totalEarnings <= 20000 ? 150
                        : 200;

  // ── TDS (income tax) ─────────────────────────────────────────────────────
  const grossAnnual   = totalEarnings * 12;
  const taxableIncome = Math.max(0, grossAnnual - 50000 - pf * 12);
  const annualTax     = _slabTax(taxableIncome);
  const tds           = Math.round((annualTax + Math.round(annualTax * 0.04)) / 12);

  const totalDeductions = pf + esiEmployee + professionalTax + tds;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);
  const gross = totalEarnings;
  const ctc = totalEarnings + employerPf + edli + esiEmployer;

  return {
    basic, hra, specialAllowance, lta, telephoneAndInternet,
    medicalAllowance, conveyance, bonus, incentives, arrears, otherEarnings,
    // Employee deductions
    pf, esiEmployee, professionalTax, tds,
    // Employer contributions
    eps, epf, employerPf, edli, esiEmployer,
    // Totals
    gross, totalEarnings, totalDeductions, netSalary, ctc,
    // Legacy aliases
    esi: esiEmployee,
  };
};
