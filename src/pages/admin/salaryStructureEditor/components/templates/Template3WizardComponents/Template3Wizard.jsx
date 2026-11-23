import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, ArrowRight } from "lucide-react";
import { tabFilter } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { AMBER, WIZARD_STEPS } from "./shared";
import { StepBar } from "./StepBar";
import { AccordionSection } from "./AccordionSection";
import { EmployeeProfile } from "./EmployeeProfile";
import { LiveSummary } from "./LiveSummary";
import { ReviewStep } from "./ReviewStep";
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
  canAdd
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
  const fixedLines = useMemo(() => tabFilter(structure?.lines ?? [], "fixed"), [structure?.lines]);
  const variableLines = useMemo(() => tabFilter(structure?.lines ?? [], "variable"), [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);
  const deductLines = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"), [structure?.lines]);
  const benefitLines = useMemo(() => (structure?.lines ?? []).filter(l => l.category === "Benefit"), [structure?.lines]);
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
  return <div className="flex flex-col h-full" style={{
    backgroundColor: "#f8f9fb"
  }}>
      {/* Top header bar */}
      <div className="shrink-0 px-5 pt-3 pb-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/dashboard/salary-structures")} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={14} />
            </button>
            <nav className="flex items-center gap-1 text-xs text-gray-400">
              <Link to="/dashboard/payroll" className="hover:text-gray-600">Payroll</Link>
              <span className="text-gray-300">›</span>
              <Link to="/dashboard/salary-structures" className="hover:text-gray-600">Salary Structures</Link>
              <span className="text-gray-300">›</span>
              {editingName ? <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === "Enter" && setEditingName(false)} className="font-medium text-gray-700 border-b outline-none bg-transparent text-xs" style={{
              borderColor: AMBER
            }} /> : <span onClick={() => setEditingName(true)} title="Click to rename" className="font-medium text-gray-700 cursor-text hover:underline truncate max-w-40">
                  {draftName}
                </span>}
            </nav>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setActiveTab("preview")} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
              <Eye size={13} /> Preview
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors">
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
          {currentStep < 6 && <div className="flex items-center justify-between mt-4">
              <button onClick={() => goToStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ArrowLeft size={13} className="inline -mt-0.5" /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  Save Draft
                </button>
                <button onClick={() => goToStep(Math.min(6, currentStep + 1))} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90" style={{
              backgroundColor: AMBER
            }}>
                  Next <ArrowRight size={13} className="inline -mt-0.5" />
                </button>
              </div>
            </div>}
        </div>
        {/* Right: live summary */}
        <div className="w-56 shrink-0 overflow-y-auto">
          <LiveSummary structure={structure} />
        </div>
      </div>
    </div>;
});
export { Template3Wizard };
