import React, { useState, useEffect, useMemo } from "react";
import
  {
    Plus, Download, Play, Save, Trash2, Edit2, X, Check,
    FileText, BarChart2, PieChart, Table2, Filter, ChevronDown, Eye
  } from "lucide-react";
import { reportsApi } from "../../api/settings.api";

const BRAND = "#f18200";

const MODULES = {
  Employees: ["Name", "Employee ID", "Department", "Designation", "Email", "Phone", "Join Date", "Status", "Gender", "Location"],
  Attendance: ["Employee", "Date", "Check In", "Check Out", "Hours Worked", "Status", "Late By", "OT Hours"],
  Leave: ["Employee", "Leave Type", "From", "To", "Days", "Status", "Applied On", "Approved By"],
  Payroll: ["Employee", "Month", "Gross", "Basic", "HRA", "Allowances", "Deductions", "Net Pay", "TDS", "PF"],
  Recruitment: ["Job Title", "Candidate", "Stage", "Applied On", "Source", "Interviewer", "Status", "Offer Date"],
  Performance: ["Employee", "Review Period", "Rating", "Goals Met", "KPIs", "Reviewer", "Status"],
  Helpdesk: ["Ticket ID", "Employee", "Subject", "Category", "Priority", "Status", "Created", "Resolved"],
};

const FILTERS_FOR = {
  Employees: ["Department", "Designation", "Status", "Gender", "Location", "Join Date Range"],
  Attendance: ["Date Range", "Status", "Department", "Employee"],
  Leave: ["Leave Type", "Status", "Date Range", "Department"],
  Payroll: ["Month", "Department", "Status"],
  Recruitment: ["Stage", "Status", "Source", "Date Range"],
  Performance: ["Review Period", "Rating", "Department"],
  Helpdesk: ["Priority", "Status", "Category", "Date Range"],
};

const FORMATS = [
  { id: "table", label: "Table", icon: <Table2 size={14} /> },
  { id: "bar", label: "Bar Chart", icon: <BarChart2 size={14} /> },
  { id: "pie", label: "Pie Chart", icon: <PieChart size={14} /> },
];

const SAVED_REPORTS = [
  { id: 1, name: "Monthly Headcount", module: "Employees", format: "table", updated: "01 Aug 2026" },
  { id: 2, name: "Leave Utilization", module: "Leave", format: "bar", updated: "29 Jul 2026" },
  { id: 3, name: "Payroll Summary", module: "Payroll", format: "table", updated: "28 Jul 2026" },
];

const SAMPLE_ROWS = [
  ["EMP001", "Ravi Kumar", "Engineering", "Senior Dev", "Active", "Bangalore"],
  ["EMP002", "Priya Shah", "HR", "HR Manager", "Active", "Mumbai"],
  ["EMP003", "Arjun Mehta", "Finance", "Analyst", "Active", "Delhi"],
  ["EMP004", "Sneha Patel", "Marketing", "Executive", "On Leave", "Pune"],
];

function MiniBarChart({ cols })
{
  const bars = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => ({ m, v: 40 + Math.floor(Math.random() * 50) }));
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <p className="text-[12px] font-bold text-[#64748b] mb-3">{cols.slice(0, 2).join(" vs ") || "Report Chart"}</p>
      <div className="flex items-end gap-2 h-32">
        {bars.map(({ m, v }) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${v}%`, background: BRAND, opacity: 0.8 }} />
            <span className="text-[10px] text-[#94a3b8]">{m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuilderView({ report, onBack, onSave })
{
  const [name, setName] = useState(report.name || "New Report");
  const [module, setModule] = useState(report.module || "Employees");
  const [selCols, setSelCols] = useState(report.columns || MODULES["Employees"].slice(0, 4));
  const [selFilts, setSelFilts] = useState(report.filters || []);
  const [format, setFormat] = useState(report.format || "table");
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  const cols = MODULES[module] || [];
  const filts = FILTERS_FOR[module] || [];

  const toggleCol = (c) => setSelCols(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleFilt = (f) => setSelFilts(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const runReport = () =>
  {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 1200);
  };

  const visibleRows = SAMPLE_ROWS.map(r => r.slice(0, selCols.length || 4));

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#f18200] text-[12px] font-semibold">← Reports</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={name} onChange={e => setName(e.target.value)}
          className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#f18200] w-52" />
        <div className="ml-auto flex gap-2">
          <button onClick={runReport} disabled={running}
            className="flex items-center gap-1.5 h-[34px] px-4 border border-[#f18200] text-[#f18200] rounded-lg text-[12px] font-bold hover:bg-[#fff8f0] disabled:opacity-50">
            {running ? <div className="w-3 h-3 border-2 border-[#f18200] border-t-transparent rounded-full animate-spin" /> : <Play size={12} />}
            {running ? "Running…" : "Run Report"}
          </button>
          <button onClick={() => onSave({ ...report, name, module, format, columns: selCols, filters: selFilts, updated: "Now" })}
            className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold">
            <Save size={12} /> Save
          </button>
        </div>
      </div>

      <div className="px-6 py-5 grid grid-cols-12 gap-5">
        {/* Config panel */}
        <div className="col-span-4 space-y-4">
          {/* Module */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Data Module</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(MODULES).map(m => (
                <button key={m} onClick={() => { setModule(m); setSelCols(MODULES[m].slice(0, 4)); setSelFilts([]); setRan(false); }}
                  className={`h-[32px] px-2 rounded-lg text-[11px] font-semibold border transition-all ${module === m ? "bg-[#f18200] text-white border-[#f18200]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#f18200]/40"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Columns ({selCols.length})</p>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {cols.map(c => (
                <label key={c} className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input type="checkbox" checked={selCols.includes(c)} onChange={() => toggleCol(c)} className="accent-[#f18200]" />
                  <span className="text-[12px] text-[#374151]">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Filters</p>
            <div className="space-y-1">
              {filts.map(f => (
                <label key={f} className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input type="checkbox" checked={selFilts.includes(f)} onChange={() => toggleFilt(f)} className="accent-[#f18200]" />
                  <span className="text-[12px] text-[#374151]">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Output Format</p>
            <div className="flex gap-2">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all ${format === f.id ? "border-[#f18200] bg-[#fff8f0] text-[#f18200]" : "border-[#e2e8f0] text-[#64748b]"}`}>
                  {f.icon}{f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <p className="text-[13px] font-bold text-[#1e293b]">{name} — Preview</p>
              {ran && (
                <div className="flex gap-2">
                  {["CSV", "Excel", "PDF"].map(fmt => (
                    <button key={fmt} className="flex items-center gap-1 h-[28px] px-3 border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#64748b] hover:border-[#f18200] hover:text-[#f18200]">
                      <Download size={10} />{fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!ran ? (
              <div className="p-16 flex flex-col items-center gap-3 text-center">
                <BarChart2 size={40} className="text-[#e2e8f0]" />
                <p className="text-[#94a3b8] text-[13px]">Configure your report and click <strong>Run Report</strong> to preview results.</p>
              </div>
            ) : format === "table" ? (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]"
                    style={{ gridTemplateColumns: `repeat(${selCols.length},1fr)` }}>
                    {selCols.map(c => <span key={c} className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">{c}</span>)}
                  </div>
                  {visibleRows.map((row, i) => (
                    <div key={i} className="grid px-5 py-3.5 border-b border-[#f8fafc] hover:bg-[#fafbff]"
                      style={{ gridTemplateColumns: `repeat(${selCols.length},1fr)` }}>
                      {row.map((cell, j) => <span key={j} className="text-[12px] text-[#374151] truncate">{cell}</span>)}
                    </div>
                  ))}
                  <div className="px-5 py-3 text-[11px] text-[#94a3b8]">
                    Showing {visibleRows.length} of {visibleRows.length} results
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <MiniBarChart cols={selCols} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportBuilder()
{
  const [reports, setReports] = useState(SAVED_REPORTS);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    reportsApi.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setReports(data);
    }).catch(() => {});
  }, []);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const updated = await reportsApi.update(data.id, data);
        setReports(p => p.map(r => r.id === data.id ? updated : r));
      } else {
        const created = await reportsApi.create(data);
        setReports(p => [created, ...p]);
      }
    } catch {
      setReports(p => data.id && p.find(r => r.id === data.id)
        ? p.map(r => r.id === data.id ? { ...r, ...data } : r)
        : [...p, { ...data, id: Date.now() }]
      );
    }
    setEditing(null);
    setToast("Report saved!"); setTimeout(() => setToast(""), 3000);
  };

  if (editing !== null) return <BuilderView report={editing} onBack={() => setEditing(null)} onSave={handleSave} />;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2"><Check size={15} />{toast}</div>}

      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center">
            <BarChart2 size={18} color={BRAND} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1e293b]">Report Builder</h1>
            <p className="text-[13px] text-[#94a3b8]">Build custom reports with filters, columns and chart formats</p>
          </div>
        </div>
        <button onClick={() => setEditing({ name: "New Report" })}
          className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">
          <Plus size={15} /> New Report
        </button>
      </div>

      <div className="px-6 pb-10">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 bg-[#f8fafc] border-b text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
            <span className="col-span-4">Report Name</span>
            <span className="col-span-3">Module</span>
            <span className="col-span-2">Format</span>
            <span className="col-span-2">Updated</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>
          {reports.map(r => (
            <div key={r.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#f8fafc] items-center hover:bg-[#fafbff]">
              <span className="col-span-4 text-[13px] font-semibold text-[#1e293b]">{r.name}</span>
              <span className="col-span-3"><span className="px-2.5 py-1 bg-[#f1f5f9] text-[#64748b] rounded-full text-[11px] font-semibold">{r.module}</span></span>
              <span className="col-span-2 flex items-center gap-1.5 text-[12px] text-[#64748b]">
                {r.format === "table" ? <Table2 size={12} /> : r.format === "bar" ? <BarChart2 size={12} /> : <PieChart size={12} />}
                {r.format === "table" ? "Table" : r.format === "bar" ? "Bar Chart" : "Pie Chart"}
              </span>
              <span className="col-span-2 text-[12px] text-[#94a3b8]">{r.updated}</span>
              <div className="col-span-1 flex justify-end gap-1">
                <button onClick={() => setEditing(r)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#f18200]"><Edit2 size={12} /></button>
                <button onClick={async () => { try { await reportsApi.delete(r.id); } catch {} setReports(p => p.filter(x => x.id !== r.id)); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
