import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { tabFilter } from "../../../../salary/salaryHelpers";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { NAVY, AMBER, AMBER_TEXT, TEMPLATE_TABS } from "./shared";
import { EarningsTable } from "./EarningsTable";
import { VariableTable } from "./VariableTable";
import { GenericTab } from "./GenericTab";
import { SalarySummary } from "./SalarySummary";
// ─── Main export ──────────────────────────────────────────────────────────────
const Template1Tabbed = React.memo(function Template1Tabbed({
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
  const deductLines = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"), [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);
  const currentTab = TEMPLATE_TABS.some(t => t.id === activeTab) ? activeTab : "fixed";
  function renderContent() {
    switch (currentTab) {
      case "fixed":
        return <div className="flex gap-4 h-full">
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <EarningsTable lines={fixedLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
            </div>
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <VariableTable lines={variableLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
            </div>
          </div>;
      case "variable":
        return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <VariableTable lines={variableLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
          </div>;
      case "deduct":
        return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <GenericTab lines={deductLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} label="Deductions" />
          </div>;
      case "employer":
        return <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <GenericTab lines={employerLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} label="Employer Contributions" />
          </div>;
      default:
        return <div className="rounded-xl border border-dashed border-gray-200 bg-white flex items-center justify-center h-40 text-gray-400 text-sm">
            Coming soon
          </div>;
    }
  }
  return <div className="flex flex-col h-full" style={{
    backgroundColor: "#f8f9fb"
  }}>
      {/* ── Top header ── */}
      <div className="shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/dashboard/payroll" className="hover:text-gray-600">Payroll</Link>
          <span className="text-gray-300">›</span>
          <Link to="/dashboard/salary-structures" className="hover:text-gray-600">Salary Structures</Link>
          <span className="text-gray-300">›</span>
          <span className="font-medium text-gray-700 truncate max-w-56">{structure?.structure_name}</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          {/* Employee card */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard/salary-structures")} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={15} />
            </button>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{
            backgroundColor: NAVY
          }}>
              SS
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {editingName ? <input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === "Enter" && setEditingName(false)} className="text-base font-bold text-gray-900 border-b-2 outline-none bg-transparent" style={{
                borderColor: AMBER
              }} /> : <h1 onClick={() => setEditingName(true)} title="Click to rename" className="text-base font-bold text-gray-900 cursor-text hover:underline truncate max-w-72">
                    {draftName}
                  </h1>}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                borderColor: "#bbf7d0"
              }}>
                  Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span>{strCode}</span>
                <span>·</span><span>Monthly</span>
                <span>·</span><span>INR</span>
                <span>·</span><span>All Employees</span>
                <span>·</span><span>Effective: 01 Jan 2025</span>
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setActiveTab("preview")} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Eye size={14} /> Preview Salary
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Save Draft
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 shadow-sm transition-opacity" style={{
            backgroundColor: AMBER
          }}>
              <Save size={14} /> {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>
      {/* ── Tab bar ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 overflow-x-auto">
        <div className="flex min-w-max">
          {TEMPLATE_TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className="px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all" style={currentTab === t.id ? {
          borderColor: AMBER,
          color: AMBER_TEXT
        } : {
          borderColor: "transparent",
          color: "#9ca3af"
        }}>
              {t.label}
            </button>)}
        </div>
      </div>
      {/* ── Content + sidebar ── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        <div className="flex-1 overflow-auto min-w-0">{renderContent()}</div>
        <div className="w-72 shrink-0 overflow-auto">
          <SalarySummary computed={computed} structure={structure} />
        </div>
      </div>
    </div>;
});
export { Template1Tabbed };
