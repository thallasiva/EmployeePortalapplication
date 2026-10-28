import React, { useState, useEffect } from "react";
import { Plus, Download, Play, Save, Trash2, Edit2, Check, BarChart2, PieChart, Table2, ArrowLeft } from "lucide-react";
import { reportsApi } from "../../api/settings.api";
import apiClient from "../../api/client";
import { listEmployees } from "../../api/employee.api";
import { jsPDF } from "jspdf";
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
const COLUMN_ALIASES = {
  "Employee": ["employee_name", "name", "full_name"], "Name": ["employee_name", "name", "full_name"],
  "Employee ID": ["emp_code", "employee_id", "employee_number"], "Department": ["department_name", "department", "dept_name"],
  "Designation": ["designation", "emp_job_title", "job_title"], "Join Date": ["emp_joining_date", "joining_date"],
  "Date": ["date", "attendance_date", "created_at"], "Check In": ["check_in", "check_in_time", "first_in"],
  "Check Out": ["check_out", "check_out_time", "last_out"], "Hours Worked": ["work_hours", "hours_worked", "total_hours"],
  "Late By": ["late_by_minutes", "late_by"], "From": ["from_date", "start_date"], "To": ["to_date", "end_date"],
  "Days": ["days", "leave_days"], "Month": ["month", "pay_month"], "Gross": ["gross_earnings", "gross_salary", "gross"],
  "Net Pay": ["net_pay", "net_salary"], "Job Title": ["job_title", "title"], "Candidate": ["candidate_name", "candidate"],
  "Applied On": ["applied_at", "created_at"],
};
function columnValue(row, label) {
  const keys = [...(COLUMN_ALIASES[label] || []), label.toLowerCase().replace(/[^a-z0-9]/g, "_")];
  const key = keys.find((candidate) => row[candidate] !== undefined);
  return key ? row[key] ?? "—" : "—";
}
function MiniBarChart({ cols, rows })
{
  const bars = rows.slice(0, 6).map((row, i) => ({
    label: String(row.month || row.department_name || row.status || i + 1).slice(0, 8),
    value: Number(row.total || row.count || row.employee_count || row.value || 0),
  }));
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <p className="text-[12px] font-bold text-[#64748b] mb-3">{cols.slice(0, 2).join(" vs ") || "Report Chart"}</p>
      <div className="flex items-end gap-2 h-32">
        {bars.map(({ label, value }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t" style={{ height: `${Math.max(4, value / max * 100)}%`, background: BRAND, opacity: 0.8 }} />
            <span className="text-[10px] text-[#94a3b8]">{label}</span>
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
  const [rows, setRows] = useState([]);
  const [runError, setRunError] = useState("");
  const cols = MODULES[module] || [];
  const filts = FILTERS_FOR[module] || [];
  const toggleCol = (c) => setSelCols(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleFilt = (f) => setSelFilts(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const exportReport = (kind) => {
    const matrix = [selCols, ...visibleRows];
    const filename = (name || "report").trim().replace(/[^a-z0-9_-]+/gi, "_");
    if (kind === "PDF") {
      const pdf = new jsPDF();
      let y = 18;
      pdf.setFontSize(14);
      pdf.text(name || "Report", 12, y);
      pdf.setFontSize(9);
      y += 10;
      matrix.forEach((row) => {
        const lines = pdf.splitTextToSize(row.map((cell) => String(cell ?? "")).join("  |  "), 185);
        const height = lines.length * 5 + 2;
        if (y + height > 285) {
          pdf.addPage();
          y = 15;
        }
        pdf.text(lines, 12, y);
        y += height;
      });
      pdf.save(`${filename}.pdf`);
      return;
    }
    const delimiter = kind === "Excel" ? "\t" : ",";
    const content = matrix
      .map((row) => row.map((cell) => {
        const value = String(cell ?? "").replace(/[\r\n\t]+/g, " ");
        return kind === "Excel" ? value : `"${value.replace(/"/g, '""')}"`;
      }).join(delimiter))
      .join("\r\n");
    const extension = kind === "Excel" ? "xls" : "csv";
    const type = kind === "Excel" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8";
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const runReport = async () => {
    setRunning(true);
    setRunError("");
    const now = new Date();
    const params = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      from_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to_date: now.toISOString().slice(0, 10),
    };
    const endpoints = {
      Employees: ["/reports/employees", null, "byDepartment"],
      Attendance: ["/reports/attendance", params, "details"],
      Leave: ["/reports/leave", params, "details"],
      Payroll: ["/reports/payroll", params, "details"],
      Recruitment: ["/reports/hiring", null, "openJobs"],
      Performance: ["/reports/reviews", null, "details"],
      Helpdesk: ["/reports/helpdesk", params, "byStatus"],
    };
    try {
      if (module === "Employees") {
        const result = await listEmployees({ page: 1, limit: 100 });
        setRows(result.data);
        setRan(true);
        return;
      }
      const [url, query, resultKey] = endpoints[module];
      const response = await apiClient.get(url, { params: query || undefined });
      const data = response.data?.data || {};
      setRows(Array.isArray(data) ? data : data[resultKey] || []);
      setRan(true);
    } catch (error) {
      setRunError(error?.response?.data?.message || "Unable to run this report.");
      setRan(false);
    } finally {
      setRunning(false);
    }
  };
  const visibleRows = rows.map((row) => selCols.map((column) => columnValue(row, column)));
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#f18200] text-[12px] font-semibold inline-flex items-center gap-1"><ArrowLeft size={12} /> Reports</button>
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
                <button key={m} onClick={() => { setModule(m); setSelCols(MODULES[m].slice(0, 4)); setSelFilts([]); setRan(false); setRows([]); setRunError(""); }}
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
                    <button key={fmt} onClick={() => exportReport(fmt)} className="flex items-center gap-1 h-[28px] px-3 border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#64748b] hover:border-[#f18200] hover:text-[#f18200]">
                      <Download size={10} />{fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {runError && <p className="px-5 py-3 text-sm text-red-600">{runError}</p>}
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
                  {visibleRows.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No matching records.</p>}
                  <div className="px-5 py-3 text-[11px] text-[#94a3b8]">
                    Showing {visibleRows.length} of {visibleRows.length} results
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <MiniBarChart cols={selCols} rows={rows} />
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
  const [reports, setReports] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    reportsApi.list().then(data => {
      if (Array.isArray(data)) setReports(data.map((report) => ({ ...report, updated: report.updated_at || report.updated })));
    }).catch(() => setToast("Unable to load saved reports."));
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
      setToast("Unable to save report to the server.");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    setEditing(null);
    setToast("Report saved!"); setTimeout(() => setToast(""), 3000);
  };
  if (editing !== null) return (
    <div>
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
      <BuilderView report={editing} onBack={() => setEditing(null)} onSave={handleSave} />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
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
                <button onClick={async () => { try { await reportsApi.delete(r.id); setReports(p => p.filter(x => x.id !== r.id)); } catch { setToast("Unable to delete report."); setTimeout(() => setToast(""), 3000); } }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
