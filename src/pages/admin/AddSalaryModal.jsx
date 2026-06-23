import { useMemo, useState } from "react";
import { calculatePayslip } from "./PayRollForm";
import SalaryComponentModal from "./SalaryComponentModal";

const AddSalaryModal = ({ employees, initial, onClose, onSave, saving }) => {
  const lockEmployee = Boolean(initial?.employeeId);

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [customComponents, setCustomComponents]     = useState([]);
  const [employeeId, setEmployeeId] = useState(initial?.employeeId || "");
  const [basic, setBasic]           = useState(initial?.basic || "");

  const breakdown = useMemo(() => calculatePayslip(basic), [basic]);

  // const selectedEmployee = employees.find(
  //   (emp) => String(emp.employee_id) === String(employeeId)
  // );

  // ── Custom component evaluation ──────────────────────────────────────────
  const evaluateFormula = (formula, context) => {
    try {
      let expression = formula;
      Object.entries(context).forEach(([key, value]) => {
        expression = expression.replaceAll(key, value);
      });
      return Math.max(0, Math.round(Function(`return ${expression}`)()));
    } catch {
      return 0;
    }
  };

  const formulaContext = {
    basic: breakdown.basic,
    hra: breakdown.hra,
    conveyance: breakdown.conveyance,
    medicalAllowance: breakdown.medicalAllowance,
    specialAllowance: breakdown.specialAllowance,
    gross: breakdown.gross,
    pf: breakdown.pf,
    professionalTax: breakdown.professionalTax,
    tds: breakdown.tds,
  };

  const calculatedComponents = customComponents.map((c) => ({
    ...c,
    amount: evaluateFormula(c.formula, formulaContext),
  }));

  const customEarnings    = calculatedComponents.filter((c) => c.type === "earning").reduce((s, c) => s + c.amount, 0);
  const customDeductions  = calculatedComponents.filter((c) => c.type === "deduction").reduce((s, c) => s + c.amount, 0);
  const totalEarnings     = breakdown.totalEarnings + customEarnings;
  const totalDeductions   = breakdown.totalDeductions + customDeductions;
  const netSalary         = Math.max(0, totalEarnings - totalDeductions);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!employeeId) { window.alert("Please select an employee."); return; }
    if (!basic || Number(basic) <= 0) { window.alert("Please enter a valid Basic Salary."); return; }
    onSave(employeeId, Number(basic), breakdown);
  };

  // ── Earnings rows (all 11 backend components) ────────────────────────────
  const earningRows = [
    { label: "Basic Salary",                      value: breakdown.basic },
    { label: "HRA (40%)",                         value: breakdown.hra },
    { label: "Special Allowance (25%)",           value: breakdown.specialAllowance },
    { label: "LTA (4.5%)",                        value: breakdown.lta },
    { label: "Telephone & Internet (2%)",         value: breakdown.telephoneAndInternet },
    { label: "Medical Allowance (5%)",            value: breakdown.medicalAllowance },
    { label: "Conveyance Allowance (3%)",         value: breakdown.conveyance },
    { label: "Bonus (5%)",                        value: breakdown.bonus },
    { label: "Incentives (5%)",                   value: breakdown.incentives },
    { label: "Arrears (7.5%)",                    value: breakdown.arrears },
    { label: "Other Earnings (1%)",               value: breakdown.otherEarnings },
  ];

  const deductionRows = [
    // ── Employee deductions (subtracted from gross) ──────────────────────────
    { label: "PF — Employee (12% of Basic, max ₹15k)", value: breakdown.pf, section: "emp" },
    ...(breakdown.esiEmployee > 0
      ? [{ label: "ESI — Employee (0.75% of gross, if ≤ ₹21k)", value: breakdown.esiEmployee, section: "emp" }]
      : []),
    { label: "Professional Tax (slab-based)",           value: breakdown.professionalTax, section: "emp",
      note: breakdown.totalEarnings <= 15000 ? "Exempt (gross ≤ ₹15k)"
          : breakdown.totalEarnings <= 20000 ? "₹150 slab (gross ₹15k–₹20k)"
          : "₹200 slab (gross > ₹20k)" },
    { label: "TDS / Income Tax",                        value: breakdown.tds, section: "emp", note: "Old-regime slabs + 4% cess" },
    // ── Employer contributions (CTC components, not deducted from employee) ──
    { label: "EPS — Employer Pension (8.33%, max ₹15k)",    value: breakdown.eps,        section: "cmp" },
    { label: "EPF — Employer PF (3.67%, max ₹15k)",         value: breakdown.epf,        section: "cmp" },
    { label: "EDLI — Employer Insurance (0.5%, max ₹75)",   value: breakdown.edli,       section: "cmp" },
    ...(breakdown.esiEmployer > 0
      ? [{ label: "ESI — Employer (3.25% of gross, if ≤ ₹21k)", value: breakdown.esiEmployer, section: "cmp" }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col p-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-slate-800">Edit Employee Salary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        <div className="h-[65vh] overflow-auto mt-4 space-y-6">

          {/* Employee + Basic Salary */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={employeeId}
                disabled={lockEmployee}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:bg-gray-50"
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name || emp.lasst_name || ""} ({emp.emp_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Basic Salary (₹/month)</label>
              <input
                type="number"
                min={0}
                value={basic}
                onChange={(e) => setBasic(e.target.value)}
                placeholder="e.g. 40000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              />
              <p className="mt-1 text-xs text-gray-400">All components are calculated from this value.</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Gross Earnings</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">₹ {totalEarnings.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">Total Deductions</p>
              <p className="text-lg font-bold text-red-600 mt-0.5">₹ {totalDeductions.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-3">
              <p className="text-xs text-gray-500">Net Pay</p>
              <p className="text-lg font-bold text-green-700 mt-0.5">₹ {netSalary.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-gray-500">CTC (Monthly)</p>
              <p className="text-lg font-bold text-blue-700 mt-0.5">₹ {breakdown.ctc.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-gray-500">CTC (Annual)</p>
              <p className="text-lg font-bold text-blue-700 mt-0.5">₹ {(breakdown.ctc * 12).toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Earnings breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800">Earnings Breakdown</h3>
              <button
                type="button"
                onClick={() => setShowComponentModal(true)}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
              >
                + Custom Component
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Component</th>
                    <th className="px-3 py-2 font-medium text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {earningRows.map(({ label, value }) => (
                    <tr key={label}>
                      <td className="px-3 py-2 text-gray-600">{label}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{value.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {calculatedComponents.filter((c) => c.type === "earning").map((c) => (
                    <tr key={c.id} className="bg-orange-50/40">
                      <td className="px-3 py-2 text-gray-600">{c.name} <span className="text-xs text-gray-400">(custom)</span></td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{c.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-3 py-2 text-gray-700">Total Earnings</td>
                    <td className="px-3 py-2 text-right text-emerald-600">{totalEarnings.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deductions breakdown */}
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Deductions &amp; Statutory Contributions</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Component</th>
                    <th className="px-3 py-2 font-medium text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Section header — Employee Deductions */}
                  <tr className="bg-red-50">
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-red-700 uppercase tracking-wide">
                      Employee Deductions (deducted from gross)
                    </td>
                  </tr>
                  {deductionRows.filter((r) => r.section === "emp").map(({ label, value, note }) => (
                    <tr key={label}>
                      <td className="px-3 py-2 text-gray-600">
                        {label}
                        {note && <span className="ml-1.5 text-xs text-amber-600">— {note}</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{value.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {calculatedComponents.filter((c) => c.type === "deduction").map((c) => (
                    <tr key={c.id} className="bg-orange-50/40">
                      <td className="px-3 py-2 text-gray-600">{c.name} <span className="text-xs text-gray-400">(custom)</span></td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{c.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-3 py-2 text-gray-700">Total Employee Deductions</td>
                    <td className="px-3 py-2 text-right text-red-600">{totalDeductions.toLocaleString("en-IN")}</td>
                  </tr>

                  {/* Section header — Employer Contributions (CTC) */}
                  <tr className="bg-blue-50">
                    <td colSpan={2} className="px-3 py-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Employer Contributions (added to CTC, not deducted from employee)
                    </td>
                  </tr>
                  {deductionRows.filter((r) => r.section === "cmp").map(({ label, value }) => (
                    <tr key={label}>
                      <td className="px-3 py-2 text-gray-600">{label}</td>
                      <td className="px-3 py-2 text-right font-medium text-blue-700">{value.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/40 font-semibold">
                    <td className="px-3 py-2 text-gray-700">Total Employer Contribution</td>
                    <td className="px-3 py-2 text-right text-blue-600">
                      {(breakdown.eps + breakdown.epf + breakdown.edli + (breakdown.esiEmployer || 0)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t mt-4 pt-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Salary"}
          </button>
        </div>
      </div>

      {showComponentModal && (
        <SalaryComponentModal
          onClose={() => setShowComponentModal(false)}
          onSave={(component) => {
            setCustomComponents((prev) => [...prev, { ...component, id: Date.now() }]);
            setShowComponentModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AddSalaryModal;
