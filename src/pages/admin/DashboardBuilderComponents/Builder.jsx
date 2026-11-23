import React, { useState } from "react";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { WIDGET_CATALOG } from "./WIDGET_CATALOG";
import { SOURCES, DASHBOARD_ROLES, isPublished, mkWidget } from "./shared";
import { WidgetCard } from "./WidgetCard";
/* ── Builder view ── */
function Builder({
  dash,
  onBack,
  onSave
}) {
  const [widgets, setWidgets] = useState(dash.widgets || []);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState(dash.name || "My Dashboard");
  const [roleName, setRoleName] = useState(dash.roleName || dash.role_name || "Admin");
  const [active, setActive] = useState(isPublished(dash.is_active ?? dash.active));
  const addWidget = type => {
    const w = mkWidget(type);
    setWidgets(p => [...p, w]);
    setSelected(w.id);
  };
  const delWidget = id => {
    setWidgets(p => p.filter(w => w.id !== id));
    setSelected(null);
  };
  const selWidget = widgets.find(w => w.id === selected);
  const updateSelected = patch => setWidgets(p => p.map(w => w.id === selected ? {
    ...w,
    ...patch
  } : w));
  return <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-[#e2e8f0] flex-wrap">
        <button onClick={onBack} className="text-[#94a3b8] hover:text-[#e87500] text-[12px] font-semibold inline-flex items-center gap-1"><ArrowLeft size={12} /> Dashboards</button>
        <div className="w-px h-5 bg-[#e2e8f0]" />
        <input value={name} onChange={e => setName(e.target.value)} className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] font-bold outline-none focus:border-[#e87500] w-56" />
        <select value={roleName} onChange={e => setRoleName(e.target.value)} className="h-[34px] border border-[#e2e8f0] rounded-lg px-3 text-[12px]">
          {DASHBOARD_ROLES.map(role => <option key={role}>{role}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          Publish to role
        </label>
        <div className="ml-auto flex gap-2">
          <button onClick={() => onSave({
          ...dash,
          name,
          roleName,
          is_active: active,
          widgets
        })} className="flex items-center gap-1.5 h-[34px] px-4 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[12px] font-bold">
            <Save size={13} /> Save
          </button>
        </div>
      </div>
      <div className="flex flex-1">
        {/* Widget palette */}
        <div className="w-52 bg-white border-r border-[#e2e8f0] overflow-y-auto shrink-0">
          <p className="px-4 pt-4 pb-2 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Add Widgets</p>
          <div className="px-3 pb-4 space-y-1">
            {WIDGET_CATALOG.map(w => <button key={w.type} onClick={() => addWidget(w.type)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#fff8f0] hover:text-[#e87500] text-left transition-colors group">
                <span className="text-[#94a3b8] group-hover:text-[#e87500]">{w.icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-[#374151] group-hover:text-[#e87500]">{w.label}</p>
                  <p className="text-[10px] text-[#94a3b8]">{w.desc}</p>
                </div>
              </button>)}
          </div>
        </div>
        {/* Canvas */}
        <div className="flex-1 bg-[#f8fafc] p-5 overflow-y-auto">
          <div className="grid grid-cols-4 gap-4 auto-rows-[120px]">
            {widgets.map(w => <WidgetCard key={w.id} widget={w} selected={selected} onSelect={setSelected} onDelete={delWidget} />)}
            <button onClick={() => addWidget("kpi")} className="col-span-1 min-h-[120px] border-2 border-dashed border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#e87500] hover:bg-[#fff8f0] transition-all text-[#94a3b8] hover:text-[#e87500]">
              <Plus size={20} />
              <span className="text-[11px] font-semibold">Add Widget</span>
            </button>
          </div>
        </div>
        {/* Properties panel */}
        <div className="w-56 bg-white border-l border-[#e2e8f0] shrink-0 p-4">
          <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-3">Properties</p>
          {selWidget ? <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Widget Label</label>
                <input value={selWidget.label} onChange={e => updateSelected({
              label: e.target.value
            })} className="w-full h-[32px] border border-[#e2e8f0] rounded-lg px-2 text-[12px] outline-none focus:border-[#e87500]" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Data Source</label>
                <select value={selWidget.source} onChange={e => updateSelected({
              source: e.target.value
            })} className="w-full h-[32px] border border-[#e2e8f0] rounded-lg px-2 text-[12px] outline-none focus:border-[#e87500]">
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Accent Color</label>
                <div className="flex gap-2 flex-wrap">
                  {["#e87500", "#e87500", "#10b981", "#ef4444", "#e87500", "#8b5cf6"].map(c => <button key={c} onClick={() => updateSelected({
                color: c
              })} className={`w-6 h-6 rounded-full border-2 transition-all ${selWidget.color === c ? "border-[#1e293b] scale-110" : "border-transparent"}`} style={{
                background: c
              }} />)}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] mb-1">Width</label>
                <div className="flex gap-1">
                  {[{
                v: "col-span-1",
                l: "Half"
              }, {
                v: "col-span-2",
                l: "Full"
              }].map(o => <button key={o.v} onClick={() => updateSelected({
                span: o.v
              })} className={`flex-1 h-[28px] rounded text-[11px] font-semibold border transition-all ${selWidget.span === o.v ? "bg-[#e87500] text-white border-[#e87500]" : "border-[#e2e8f0] text-[#64748b]"}`}>
                      {o.l}
                    </button>)}
                </div>
              </div>
              <button onClick={() => delWidget(selWidget.id)} className="w-full h-[30px] text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                Remove Widget
              </button>
            </div> : <p className="text-[12px] text-[#94a3b8] text-center py-8">Click a widget to edit it</p>}
        </div>
      </div>
    </div>;
}
export { Builder };
