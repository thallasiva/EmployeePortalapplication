import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, Save } from "lucide-react";
import { fmtINR, tabFilter } from "../../../salary/salaryHelpers";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const NAVY  = "#1e3a5f";
const AMBER = "#d97706";

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices }) {
  const R = 48, CX = 64, CY = 64, stroke = 18;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
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
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={8} fill="#9ca3af">CTC</text>
      <text x={CX} y={CY + 9} textAnchor="middle" fontSize={10} fontWeight="bold" fill={NAVY}>Total</text>
    </svg>
  );
}

// ─── Mini section panel ───────────────────────────────────────────────────────
function SectionPanel({ title, lines, onAdd, onEdit, onRemove, canAdd, accentColor, columns }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden min-w-0">
      {/* Panel header */}
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100"
        style={{ backgroundColor: accentColor + "12" }}>
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accentColor }}>
          {title}
        </span>
        {canAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded text-white"
            style={{ backgroundColor: accentColor }}>
            <Plus size={10} /> Add
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="grid bg-gray-50 border-b border-gray-100"
        style={{ gridTemplateColumns: `1fr 1fr auto` }}>
        {columns.map(c => (
          <div key={c} className="px-2 py-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{c}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {lines.length === 0 ? (
          <div className="px-3 py-6 text-center text-gray-300 text-xs">Empty</div>
        ) : lines.map(l => (
          <div key={l.component_id}
            className="grid items-center px-2 py-1.5 hover:bg-amber-50/30 transition-colors text-xs"
            style={{ gridTemplateColumns: `1fr 1fr auto` }}>
            <span className="truncate font-medium text-gray-800 text-[11px]">{l.component_name}</span>
            <span className="truncate text-gray-500 text-[11px]">{fmtINR(l.amount)}</span>
            <div className="flex gap-0.5">
              <button onClick={() => onEdit(l)}
                className="p-0.5 rounded text-gray-300 hover:text-amber-500 transition-colors">
                <Edit2 size={11} />
              </button>
              <button onClick={() => onRemove(l)}
                className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/60 flex justify-between text-[10px]">
        <span className="text-gray-500">{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
        <span className="font-bold" style={{ color: accentColor }}>
          {fmtINR(lines.reduce((s, l) => s + (l.amount || 0), 0))}
        </span>
      </div>
    </div>
  );
}

// ─── Compact summary ──────────────────────────────────────────────────────────
function CompactSummary({ structure }) {
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
    { label: "Fixed",   pct: Math.round((totalFixed/safe)*100), color: NAVY },
    { label: "Var",     pct: Math.round((totalVar/safe)*100),   color: AMBER },
    { label: "Ben",     pct: Math.round((totalBen/safe)*100),   color: "#10b981" },
    { label: "Emp",     pct: Math.round((totalEmp/safe)*100),   color: "#6366f1" },
    { label: "Ded",     pct: Math.round((totalDed/safe)*100),   color: "#ef4444" },
  ].filter(s => s.pct > 0);

  const sum = slices.reduce((s, sl) => s + sl.pct, 0);
  if (sum < 100) slices.push({ label: "", pct: 100 - sum, color: "#e5e7eb" });

  const rows = [
    { label: "Fixed Earnings",    value: fmtINR(totalFixed), color: NAVY },
    { label: "Variable Pay",      value: fmtINR(totalVar),   color: AMBER },
    { label: "Benefits",          value: fmtINR(totalBen),   color: "#10b981" },
    { label: "Employer Contrib.", value: fmtINR(totalEmp),   color: "#6366f1" },
    { label: "Deductions",        value: fmtINR(totalDed),   color: "#ef4444" },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ backgroundColor: NAVY }}>
        TOTAL SUMMARY
      </div>
      <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-50">
        <DonutChart slices={slices} />
        <div className="flex-1 space-y-1.5">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-gray-500">{r.label}</span>
              </div>
              <span className="font-semibold text-gray-700">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-2.5 space-y-1">
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
  canAdd,
}) {
  const navigate = useNavigate();
  const strCode = `SAL-STR-${String(structure?.structure_id || "NEW").padStart(3, "0")}`;

  const fixedLines    = useMemo(() => tabFilter(structure?.lines ?? [], "fixed"),    [structure?.lines]);
  const variableLines = useMemo(() => tabFilter(structure?.lines ?? [], "variable"), [structure?.lines]);
  const employerLines = useMemo(() => tabFilter(structure?.lines ?? [], "employer"), [structure?.lines]);
  const deductLines   = useMemo(() => tabFilter(structure?.lines ?? [], "deduct"),   [structure?.lines]);
  const benefitLines  = useMemo(() => (structure?.lines ?? []).filter(l => l.category === "Benefit"), [structure?.lines]);

  const SECTIONS = [
    { title: "EARNINGS (Fixed)", lines: fixedLines,    color: NAVY,      cols: ["Component","Amount",""] },
    { title: "VARIABLE PAY",     lines: variableLines, color: AMBER,     cols: ["Component","Amount",""] },
    { title: "BENEFITS",         lines: benefitLines,  color: "#10b981", cols: ["Component","Amount",""] },
    { title: "DEDUCTIONS",       lines: deductLines,   color: "#ef4444", cols: ["Component","Amount",""] },
    { title: "EMPLOYER CONTRIB.",lines: employerLines, color: "#6366f1", cols: ["Component","Amount",""] },
  ];

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8f9fb" }}>
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
            <button onClick={() => navigate("/dashboard/salary-structures")}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 shrink-0">
              <ArrowLeft size={14} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: NAVY }}>SS</div>
            <div className="flex items-center gap-3">
              {editingName ? (
                <input autoFocus value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => e.key === "Enter" && setEditingName(false)}
                  className="text-sm font-bold text-gray-900 border-b-2 outline-none bg-transparent"
                  style={{ borderColor: AMBER }} />
              ) : (
                <h1 onClick={() => setEditingName(true)} title="Click to rename"
                  className="text-sm font-bold text-gray-900 cursor-text hover:underline truncate max-w-52">
                  {draftName}
                </h1>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                style={{ backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>Active</span>
              <span className="text-[11px] text-gray-400">{strCode}</span>
              <span className="text-[11px] text-gray-300">·</span>
              <span className="text-[11px] text-gray-400">Monthly · INR · All Employees</span>
            </div>
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
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60 shadow-sm"
              style={{ backgroundColor: AMBER }}>
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
            {SECTIONS.map(sec => (
              <div key={sec.title} className="w-56 shrink-0 flex flex-col h-full">
                <SectionPanel
                  title={sec.title}
                  lines={sec.lines}
                  onAdd={openAdd}
                  onEdit={openEdit}
                  onRemove={handleRemoveLine}
                  canAdd={canAdd}
                  accentColor={sec.color}
                  columns={sec.cols}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary card */}
        <div className="w-64 shrink-0">
          <CompactSummary structure={structure} />
        </div>
      </div>
    </div>
  );
});

export default Template2Grid;
