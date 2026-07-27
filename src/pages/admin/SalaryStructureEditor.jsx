import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Plus, ArrowLeft, Save, Eye, History, FlaskConical,
  ChevronDown, ArrowUp, ArrowDown, Copy, Users, Calendar,
  Building2, Globe, MapPin, Tag, AlignLeft, Repeat, Coins,
  CheckCircle,
} from "lucide-react";

import {
  getStructure, listComponents, createComponent,
  updateStructure, removeStructureLine, createStructure, computeCTC,
} from "../../api/salaryComponent.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

import { TABS, TAB_META, tabFilter, fmtINR } from "./salary/salaryHelpers";
import ComponentTable        from "./salary/ComponentTable";
import AddEditComponentPanel from "./salary/AddEditComponentPanel";
import FormulaBuilderTab     from "./salary/FormulaBuilderTab";
import SalaryPreviewTab      from "./salary/SalaryPreviewTab";

// ── Small meta field display ─────────────────────────────────────────────────
function MetaField({ icon, label, value, badge }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        {badge
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">{value}</span>
          : <p className="text-[12px] font-medium text-gray-700 truncate">{value || "—"}</p>
        }
      </div>
    </div>
  );
}

// ── Placeholder tab for upcoming tabs ────────────────────────────────────────
function PlaceholderTab({ title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <FlaskConical size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-300 mt-1">{sub || "Coming soon."}</p>
    </div>
  );
}

// ── Tab content wrapper for component tabs ───────────────────────────────────
function ComponentTab({ tab, lines, computed, onAdd, onEdit, onRemove, canAdd }) {
  const meta = TAB_META[tab] ?? {};
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white">
        <div>
          <p className="text-sm font-semibold text-gray-800">{meta.title}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{meta.sub}</p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button className="px-2.5 py-1.5 hover:bg-gray-50 border-r border-gray-200 text-gray-500" title="Move up">
                <ArrowUp size={13} />
              </button>
              <button className="px-2.5 py-1.5 hover:bg-gray-50 border-r border-gray-200 text-gray-500" title="Move down">
                <ArrowDown size={13} />
              </button>
              <button className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-500" title="Duplicate">
                <Copy size={13} />
              </button>
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm"
            >
              <Plus size={13} /> Add Component
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <ComponentTable lines={lines} computed={computed} onEdit={onEdit} onRemove={onRemove} />
      </div>
    </div>
  );
}

// ── Template Summary Sidebar ─────────────────────────────────────────────────
function TemplateSidebar({ computed, previewCtc = 100000 }) {
  const components = computed?.components ?? [];
  const earnings   = components.filter(c => c.category === "Earning");
  const deductions = components.filter(c => c.category === "Deduction");
  const employer   = components.filter(c => c.category === "Employer Contribution");

  const fixedEarnings    = earnings.filter(e => (e.frequency || "Monthly") === "Monthly");
  const variableEarnings = earnings.filter(e => (e.frequency || "Monthly") !== "Monthly");

  const totalFixed   = fixedEarnings.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const totalVarMon  = variableEarnings.reduce((s, c) => s + Math.round((c.annual_amount || 0) / 12), 0);
  const grossMonthly = totalFixed + totalVarMon;
  const totalDeduct  = deductions.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const net          = Math.max(0, grossMonthly - totalDeduct);
  const empTotal     = employer.reduce((s, c) => s + (c.annual_amount || 0), 0);
  const varAnnual    = variableEarnings.reduce((s, c) => s + (c.annual_amount || 0), 0);
  const totalCtcAnn  = previewCtc * 12;

  const Row = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0" }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );

  return (
    <div style={{ width: 272, flexShrink: 0, borderLeft: "0.5px solid var(--border)", background: "var(--surface-2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 10px", borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Template Summary (Monthly)</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {/* Monthly summary */}
        <div style={{ borderBottom: "0.5px solid var(--border)", paddingBottom: 10, marginBottom: 10 }}>
          <Row label="Total Fixed Pay"                     value={fmtINR(totalFixed)} />
          <Row label="Total Variable Pay (Monthly Equiv.)" value={fmtINR(totalVarMon)} />
        </div>
        <Row label="Gross Salary"     value={fmtINR(grossMonthly)} />
        <Row label="Total Deductions" value={fmtINR(totalDeduct)} color="#dc2626" />
        <div style={{ margin: "10px 0", padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, border: "0.5px solid #bbf7d0" }}>
          <p style={{ fontSize: 11, color: "#15803d", marginBottom: 2 }}>Net Salary (Take Home)</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#15803d", fontVariantNumeric: "tabular-nums" }}>{fmtINR(net)}</p>
        </div>

        {/* Annual CTC summary */}
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>CTC Summary (Annual)</p>
          <Row label="Total Fixed Pay (Annual)"         value={fmtINR(totalFixed * 12)} />
          <Row label="Total Variable Pay (Annual)"      value={fmtINR(varAnnual)} />
          <Row label="Employer Contributions (Annual)"  value={fmtINR(empTotal)} />
        </div>
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#eff6ff", borderRadius: 8, border: "0.5px solid #bfdbfe" }}>
          <p style={{ fontSize: 11, color: "#1d4ed8", marginBottom: 2 }}>Total CTC (Annual)</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>{fmtINR(totalCtcAnn)}</p>
        </div>

        {/* Component count chips */}
        {components.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["Earnings",     earnings.length,   "#e0e7ff", "#3730a3"],
              ["Deductions",   deductions.length, "#fee2e2", "#991b1b"],
              ["Employer",     employer.length,   "#dbeafe", "#1e40af"],
            ].map(([label, count, bg, fg]) => (
              <span key={label} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: bg, color: fg, fontWeight: 500 }}>
                {label}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── History placeholder ──────────────────────────────────────────────────────
function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <History size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500">Version History</p>
      <p className="text-xs text-gray-300 mt-1">Saved revisions will appear here.</p>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export default function SalaryStructureEditor() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const isNew     = !id || id === "new";

  const [structure, setStructure]     = useState(null);
  const [masterComps, setMasterComps] = useState([]);
  const [activeTab, setActiveTab]     = useState("fixed");
  const [computed, setComputed]       = useState(null);
  const [panelOpen, setPanelOpen]     = useState(false);
  const [editLine, setEditLine]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName]     = useState("");
  const computeTimer                  = useRef(null);
  const PREVIEW_CTC                   = 100000;

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mc = await listComponents(null);
      setMasterComps(mc ?? []);
      if (!isNew) {
        const s = await getStructure(id);
        setStructure(s);
        setDraftName(s.structure_name);
      } else {
        const blank = { structure_id: null, structure_name: "New Salary Structure", description: "", is_default: false, lines: [] };
        setStructure(blank);
        setDraftName(blank.structure_name);
      }
    } catch { errorToast("Failed to load structure"); }
    finally { setLoading(false); }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  // ── Live CTC compute ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!structure?.structure_id) return;
    clearTimeout(computeTimer.current);
    computeTimer.current = setTimeout(async () => {
      try { setComputed(await computeCTC(structure.structure_id, PREVIEW_CTC * 12)); }
      catch {}
    }, 500);
    return () => clearTimeout(computeTimer.current);
  }, [structure?.structure_id, structure?.lines]);

  // ── Save metadata ─────────────────────────────────────────────────────────
  const saveMeta = async (patch = {}) => {
    const payload = {
      structure_name: draftName,
      description:    structure.description,
      is_default:     structure.is_default,
      lines: [],
      ...patch,
    };
    if (isNew && !structure.structure_id) {
      const created = await createStructure(payload);
      navigate(`/dashboard/salary-structures/${created.structure_id}`, { replace: true });
      return created;
    }
    return await updateStructure(structure.structure_id, payload);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMeta();
      setStructure(prev => ({ ...prev, structure_name: draftName }));
      successToast("Structure saved");
      if (!isNew) await load();
    } catch (err) { errorToast(getErrorMessage(err, "Save failed")); }
    finally { setSaving(false); }
  };

  // ── Panel: add / edit component ───────────────────────────────────────────
  const handlePanelSave = async (data) => {
    try {
      let componentId;
      if (data.mode === "existing") {
        componentId = data.component_id;
      } else if (data.component_id) {
        await updateStructure(structure.structure_id, {
          structure_name: structure.structure_name,
          description:    structure.description,
          is_default:     structure.is_default,
          lines: [{
            component_id:           data.component_id,
            calc_type_override:     data.calc_type,
            percentage_override:    data.calc_type === "Percentage"   ? Number(data.percentage_value) : null,
            percentage_of_override: data.calc_type === "Percentage"   ? data.percentage_of : null,
            formula_override:       data.calc_type === "Formula"      ? data.formula_expr  : null,
            fixed_amount:           data.calc_type === "Fixed Amount" ? Number(data.fixed_amount ?? 0) : null,
            sort_order:             Number(data.sort_order) || 100,
          }],
        });
        successToast("Component updated");
        setPanelOpen(false); setEditLine(null);
        await load(); return;
      } else {
        const created = await createComponent({
          component_name:    data.component_name,
          component_code:    data.component_code,
          category:          data.category,
          calc_type:         data.calc_type,
          percentage_value:  data.percentage_value,
          percentage_of:     data.percentage_of,
          formula_expr:      data.formula_expr,
          frequency:         data.frequency,
          is_taxable:        data.is_taxable,
          pf_applicable:     data.pf_applicable,
          esi_applicable:    data.esi_applicable,
          show_offer_letter: data.show_offer_letter,
          show_ctc_breakup:  data.show_ctc_breakup,
          show_payslip:      data.show_payslip,
          sort_order:        data.sort_order,
        });
        componentId = created.component_id;
      }

      let sid = structure.structure_id;
      if (!sid) {
        const s = await saveMeta();
        sid = s.structure_id;
        setStructure(prev => ({ ...prev, structure_id: sid }));
      }

      await updateStructure(sid, {
        structure_name: structure.structure_name,
        description:    structure.description,
        is_default:     structure.is_default,
        lines: [{ component_id: componentId, sort_order: Number(data.sort_order) || 100 }],
      });

      successToast("Component added");
      setPanelOpen(false); setEditLine(null);
      await load();
    } catch (err) { errorToast(getErrorMessage(err, "Failed to save component")); }
  };

  const handleRemoveLine = async (line) => {
    if (!window.confirm(`Remove "${line.component_name}" from this structure?`)) return;
    try {
      await removeStructureLine(structure.structure_id, line.component_id);
      successToast("Component removed");
      await load();
    } catch (err) { errorToast(getErrorMessage(err, "Failed to remove")); }
  };

  const openAdd    = () => { setEditLine(null);  setPanelOpen(true); };
  const openEdit   = (line) => { setEditLine(line); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditLine(null); };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading structure…
      </div>
    );
  }
  if (!structure) return null;

  const tabLines     = tabFilter(structure.lines, activeTab);
  const existingIds  = new Set((structure.lines ?? []).map(l => l.component_id));
  const defaultCat   = (TAB_META[activeTab] ?? {}).category ?? "Earning";
  const strCode      = `SAL-STR-${String(structure.structure_id || "NEW").padStart(3, "0")}`;

  const COMPONENT_TABS  = ["fixed", "variable", "employer", "deduct", "benefits", "onetime", "tax"];
  const PLACEHOLDER_TABS = ["benefits", "onetime", "tax"];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 px-6 pt-4 pb-3 bg-white">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link to="/dashboard/payroll" className="hover:text-gray-600 transition-colors">Payroll</Link>
          <span className="text-gray-300">›</span>
          <Link to="/dashboard/salary-structures" className="hover:text-gray-600 transition-colors">Salary Structures</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 font-medium truncate max-w-56">{structure.structure_name}</span>
        </nav>

        {/* Title + actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate("/dashboard/salary-structures")}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
            >
              <ArrowLeft size={15} />
            </button>

            {editingName ? (
              <input
                autoFocus
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                className="text-xl font-bold text-gray-900 border-b-2 border-indigo-400 outline-none bg-transparent min-w-72"
              />
            ) : (
              <h1
                onClick={() => setEditingName(true)}
                title="Click to rename"
                className="text-xl font-bold text-gray-900 cursor-text hover:text-indigo-700 transition-colors truncate"
              >
                {draftName}
              </h1>
            )}

            <span className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
              structure.is_default
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-green-50 text-green-600 border-green-200"
            }`}>
              {structure.is_default ? "Default" : "Active"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("preview")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Eye size={14} /> Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
            >
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              onClick={() => successToast("Structure published!")}
            >
              <CheckCircle size={14} /> Publish
            </button>
            <button className="flex items-center gap-1 border border-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              More <ChevronDown size={12} />
            </button>
          </div>
        </div>

        {structure.description && (
          <p className="text-xs text-gray-400 mt-1.5 ml-9">{structure.description}</p>
        )}
      </div>

      {/* ── Meta info grid ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
        <div className="grid grid-cols-4 gap-x-8 gap-y-3.5">
          <MetaField icon={<Tag size={13} />}        label="Template Code"  value={strCode} />
          <MetaField icon={<Users size={13} />}      label="Employee Type"  value="All Employees" />
          <MetaField icon={<Repeat size={13} />}     label="Pay Frequency"  value="Monthly" />
          <MetaField icon={<Calendar size={13} />}   label="Effective From" value="01 Jan 2025" />
          <MetaField icon={<Building2 size={13} />}  label="Company"        value="All Companies" />
          <MetaField icon={<Coins size={13} />}      label="Currency"       value="INR — Indian Rupee" />
          <MetaField icon={<Globe size={13} />}      label="Department"     value="All Departments" />
          <MetaField icon={<MapPin size={13} />}     label="Location"       value="All Locations" />
          <MetaField icon={<CheckCircle size={13} />} label="Status"        value={structure.is_default ? "Default" : "Active"} badge />
          {structure.description && (
            <div className="col-span-3 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5 shrink-0"><AlignLeft size={13} /></span>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none mb-0.5">Description</p>
                <p className="text-[12px] text-gray-600">{structure.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content (full width, no sidebar) ───────────────────────── */}
      <div className="flex-1 overflow-auto bg-white">
        {COMPONENT_TABS.includes(activeTab) && !PLACEHOLDER_TABS.includes(activeTab) && (
          <ComponentTab
            tab={activeTab}
            lines={tabLines}
            computed={computed}
            canAdd={!!structure.structure_id}
            onAdd={openAdd}
            onEdit={openEdit}
            onRemove={handleRemoveLine}
          />
        )}
        {PLACEHOLDER_TABS.includes(activeTab) && (
          <PlaceholderTab
            title={(TAB_META[activeTab] ?? {}).title}
            sub={(TAB_META[activeTab] ?? {}).sub}
          />
        )}
        {activeTab === "formula" && <FormulaBuilderTab lines={structure.lines ?? []} />}
        {activeTab === "preview" && <SalaryPreviewTab  structureId={structure.structure_id} />}
        {activeTab === "history" && <HistoryTab />}
      </div>

      {/* ── Add/Edit panel overlay ──────────────────────────────────────── */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={closePanel} />
          <AddEditComponentPanel
            initial={editLine}
            masterComponents={masterComps}
            existingIds={existingIds}
            defaultCategory={defaultCat}
            onSave={handlePanelSave}
            onClose={closePanel}
          />
        </>
      )}
    </div>
  );
}
