import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { tabFilter } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER } from "./shared";
import { SectionPanel } from "./SectionPanel";
import { CompactSummary } from "./CompactSummary";
// ─── Main Template 2 ──────────────────────────────────────────────────────────
const Template2Grid = React.memo(function Template2Grid({
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
  const fixedLines = useMemo(() => tabFilter(structure?.lines ?? [], "fixed"), [structure?.lines]);
  const variableLines = useMemo(() => tabFilter(structure?.lines ?? [], "variable"), [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);
  const deductLines = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"), [structure?.lines]);
  const benefitLines = useMemo(() => (structure?.lines ?? []).filter(l => l.category === "Benefit"), [structure?.lines]);
  const SECTIONS = [{
    title: "EARNINGS (Fixed)",
    lines: fixedLines,
    color: NAVY,
    cols: ["Component", "Amount", ""]
  }, {
    title: "VARIABLE PAY",
    lines: variableLines,
    color: AMBER,
    cols: ["Component", "Amount", ""]
  }, {
    title: "BENEFITS",
    lines: benefitLines,
    color: "#10b981",
    cols: ["Component", "Amount", ""]
  }, {
    title: "DEDUCTIONS",
    lines: deductLines,
    color: "#ef4444",
    cols: ["Component", "Amount", ""]
  }, {
    title: "EMPLOYER CONTRIB.",
    lines: employerLines,
    color: "#e87500",
    cols: ["Component", "Amount", ""]
  }];
  return <div className="flex flex-col h-full" style={{
    backgroundColor: "#f8f9fb"
  }}>
      {/* Header strip */}
      <div className="shrink-0 px-5 pt-3.5 pb-3 bg-white border-b border-gray-200">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <Link to="/dashboard/payroll" className="hover:text-gray-600">Payroll</Link>
          <span className="text-gray-300">›</span>
          <Link to="/dashboard/salary-structures" className="hover:text-gray-600">Salary Structures</Link>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-700 truncate max-w-48">{structure?.structure_name}</span>
        </nav>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate("/dashboard/salary-structures")} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={14} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{
            backgroundColor: NAVY
          }}>SS</div>
            <div className="flex items-center gap-3">
              {editingName ? <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === "Enter" && setEditingName(false)} className="text-sm font-bold text-gray-900 border-b-2 outline-none bg-transparent" style={{
              borderColor: AMBER
            }} /> : <h1 onClick={() => setEditingName(true)} title="Click to rename" className="text-sm font-bold text-gray-900 cursor-text hover:underline truncate max-w-52">
                  {draftName}
                </h1>}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              borderColor: "#bbf7d0"
            }}>Active</span>
              <span className="text-[11px] text-gray-400">{strCode}</span>
              <span className="text-[11px] text-gray-300">·</span>
              <span className="text-[11px] text-gray-400">Monthly · INR · All Employees</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setActiveTab("preview")} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
              <Eye size={13} /> Preview
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Save Draft
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60 shadow-sm" style={{
            backgroundColor: AMBER
          }}>
              <Save size={13} /> {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>
      {/* Main area: horizontal grid + summary */}
      <div className="flex flex-1 overflow-hidden gap-3 p-4">
        {/* 5 section columns */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 h-full min-w-max">
            {SECTIONS.map(sec => <div key={sec.title} className="w-56 shrink-0 flex flex-col h-full">
                <SectionPanel title={sec.title} lines={sec.lines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} accentColor={sec.color} columns={sec.cols} />
              </div>)}
          </div>
        </div>
        {/* Summary card */}
        <div className="w-64 shrink-0">
          <CompactSummary structure={structure} />
        </div>
      </div>
    </div>;
});
export { Template2Grid };
