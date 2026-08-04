import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronUp,
  Check, Eye, Save, Building2, Briefcase, BarChart2,
  Calendar, Users, Clock, MapPin, Globe, DollarSign,
} from "lucide-react";
import { fmtINR, tabFilter } from "../../../salary/salaryHelpers";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const NAVY  = "#1e3a5f";
const AMBER = "#d97706";

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 1, key: "fixed",    label: "Earnings" },
  { id: 2, key: "variable", label: "Variable Pay" },
  { id: 3, key: "benefits", label: "Benefits" },
  { id: 4, key: "deduct",   label: "Deductions" },
  { id: 5, key: "employer", label: "Employer Contribution" },
  { id: 6, key: "review",   label: "Review & Publish" },
];

// ─── Step progress bar ────────────────────────────────────────────────────────
function StepBar({ currentStep, onStep }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4 px-6 bg-white border-b border-gray-200">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive    = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast      = idx === WIZARD_STEPS.length - 1;
        return (
          <React.Fragment key={step.id}>
            <button onClick={() => onStep(step.id)}
              className="flex flex-col items-center gap-1 group min-w-max px-2">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isCompleted
                  ? "bg-green-500 border-green-500 text-white"
                  : isActive
                    ? "text-white border-transparent"
                    : "bg-white border-gray-200 text-gray-400"
              }`}
                style={isActive ? { backgroundColor: AMBER, borderColor: AMBER } : {}}>
                {isCompleted ? <Check size={14} /> : step.id}
              </div>
              {/* Label */}
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                isActive ? "font-bold" : isCompleted ? "text-green-600" : "text-gray-400"
              }`}
                style={isActive ? { color: AMBER } : {}}>
                {step.label}
              </span>
            </button>
            {!isLast && (
              <div className={`h-0.5 w-8 mt-[-12px] transition-colors ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices }) {
  const R = 52, CX = 68, CY = 68, stroke = 19;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={136} height={136} viewBox="0 0 136 136">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }} />
        );
        offset += dash;
        return el;
      })}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={9} fill="#6b7280">CTC</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={12} fontWeight="bold" fill={NAVY}>Live</text>
    </svg>
  );
}

// ─── Accordion section ─────────────────────────────────────────────────────────
function AccordionSection({ title, lines, onAdd, onEdit, onRemove, canAdd, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-3">
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "#fbcd97", color: "#92400e" }}>
            {lines.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canAdd && open && (
            <button onClick={e => { e.stopPropagation(); onAdd(); }}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-white"
              style={{ backgroundColor: AMBER }}>
              <Plus size={11} /> Add
            </button>
          )}
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {/* Table */}
      {open && (
        <div className="border-t border-gray-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Component","Type","Amount (₹)","Formula","Taxable","Action"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-xs">No components yet — click Add above</td></tr>
              ) : lines.map(l => (
                <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                  <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                  <td className="px-3 py-2 text-gray-500">{l.calc_type ?? "Fixed"}</td>
                  <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                  <td className="px-3 py-2 text-gray-400 font-mono text-[10px]">{l.formula || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.is_taxable ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.is_taxable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(l)}
                        className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => onRemove(l)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Employee profile sidebar ─────────────────────────────────────────────────
function EmployeeProfile({ structure, strCode }) {
  const fields = [
    { icon: Building2,  label: "Department",    value: "All Departments" },
    { icon: Briefcase,  label: "Designation",   value: "All Roles" },
    { icon: BarChart2,  label: "Grade",         value: "—" },
    { icon: Calendar,   label: "Date of Join",  value: "01 Jan 2024" },
    { icon: Users,      label: "Payroll Group", value: "Monthly" },
    { icon: Clock,      label: "Probation",     value: "6 months" },
    { icon: Calendar,   label: "Effective From",value: "01 Jan 2025" },
    { icon: MapPin,     label: "Location",      value: "All Locations" },
    { icon: DollarSign, label: "Currency",      value: "INR" },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Avatar header */}
      <div className="px-4 pt-5 pb-4 flex flex-col items-center gap-2 border-b border-gray-100"
        style={{ background: `linear-gradient(135deg, ${NAVY}22 0%, #f9fafb 100%)` }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
          style={{ backgroundColor: NAVY }}>SS</div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">{structure?.structure_name ?? "Salary Structure"}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{strCode}</p>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border"
          style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>
          Active
        </span>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-2">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 text-xs">
            <Icon size={12} className="text-gray-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">{label}</span>
              <span className="text-gray-700 font-medium truncate">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live salary summary ──────────────────────────────────────────────────────
function LiveSummary({ structure }) {
  const lines = structure?.lines ?? [];
  const totalFixed = lines.filter(l => l.category === "Earning" && l.frequency === "Monthly").reduce((s, l) => s + (l.amount || 0), 0);
  const totalVar   = lines.filter(l => l.category === "Earning" && l.frequency !== "Monthly").reduce((s, l) => s + (l.amount || 0), 0);
  const totalBen   = lines.filter(l => l.category === "Benefit").reduce((s, l) => s + (l.amount || 0), 0);
  const totalEmp   = lines.filter(l => l.category === "Employer Contribution").reduce((s, l) => s + (l.amount || 0), 0);
  const totalDed   = lines.filter(l => l.category === "Deduction").reduce((s, l) => s + (l.amount || 0), 0);
  const ctc = totalFixed + totalVar + totalBen + totalEmp;
  const net = ctc - totalDed;
  const safe = ctc || 1;

  const slices = [
    { label: "Fixed",    pct: Math.round((totalFixed/safe)*100), color: NAVY },
    { label: "Variable", pct: Math.round((totalVar/safe)*100),   color: AMBER },
    { label: "Benefits", pct: Math.round((totalBen/safe)*100),   color: "#10b981" },
    { label: "Employer", pct: Math.round((totalEmp/safe)*100),   color: "#6366f1" },
    { label: "Deduct",   pct: Math.round((totalDed/safe)*100),   color: "#ef4444" },
  ].filter(s => s.pct > 0);

  const sum = slices.reduce((s, sl) => s + sl.pct, 0);
  if (sum < 100) slices.push({ label: "", pct: 100 - sum, color: "#e5e7eb" });

  const legend = [
    { label: "Fixed Earnings",     value: fmtINR(totalFixed), color: NAVY },
    { label: "Variable Pay",       value: fmtINR(totalVar),   color: AMBER },
    { label: "Benefits",           value: fmtINR(totalBen),   color: "#10b981" },
    { label: "Employer Contrib.",  value: fmtINR(totalEmp),   color: "#6366f1" },
    { label: "Deductions",         value: fmtINR(totalDed),   color: "#ef4444" },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden mt-3">
      <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: NAVY }}>
        LIVE SALARY SUMMARY
      </div>
      <div className="flex justify-center py-3 border-b border-gray-50">
        <DonutChart slices={slices} />
      </div>
      <div className="px-3 py-3 space-y-2">
        {legend.map(r => (
          <div key={r.label} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-gray-500">{r.label}</span>
            </div>
            <span className="font-semibold text-gray-700">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 px-3 py-2.5 space-y-1">
        <div className="flex justify-between text-xs font-bold" style={{ color: NAVY }}>
          <span>Total CTC</span><span>{ctc ? fmtINR(ctc) : "₹ 18,00,000"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Net Salary</span>
          <span className="font-semibold text-green-600">{net ? fmtINR(net) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Review step ──────────────────────────────────────────────────────────────
function ReviewStep({ structure, handleSave, saving }) {
  const lines = structure?.lines ?? [];
  const totals = {
    Fixed:    lines.filter(l => l.category === "Earning" && l.frequency === "Monthly").reduce((s, l) => s + (l.amount || 0), 0),
    Variable: lines.filter(l => l.category === "Earning" && l.frequency !== "Monthly").reduce((s, l) => s + (l.amount || 0), 0),
    Benefits: lines.filter(l => l.category === "Benefit").reduce((s, l) => s + (l.amount || 0), 0),
    Employer: lines.filter(l => l.category === "Employer Contribution").reduce((s, l) => s + (l.amount || 0), 0),
    Deductions: lines.filter(l => l.category === "Deduction").reduce((s, l) => s + (l.amount || 0), 0),
  };
  const ctc = totals.Fixed + totals.Variable + totals.Benefits + totals.Employer;
  const net = ctc - totals.Deductions;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-800 mb-4">Review Salary Structure</h3>
      <div className="space-y-3 mb-6">
        {Object.entries(totals).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
            <span className="text-gray-600 font-medium">{key}</span>
            <span className={`font-bold ${key === "Deductions" ? "text-red-600" : "text-gray-800"}`}>{fmtINR(val)}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: NAVY + "0d" }}>
        <div className="flex justify-between font-bold text-sm" style={{ color: NAVY }}>
          <span>Total CTC</span><span>{ctc ? fmtINR(ctc) : "₹ 18,00,000"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Net Take-Home</span>
          <span className="font-bold text-green-600">{net ? fmtINR(net) : "—"}</span>
        </div>
      </div>
      <div className="mt-5 flex gap-3 justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
          Save Draft
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60 shadow-sm"
          style={{ backgroundColor: AMBER }}>
          <Check size={15} /> {saving ? "Publishing…" : "Publish Structure"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Template 3 ──────────────────────────────────────────────────────────
const Template3Wizard = React.memo(function Template3Wizard({
  structure,
  computed,
  activeTab,
  setActiveTab,
  saving,
  handleSave,
  openAdd,
  openEdit,
  handleRemoveLine,
  draftName,
  setDraftName,
  editingName,
  setEditingName,
  canAdd,
}) {
  const navigate = useNavigate();
  const strCode = `SAL-STR-${String(structure?.structure_id || "NEW").padStart(3, "0")}`;

  // Map activeTab to wizard step
  const keyToStep = useMemo(() => Object.fromEntries(WIZARD_STEPS.map(s => [s.key, s.id])), []);
  const stepToKey = useMemo(() => Object.fromEntries(WIZARD_STEPS.map(s => [s.id, s.key])), []);
  const currentStep = keyToStep[activeTab] ?? 1;

  function goToStep(step) {
    const key = stepToKey[step];
    if (key) setActiveTab(key);
  }

  const fixedLines    = useMemo(() => tabFilter(structure?.lines ?? [], "fixed"),    [structure?.lines]);
  const variableLines = useMemo(() => tabFilter(structure?.lines ?? [], "variable"), [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);
  const deductLines   = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"),   [structure?.lines]);
  const benefitLines  = useMemo(() => (structure?.lines ?? []).filter(l => l.category === "Benefit"), [structure?.lines]);

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return <AccordionSection title="Fixed Earnings" lines={fixedLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />;
      case 2:
        return <AccordionSection title="Variable Pay & Incentives" lines={variableLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />;
      case 3:
        return <AccordionSection title="Employee Benefits" lines={benefitLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />;
      case 4:
        return <AccordionSection title="Deductions" lines={deductLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />;
      case 5:
        return <AccordionSection title="Employer Contributions" lines={employerLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />;
      case 6:
        return <ReviewStep structure={structure} handleSave={handleSave} saving={saving} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8f9fb" }}>
      {/* Top header bar */}
      <div className="shrink-0 px-5 pt-3 pb-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/dashboard/salary-structures")}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={14} />
            </button>
            <nav className="flex items-center gap-1 text-xs text-gray-400">
              <Link to="/dashboard/payroll" className="hover:text-gray-600">Payroll</Link>
              <span className="text-gray-300">›</span>
              <Link to="/dashboard/salary-structures" className="hover:text-gray-600">Salary Structures</Link>
              <span className="text-gray-300">›</span>
              {editingName ? (
                <input autoFocus value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                  className="font-medium text-gray-700 border-b outline-none bg-transparent text-xs"
                  style={{ borderColor: AMBER }} />
              ) : (
                <span onClick={() => setEditingName(true)} title="Click to rename"
                  className="font-medium text-gray-700 cursor-text hover:underline truncate max-w-40">
                  {draftName}
                </span>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setActiveTab("preview")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
              <Eye size={13} /> Preview
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Step bar */}
      <StepBar currentStep={currentStep} onStep={goToStep} />

      {/* Main: left sidebar + content + right sidebar */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left: employee profile */}
        <div className="w-56 shrink-0 overflow-y-auto space-y-0">
          <EmployeeProfile structure={structure} strCode={strCode} />
        </div>

        {/* Centre: step content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {renderStepContent()}

          {/* Navigation buttons */}
          {currentStep < 6 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => goToStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors">
                ← Previous
              </button>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  Save Draft
                </button>
                <button onClick={() => goToStep(Math.min(6, currentStep + 1))}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: AMBER }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: live summary */}
        <div className="w-56 shrink-0 overflow-y-auto">
          <LiveSummary structure={structure} />
        </div>
      </div>
    </div>
  );
});

export default Template3Wizard;
