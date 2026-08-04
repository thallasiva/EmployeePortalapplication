import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, Save,
  ToggleLeft, ToggleRight,
} from "lucide-react";
import { fmtINR, tabFilter } from "../../../salary/salaryHelpers";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const NAVY  = "#1e3a5f";
const AMBER = "#d97706";
const AMBER_TEXT = "#92400e";

// ─── Inline SVG donut chart ───────────────────────────────────────────────────
function DonutChart({ slices }) {
  const R = 56, CX = 75, CY = 75, stroke = 20;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={CX} y={CY - 5} textAnchor="middle" fontSize={9} fill="#6b7280">CTC</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize={12} fontWeight="bold" fill={NAVY}>
        {slices.filter(s=>s.label).length ? "Live" : "—"}
      </text>
    </svg>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TEMPLATE_TABS = [
  { id: "fixed",    label: "Earnings" },
  { id: "variable", label: "Variable Pay" },
  { id: "benefits", label: "Benefits" },
  { id: "deduct",   label: "Deductions" },
  { id: "employer", label: "Employer Contribution" },
  { id: "other",    label: "Other Info" },
];

// ─── Row actions ──────────────────────────────────────────────────────────────
function RowActions({ line, onEdit, onRemove }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onEdit(line)}
        className="p-1 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
        <Edit2 size={13} />
      </button>
      <button onClick={() => onRemove(line)}
        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Earnings table ───────────────────────────────────────────────────────────
function EarningsTable({ lines, onAdd, onEdit, onRemove, canAdd }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          EARNINGS (Fixed Components)
        </span>
        {canAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: AMBER }}>
            <Plus size={12} /> Add Earning
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
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
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-xs">No earnings added yet</td></tr>
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
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Variable pay table ───────────────────────────────────────────────────────
function VariableTable({ lines, onAdd, onEdit, onRemove, canAdd }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          VARIABLE PAY (Incentives / Bonus)
        </span>
        {canAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: AMBER }}>
            <Plus size={12} /> Add Variable
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Component","Type","Frequency","Target/Amount","Status","Action"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-xs">No variable pay added yet</td></tr>
            ) : lines.map(l => (
              <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                <td className="px-3 py-2 text-gray-500">{l.calc_type ?? "Bonus"}</td>
                <td className="px-3 py-2 text-gray-500">{l.frequency ?? "Annual"}</td>
                <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                <td className="px-3 py-2">
                  <ToggleRight size={18} className="text-green-500" />
                </td>
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Generic section tab ──────────────────────────────────────────────────────
function GenericTab({ lines, onAdd, onEdit, onRemove, canAdd, label }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{label}</span>
        {canAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: AMBER }}>
            <Plus size={12} /> Add Component
          </button>
        )}
      </div>
      {lines.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No components added yet</div>
      ) : (
        <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Component","Amount (₹)","Action"].map(h => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.component_id} className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{l.component_name}</td>
                <td className="px-3 py-2 text-gray-700">{fmtINR(l.amount)}</td>
                <td className="px-3 py-2"><RowActions line={l} onEdit={onEdit} onRemove={onRemove} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Salary summary sidebar ───────────────────────────────────────────────────
function SalarySummary({ computed, structure }) {
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
    { label: "Fixed",    pct: Math.round((totalFixed / safe) * 100), color: NAVY },
    { label: "Variable", pct: Math.round((totalVar   / safe) * 100), color: AMBER },
    { label: "Benefits", pct: Math.round((totalBen   / safe) * 100), color: "#10b981" },
    { label: "Employer", pct: Math.round((totalEmp   / safe) * 100), color: "#6366f1" },
    { label: "Deduct",   pct: Math.round((totalDed   / safe) * 100), color: "#ef4444" },
  ].filter(s => s.pct > 0);

  const sum = slices.reduce((s, sl) => s + sl.pct, 0);
  if (sum < 100) slices.push({ label: "", pct: 100 - sum, color: "#e5e7eb" });

  const legend = [
    { label: "Fixed Earnings",      value: fmtINR(totalFixed), color: NAVY },
    { label: "Variable Pay",        value: fmtINR(totalVar),   color: AMBER },
    { label: "Benefits",            value: fmtINR(totalBen),   color: "#10b981" },
    { label: "Employer Contrib.",   value: fmtINR(totalEmp),   color: "#6366f1" },
    { label: "Deductions",          value: fmtINR(totalDed),   color: "#ef4444" },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-white" style={{ backgroundColor: NAVY }}>
        SALARY SUMMARY
      </div>
      <div className="flex justify-center py-4 border-b border-gray-50">
        <DonutChart slices={slices} />
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {legend.map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
              <span className="text-gray-600">{row.label}</span>
            </div>
            <span className="font-semibold text-gray-800">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 px-4 py-3 space-y-1">
        <div className="flex justify-between text-xs font-bold" style={{ color: NAVY }}>
          <span>Total CTC</span>
          <span>{ctc ? fmtINR(ctc) : "₹ 18,00,000"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Net Salary (Take Home)</span>
          <span className="font-semibold text-green-600">{net ? fmtINR(net) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

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
  canAdd,
}) {
  const navigate = useNavigate();
  const strCode = `SAL-STR-${String(structure?.structure_id || "NEW").padStart(3, "0")}`;

  const fixedLines    = useMemo(() => tabFilter(structure?.lines ?? [], "fixed"),    [structure?.lines]);
  const variableLines = useMemo(() => tabFilter(structure?.lines ?? [], "variable"), [structure?.lines]);
  const deductLines   = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"),   [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);

  const currentTab = TEMPLATE_TABS.some(t => t.id === activeTab) ? activeTab : "fixed";

  function renderContent() {
    switch (currentTab) {
      case "fixed":
        return (
          <div className="flex gap-4 h-full">
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <EarningsTable lines={fixedLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
            </div>
            <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <VariableTable lines={variableLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
            </div>
          </div>
        );
      case "variable":
        return (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <VariableTable lines={variableLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} />
          </div>
        );
      case "deduct":
        return (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <GenericTab lines={deductLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} label="Deductions" />
          </div>
        );
      case "employer":
        return (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden h-full">
            <GenericTab lines={employerLines} onAdd={openAdd} onEdit={openEdit} onRemove={handleRemoveLine} canAdd={canAdd} label="Employer Contributions" />
          </div>
        );
      default:
        return (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white flex items-center justify-center h-40 text-gray-400 text-sm">
            Coming soon
          </div>
        );
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8f9fb" }}>
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
            <button onClick={() => navigate("/dashboard/salary-structures")}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={15} />
            </button>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: NAVY }}>
              SS
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {editingName ? (
                  <input autoFocus value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                    className="text-base font-bold text-gray-900 border-b-2 outline-none bg-transparent"
                    style={{ borderColor: AMBER }} />
                ) : (
                  <h1 onClick={() => setEditingName(true)} title="Click to rename"
                    className="text-base font-bold text-gray-900 cursor-text hover:underline truncate max-w-72">
                    {draftName}
                  </h1>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                  style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>
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
            <button onClick={() => setActiveTab("preview")}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              <Eye size={14} /> Preview Salary
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
              Save Draft
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 shadow-sm transition-opacity"
              style={{ backgroundColor: AMBER }}>
              <Save size={14} /> {saving ? "Saving…" : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 overflow-x-auto">
        <div className="flex min-w-max">
          {TEMPLATE_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-5 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all"
              style={currentTab === t.id
                ? { borderColor: AMBER, color: AMBER_TEXT }
                : { borderColor: "transparent", color: "#9ca3af" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content + sidebar ── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        <div className="flex-1 overflow-auto min-w-0">{renderContent()}</div>
        <div className="w-72 shrink-0 overflow-auto">
          <SalarySummary computed={computed} structure={structure} />
        </div>
      </div>
    </div>
  );
});

export default Template1Tabbed;
