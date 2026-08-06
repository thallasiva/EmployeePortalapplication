import React, { useState, useEffect } from "react";
import
  {
    Plus, Save, Trash2, Eye, Edit2, LayoutDashboard, BarChart2, PieChart,
    TrendingUp, Users, Clock, Calendar, FileText, X, Check, Maximize2, GripVertical
  } from "lucide-react";
import { dashboardsApi } from "../../api/settings.api";

const BRAND = "#f18200";

const WIDGET_CATALOG = [
  { type: "kpi", label: "KPI Card", icon: <TrendingUp size={16} />, desc: "Single metric with trend", w: 1, h: 1 },
  { type: "bar", label: "Bar Chart", icon: <BarChart2 size={16} />, desc: "Compare categories", w: 2, h: 2 },
  { type: "pie", label: "Pie / Donut Chart", icon: <PieChart size={16} />, desc: "Proportion breakdown", w: 1, h: 2 },
  { type: "line", label: "Line Chart", icon: <TrendingUp size={16} />, desc: "Trend over time", w: 2, h: 2 },
  { type: "table", label: "Data Table", icon: <FileText size={16} />, desc: "Tabular data view", w: 2, h: 2 },
  { type: "headcount", label: "Headcount", icon: <Users size={16} />, desc: "Employee count by dept", w: 1, h: 1 },
  { type: "attendance", label: "Attendance %", icon: <Clock size={16} />, desc: "Today's attendance rate", w: 1, h: 1 },
  { type: "calendar", label: "Event Calendar", icon: <Calendar size={16} />, desc: "Upcoming events", w: 2, h: 2 },
];

const SOURCES = ["Employees", "Attendance", "Leave", "Payroll", "Recruitment", "Performance", "Helpdesk"];

const PRESETS = [
  { id: 1, name: "HR Overview Dashboard", widgets: 6, updated: "01 Aug 2026", active: true },
  { id: 2, name: "Payroll Summary", widgets: 4, updated: "28 Jul 2026", active: false },
  { id: 3, name: "Recruitment Pipeline", widgets: 5, updated: "25 Jul 2026", active: false },
];

let _wid = 100;
const mkWidget = (type) =>
{
  const cat = WIDGET_CATALOG.find(w => w.type === type) || WIDGET_CATALOG[0];
  return { id: _wid++, type, label: cat.label, source: SOURCES[0], color: BRAND, span: cat.w === 2 ? "col-span-2" : "col-span-1", rows: cat.h === 2 ? "row-span-2" : "row-span-1" };
};

/* ── Widget visual preview ── */
function WidgetCard({ widget, onSelect, selected, onDelete })
{
  const isDouble = widget.span === "col-span-2";

  const inner = () =>
  {
    switch (widget.type)
    {
      case "kpi": case "headcount": case "attendance":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[28px] font-extrabold" style={{ color: widget.color || BRAND }}>
              {widget.type === "attendance" ? "92%" : widget.type === "headcount" ? "248" : "1,284"}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1 font-medium">{widget.label}</p>
            <p className="text-[10px] text-emerald-500 mt-0.5">↑ 4.2% vs last month</p>
          </div>
        );
      case "bar":
        return (
          <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="flex-1 flex items-end gap-1.5 pb-1">
              {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: widget.color || BRAND, opacity: 0.7 + i * 0.04 }} />
              ))}
            </div>
          </div>
        );
      case "pie":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-20 h-20 rounded-full border-8 border-[#f18200]" style={{ borderRightColor: "#6366f1", borderBottomColor: "#10b981" }} />
            <p className="text-[11px] text-[#94a3b8] font-medium">{widget.label}</p>
          </div>
        );
      case "line":
        return (
          <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <svg className="flex-1 w-full" viewBox="0 0 200 80" preserveAspectRatio="none">
              <polyline points="0,60 30,45 60,50 90,30 120,40 150,20 180,30 200,25"
                fill="none" stroke={widget.color || BRAND} strokeWidth="2" />
              <polyline points="0,60 30,45 60,50 90,30 120,40 150,20 180,30 200,25 200,80 0,80"
                fill={widget.color || BRAND} fillOpacity="0.08" />
            </svg>
          </div>
        );
      case "table":
        return (
          <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="flex-1 space-y-1 overflow-hidden">
              {["Engineering", "Marketing", "HR", "Finance"].map(d => (
                <div key={d} className="flex justify-between text-[11px]">
                  <span className="text-[#374151]">{d}</span>
                  <span className="font-bold text-[#1e293b]">{Math.floor(Math.random() * 50 + 10)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "calendar":
        return (
          <div className="flex flex-col h-full">
            <p className="text-[11px] font-semibold text-[#64748b] mb-2">{widget.label}</p>
            <div className="space-y-1.5 flex-1 overflow-hidden">
              {[["Team Meeting", "09:00", "#f18200"], ["Payroll Run", "14:00", "#6366f1"], ["Onboarding", "10:30", "#10b981"]].map(([e, t, c]) => (
                <div key={e} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: c + "15" }}>
                  <div className="w-1 h-full min-h-[20px] rounded-full" style={{ background: c }} />
                  <div><p className="text-[10px] font-semibold" style={{ color: c }}>{e}</p><p className="text-[9px] text-[#94a3b8]">{t}</p></div>
                </div>
              ))}
            </div>
          </div>
        );
      default: return <p className="text-[12px] text-[#94a3b8]">{widget.label}</p>;
    }
  };

  return (
    <div onClick={() => onSelect(widget.id)}
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all bg-white ${widget.span} ${widget.rows} min-h-[120px] flex flex-col ${selected === widget.id ? "border-[#f18200] shadow-lg shadow-[#f18200]/10" : "border-[#e2e8f0] hover:border-[#f18200]/40"}`}>
      {inner()}
      {selected === widget.id && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={e => { e.stopPropagation(); onDelete(widget.id) }}
            className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600">
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Builder view ── */
function Builder({ dash, onBack, onSave })
{
  const [widgets, setWidgets] = useState(dash.widgets || []);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState(dash.name || "My Dashboard");

  const addWidget = (type) =>
  {
    const w = mkWidget(type);
    setWidgets(p => [...p, w]);
    setSelected(w.id);
  };

  const delWidget = (id) => { setWidgets(p => p.filter(w => w.id !== id)); setSelected(null); };

  const selWidget = widgets.find(w => w.id === selected);
  const updateSelected = (patch) => setWidgets(p => p.map(w => w.id === selected ? { ...w, ...patch } : w));

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#f18200] text-[12px] font-semibold">← Dashboards</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={name} onChange={e => setName(e.target.value)}
          className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#f18200] w-56" />
        <div className="ml-auto flex gap-2">
          <button onClick={() => onSave({ ...dash, name, widgetCount: widgets.length, updated: "Now" })}
            className="flex items-center gap-1.5 h-[34px] px-4 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold">
            <Save size={13} /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Widget palette */}
        <div className="w-52 bg-white border-r border-[#e2e8f0] overflow-y-auto shrink-0">
          <p className="px-4 pt-4 pb-2 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Add Widgets</p>
          <div className="px-3 pb-4 space-y-1">
            {WIDGET_CATALOG.map(w => (
              <button key={w.type} onClick={() => addWidget(w.type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#fff8f0] hover:text-[#f18200] text-left transition-colors group">
                <span className="text-[#94a3b8] group-hover:text-[#f18200]">{w.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-[#374151] group-hover:text-[#f18200]">{w.label}</p>
                  <p className="text-[10px] text-[#94a3b8]">{w.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#f8fafc] p-5 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4 auto-rows-[120px]">
            {widgets.map(w => (
              <WidgetCard key={w.id} widget={w} selected={selected} onSelect={setSelected} onDelete={delWidget} />
            ))}
            <button onClick={() => addWidget("kpi")}
              className="col-span-1 min-h-[120px] border-2 border-dashed border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#f18200] hover:bg-[#fff8f0] transition-all text-[#94a3b8] hover:text-[#f18200]">
              <Plus size={20} />
              <span className="text-[11px] font-semibold">Add Widget</span>
            </button>
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-56 bg-white border-l border-[#e2e8f0] shrink-0 p-4">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Properties</p>
          {selWidget ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Widget Label</label>
                <input value={selWidget.label} onChange={e => updateSelected({ label: e.target.value })}
                  className="w-full h-[32px] border border-[#e2e8f0] rounded-lg px-2 text-[12px] outline-none focus:border-[#f18200]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Data Source</label>
                <select value={selWidget.source} onChange={e => updateSelected({ source: e.target.value })}
                  className="w-full h-[32px] border border-[#e2e8f0] rounded-lg px-2 text-[12px] outline-none focus:border-[#f18200]">
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {["#f18200", "#6366f1", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"].map(c => (
                    <button key={c} onClick={() => updateSelected({ color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${selWidget.color === c ? "border-[#1e293b] scale-110" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Width</label>
                <div className="flex gap-1">
                  {[{ v: "col-span-1", l: "Half" }, { v: "col-span-2", l: "Full" }].map(o => (
                    <button key={o.v} onClick={() => updateSelected({ span: o.v })}
                      className={`flex-1 h-[28px] rounded text-[11px] font-semibold border transition-all ${selWidget.span === o.v ? "bg-[#f18200] text-white border-[#f18200]" : "border-[#e2e8f0] text-[#64748b]"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => delWidget(selWidget.id)}
                className="w-full h-[30px] text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                Remove Widget
              </button>
            </div>
          ) : <p className="text-[12px] text-[#94a3b8] text-center py-8">Click a widget to edit it</p>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardBuilder()
{
  const [dashboards, setDashboards] = useState(PRESETS);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    dashboardsApi.list().then(data => {
      if (Array.isArray(data) && data.length > 0) setDashboards(data);
    }).catch(() => {});
  }, []);

  const handleSave = (data) =>
  {
    setDashboards(p => data.id && p.find(d => d.id === data.id)
      ? p.map(d => d.id === data.id ? { ...d, ...data } : d)
      : [...p, { ...data, id: Date.now(), widgets: 0, updated: "Now" }]
    );
    setEditing(null);
    setToast("Dashboard saved!"); setTimeout(() => setToast(""), 3000);
  };

  if (editing !== null) return <div className="min-h-screen bg-[#f0f4f8]"><Builder dash={editing} onBack={() => setEditing(null)} onSave={handleSave} /></div>;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {toast && <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold flex items-center gap-2"><Check size={15} />{toast}</div>}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center">
            <LayoutDashboard size={18} color={BRAND} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1e293b]">Dashboard Builder</h1>
            <p className="text-[13px] text-[#94a3b8]">Create custom dashboards with drag-and-drop widgets</p>
          </div>
        </div>
        <button onClick={() => setEditing({ name: "New Dashboard", widgets: [] })}
          className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold">
          <Plus size={15} /> New Dashboard
        </button>
      </div>

      <div className="px-6 pb-10 grid grid-cols-3 gap-5">
        {dashboards.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Mini preview */}
            <div className="h-32 bg-gradient-to-br from-[#fff8f0] to-[#fef9f4] p-3 grid grid-cols-3 gap-1.5">
              {[...Array(Math.min(d.widgets || 3, 6))].map((_, i) => (
                <div key={i} className={`rounded-lg ${i === 0 || i === 3 ? "bg-[#f18200]/20" : i === 1 ? "bg-[#6366f1]/20" : "bg-[#10b981]/20"} ${i === 1 || i === 4 ? "col-span-2" : ""}`} />
              ))}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-bold text-[#1e293b]">{d.name}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{d.widgets} widgets · Updated {d.updated}</p>
                </div>
                {d.active && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Active</span>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditing(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-[34px] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#64748b] hover:border-[#f18200] hover:text-[#f18200] transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={async () => { try { await dashboardsApi.delete(d.id); } catch {} setDashboards(p => p.filter(x => x.id !== d.id)); }}
                  className="w-[34px] h-[34px] flex items-center justify-center border border-[#e2e8f0] rounded-lg text-[#94a3b8] hover:border-red-200 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {/* Add card */}
        <button onClick={() => setEditing({ name: "New Dashboard", widgets: [] })}
          className="rounded-2xl border-2 border-dashed border-[#e2e8f0] h-[240px] flex flex-col items-center justify-center gap-3 hover:border-[#f18200] hover:bg-[#fff8f0] transition-all text-[#94a3b8] hover:text-[#f18200]">
          <Plus size={24} />
          <span className="text-[13px] font-semibold">Create Dashboard</span>
        </button>
      </div>
    </div>
  );
}
