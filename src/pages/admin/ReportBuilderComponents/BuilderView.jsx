import React, { useState } from "react";
import { Download, Play, Save, BarChart2, ArrowLeft } from "lucide-react";
import apiClient from "../../../api/client";
import { listEmployees } from "../../../api/employee.api";
import { jsPDF } from "jspdf";
import { MODULES, FILTERS_FOR, columnValue } from "./shared";
import { FORMATS } from "./FORMATS";
import { MiniBarChart } from "./MiniBarChart";
function BuilderView({
  report,
  onBack,
  onSave
}) {
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
  const toggleCol = c => setSelCols(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleFilt = f => setSelFilts(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);
  const exportReport = kind => {
    const matrix = [selCols, ...visibleRows];
    const filename = (name || "report").trim().replace(/[^a-z0-9_-]+/gi, "_");
    if (kind === "PDF") {
      const pdf = new jsPDF();
      let y = 18;
      pdf.setFontSize(14);
      pdf.text(name || "Report", 12, y);
      pdf.setFontSize(9);
      y += 10;
      matrix.forEach(row => {
        const lines = pdf.splitTextToSize(row.map(cell => String(cell ?? "")).join("  |  "), 185);
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
    const content = matrix.map(row => row.map(cell => {
      const value = String(cell ?? "").replace(/[\r\n\t]+/g, " ");
      return kind === "Excel" ? value : `"${value.replace(/"/g, '""')}"`;
    }).join(delimiter)).join("\r\n");
    const extension = kind === "Excel" ? "xls" : "csv";
    const type = kind === "Excel" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8";
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], {
      type
    }));
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
      to_date: now.toISOString().slice(0, 10)
    };
    const endpoints = {
      Employees: ["/reports/employees", null, "byDepartment"],
      Attendance: ["/reports/attendance", params, "details"],
      Leave: ["/reports/leave", params, "details"],
      Payroll: ["/reports/payroll", params, "details"],
      Recruitment: ["/reports/hiring", null, "openJobs"],
      Performance: ["/reports/reviews", null, "details"],
      Helpdesk: ["/reports/helpdesk", params, "byStatus"]
    };
    try {
      if (module === "Employees") {
        const result = await listEmployees({
          page: 1,
          limit: 100
        });
        setRows(result.data);
        setRan(true);
        return;
      }
      const [url, query, resultKey] = endpoints[module];
      const response = await apiClient.get(url, {
        params: query || undefined
      });
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
  const visibleRows = rows.map(row => selCols.map(column => columnValue(row, column)));
  return <div className="min-h-screen  ">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#e87500] text-[12px] font-semibold inline-flex items-center gap-1"><ArrowLeft size={12} /> Reports</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={name} onChange={e => setName(e.target.value)} className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#e87500] w-52" />
        <div className="ml-auto flex gap-2">
          <button onClick={runReport} disabled={running} className="flex items-center gap-1.5 h-[34px] px-4 border border-[#e87500] text-[#e87500] rounded-lg text-[12px] font-bold hover:bg-[#fff8f0] disabled:opacity-50">
            {running ? <div className="w-3 h-3 border-2 border-[#e87500] border-t-transparent rounded-full animate-spin" /> : <Play size={12} />}
            {running ? "Running…" : "Run Report"}
          </button>
          <button onClick={() => onSave({
          ...report,
          name,
          module,
          format,
          columns: selCols,
          filters: selFilts,
          updated: "Now"
        })} className="flex items-center gap-1.5 h-[34px] px-4 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold">
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
              {Object.keys(MODULES).map(m => <button key={m} onClick={() => {
              setModule(m);
              setSelCols(MODULES[m].slice(0, 4));
              setSelFilts([]);
              setRan(false);
              setRows([]);
              setRunError("");
            }} className={`h-[32px] px-2 rounded-lg text-[11px] font-semibold border transition-all ${module === m ? "bg-[#e87500] text-white border-[#e87500]" : "border-[#e2e8f0] text-[#64748b] hover:border-[#e87500]/40"}`}>
                  {m}
                </button>)}
            </div>
          </div>
          {/* Columns */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Columns ({selCols.length})</p>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {cols.map(c => <label key={c} className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input type="checkbox" checked={selCols.includes(c)} onChange={() => toggleCol(c)} className="accent-[#e87500]" />
                  <span className="text-[12px] text-[#374151]">{c}</span>
                </label>)}
            </div>
          </div>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Filters</p>
            <div className="space-y-1">
              {filts.map(f => <label key={f} className="flex items-center gap-2.5 cursor-pointer py-1">
                  <input type="checkbox" checked={selFilts.includes(f)} onChange={() => toggleFilt(f)} className="accent-[#e87500]" />
                  <span className="text-[12px] text-[#374151]">{f}</span>
                </label>)}
            </div>
          </div>
          {/* Format */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
            <p className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Output Format</p>
            <div className="flex gap-2">
              {FORMATS.map(f => <button key={f.id} onClick={() => setFormat(f.id)} className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all ${format === f.id ? "border-[#e87500] bg-[#fff8f0] text-[#e87500]" : "border-[#e2e8f0] text-[#64748b]"}`}>
                  {f.icon}{f.label}
                </button>)}
            </div>
          </div>
        </div>
        {/* Preview panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
              <p className="text-[13px] font-bold text-[#e87500]">{name} — Preview</p>
              {ran && <div className="flex gap-2">
                  {["CSV", "Excel", "PDF"].map(fmt => <button key={fmt} onClick={() => exportReport(fmt)} className="flex items-center gap-1 h-[28px] px-3 border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#64748b] hover:border-[#e87500] hover:text-[#e87500]">
                      <Download size={10} />{fmt}
                    </button>)}
                </div>}
            </div>
            {runError && <p className="px-5 py-3 text-sm text-red-600">{runError}</p>}
            {!ran ? <div className="p-16 flex flex-col items-center gap-3 text-center">
                <BarChart2 size={40} className="text-[#e2e8f0]" />
                <p className="text-[#94a3b8] text-[13px]">Configure your report and click <strong>Run Report</strong> to preview results.</p>
              </div> : format === "table" ? <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]" style={{
                gridTemplateColumns: `repeat(${selCols.length},1fr)`
              }}>
                    {selCols.map(c => <span key={c} className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">{c}</span>)}
                  </div>
                  {visibleRows.map((row, i) => <div key={i} className="grid px-5 py-3.5 border-b border-[#f8fafc] hover:bg-[#fafbff]" style={{
                gridTemplateColumns: `repeat(${selCols.length},1fr)`
              }}>
                      {row.map((cell, j) => <span key={j} className="text-[12px] text-[#374151] truncate">{cell}</span>)}
                    </div>)}
                  {visibleRows.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No matching records.</p>}
                  <div className="px-5 py-3 text-[11px] text-[#94a3b8]">
                    Showing {visibleRows.length} of {visibleRows.length} results
                  </div>
                </div>
              </div> : <div className="p-5">
                <MiniBarChart cols={selCols} rows={rows} />
              </div>}
          </div>
        </div>
      </div>
    </div>;
}
export { BuilderView };
