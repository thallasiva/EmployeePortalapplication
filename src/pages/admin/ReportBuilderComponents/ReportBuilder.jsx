import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, BarChart2, PieChart, Table2 } from "lucide-react";
import { reportsApi } from "../../../api/settings.api";
import { BRAND } from "./shared";
import { BuilderView } from "./BuilderView";
function ReportBuilder() {
  const [reports, setReports] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    reportsApi.list().then(data => {
      if (Array.isArray(data)) setReports(data.map(report => ({
        ...report,
        updated: report.updated_at || report.updated
      })));
    }).catch(() => setToast("Unable to load saved reports."));
  }, []);
  const handleSave = async data => {
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
    setToast("Report saved!");
    setTimeout(() => setToast(""), 3000);
  };
  if (editing !== null) return <div>
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
      <BuilderView report={editing} onBack={() => setEditing(null)} onSave={handleSave} />
    </div>;
  return <div className="min-h-screen  ">
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center">
            <BarChart2 size={18} color={BRAND} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#e87500]">Report Builder</h1>
            <p className="text-[13px] text-[#94a3b8]">Build custom reports with filters, columns and chart formats</p>
          </div>
        </div>
        <button onClick={() => setEditing({
        name: "New Report"
      })} className="flex items-center gap-2 h-[38px] px-5 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">
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
          {reports.map(r => <div key={r.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#f8fafc] items-center hover:bg-[#fafbff]">
              <span className="col-span-4 text-[13px] font-semibold text-[#1e293b]">{r.name}</span>
              <span className="col-span-3"><span className="px-2.5 py-1 bg-[#f1f5f9] text-[#64748b] rounded-full text-[11px] font-semibold">{r.module}</span></span>
              <span className="col-span-2 flex items-center gap-1.5 text-[12px] text-[#64748b]">
                {r.format === "table" ? <Table2 size={12} /> : r.format === "bar" ? <BarChart2 size={12} /> : <PieChart size={12} />}
                {r.format === "table" ? "Table" : r.format === "bar" ? "Bar Chart" : "Pie Chart"}
              </span>
              <span className="col-span-2 text-[12px] text-[#94a3b8]">{r.updated}</span>
              <div className="col-span-1 flex justify-end gap-1">
                <button onClick={() => setEditing(r)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#fff8f0] text-[#94a3b8] hover:text-[#e87500]"><Edit2 size={12} /></button>
                <button onClick={async () => {
              try {
                await reportsApi.delete(r.id);
                setReports(p => p.filter(x => x.id !== r.id));
              } catch {
                setToast("Unable to delete report.");
                setTimeout(() => setToast(""), 3000);
              }
            }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-[#94a3b8] hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
}
export { ReportBuilder };
