import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, LayoutDashboard, Check } from "lucide-react";
import { dashboardsApi } from "../../../api/settings.api";
import { BRAND, isPublished } from "./shared";
import { Builder } from "./Builder";
function DashboardBuilder() {
  const [dashboards, setDashboards] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    dashboardsApi.list().then(data => {
      if (Array.isArray(data)) setDashboards(data.map(dashboard => ({
        ...dashboard,
        roleName: dashboard.role_name || dashboard.roleName || "Admin",
        widgets: Number(dashboard.widget_count || dashboard.widgets || 0),
        active: isPublished(dashboard.is_active ?? dashboard.active),
        updated: dashboard.updated_at || dashboard.updated || "—"
      })));
    }).catch(() => setToast("Unable to load dashboards from the server.")).finally(() => setLoading(false));
  }, []);
  const handleSave = async data => {
    try {
      const saved = data.id ? await dashboardsApi.update(data.id, data) : await dashboardsApi.create(data);
      const normalized = {
        ...saved,
        roleName: saved.role_name || saved.roleName || data.roleName,
        widgets: Array.isArray(saved.widgets) ? saved.widgets.length : data.widgets.length,
        active: isPublished(saved.is_active ?? data.is_active),
        updated: saved.updated_at || "Just now"
      };
      setDashboards(previous => {
        const remaining = previous.map(dashboard => data.is_active && dashboard.roleName === normalized.roleName ? {
          ...dashboard,
          active: false
        } : dashboard);
        return data.id ? remaining.map(dashboard => dashboard.id === data.id ? normalized : dashboard) : [normalized, ...remaining];
      });
      setEditing(null);
      setToast("Dashboard saved.");
      setTimeout(() => setToast(""), 3000);
    } catch {
      setToast("Unable to save dashboard. Please try again.");
      setTimeout(() => setToast(""), 3000);
    }
  };
  if (editing !== null) return <div className="min-h-screen  ">
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
      <Builder dash={editing} onBack={() => setEditing(null)} onSave={handleSave} />
    </div>;
  return <div className="min-h-screen  ">
      {toast && <div role="status" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2 text-white ${toast.startsWith("Unable") ? "bg-red-600" : "bg-emerald-600"}`}><Check size={15} />{toast}</div>}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center">
            <LayoutDashboard size={18} color={BRAND} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#e87500]">Dashboard Builder</h1>
            <p className="text-[13px] text-[#94a3b8]">Create custom dashboards with drag-and-drop widgets</p>
          </div>
        </div>
        <button onClick={() => setEditing({
        name: "New Dashboard",
        roleName: "Admin",
        is_active: false,
        widgets: []
      })} className="flex items-center gap-2 h-[38px] px-5 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">
          <Plus size={15} /> New Dashboard
        </button>
      </div>
      <div className="px-6 pb-10 grid grid-cols-3 gap-5">
        {loading && <p className="col-span-3 py-10 text-center text-sm text-slate-400">Loading dashboards…</p>}
        {!loading && dashboards.length === 0 && <p className="col-span-3 py-10 text-center text-sm text-slate-400">No saved dashboards. Create one to configure a role home page.</p>}
        {dashboards.map(d => <div key={d.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Mini preview */}
            <div className="h-32 bg-gradient-to-br from-[#fff8f0] to-[#fef9f4] p-3 grid grid-cols-3 gap-1.5">
              {[...Array(Math.min(d.widgets || 3, 6))].map((_, i) => <div key={i} className={`rounded-lg ${i === 0 || i === 3 ? "bg-[#e87500]/20" : i === 1 ? "bg-[#e87500]/20" : "bg-[#10b981]/20"} ${i === 1 || i === 4 ? "col-span-2" : ""}`} />)}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#e87500]">{d.name}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{d.widgets} widgets · {d.roleName} · Updated {d.updated}</p>
                </div>
                {d.active && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Active</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={async () => {
              try {
                setEditing(await dashboardsApi.get(d.id));
              } catch {
                setToast("Unable to load the selected dashboard.");
              }
            }} className="flex-1 flex items-center justify-center gap-1.5 h-[34px] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#64748b] hover:border-[#e87500] hover:text-[#e87500] transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={async () => {
              try {
                await dashboardsApi.delete(d.id);
                setDashboards(p => p.filter(x => x.id !== d.id));
              } catch {
                setToast("Unable to delete dashboard.");
              }
            }} className="w-[34px] h-[34px] flex items-center justify-center border border-[#e2e8f0] rounded-lg text-[#94a3b8] hover:border-red-200 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>)}
        {/* Add card */}
        <button onClick={() => setEditing({
        name: "New Dashboard",
        roleName: "Admin",
        is_active: false,
        widgets: []
      })} className="rounded-2xl border-2 border-dashed border-[#e2e8f0] h-[240px] flex flex-col items-center justify-center gap-3 hover:border-[#e87500] hover:bg-[#fff8f0] transition-all text-[#94a3b8] hover:text-[#e87500]">
          <Plus size={24} />
          <span className="text-[13px] font-semibold">Create Dashboard</span>
        </button>
      </div>
    </div>;
}
export { DashboardBuilder };
