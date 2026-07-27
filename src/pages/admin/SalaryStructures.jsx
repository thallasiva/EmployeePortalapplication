import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, GripVertical, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  listStructures, createStructure, updateStructure, getStructure,
  listComponents, removeStructureLine,
} from "../../api/salaryComponent.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white";

const OVERRIDE_TYPES = ['None', 'Fixed', 'Percentage'];

// ── Structure Form Modal ─────────────────────────────────────────────────────
function StructureForm({ initial, onSave, onClose, saving }) {
  const [name, setName]     = useState(initial?.structure_name ?? '');
  const [desc, setDesc]     = useState(initial?.description ?? '');
  const [isDefault, setDef] = useState(!!initial?.is_default);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            {initial ? 'Edit Structure' : 'New Salary Structure'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ structure_name: name, description: desc, is_default: isDefault }); }}
          className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Structure Name *</label>
            <input required value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="e.g. Standard Monthly" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className={inp} placeholder="Brief note" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={e => setDef(e.target.checked)} />
            Set as default structure
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
              {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Line Modal ────────────────────────────────────────────────────────────
function AddLineModal({ structureId, existingIds, allComponents, onAdded, onClose, saving }) {
  const available = allComponents.filter(c => c.is_active && !existingIds.has(c.component_id));
  const [selected, setSelected] = useState('');
  const [overrideType, setOverType] = useState('None');
  const [overrideValue, setOverVal] = useState('');
  const [sortOrder, setSortOrder]   = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Add Component to Structure</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          onAdded({
            component_id: Number(selected),
            override_type: overrideType === 'None' ? null : overrideType,
            override_value: overrideValue || null,
            sort_order: sortOrder || null,
          });
        }} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Component *</label>
            <select required value={selected} onChange={e => setSelected(e.target.value)} className={sel}>
              <option value="">— select —</option>
              {available.map(c => (
                <option key={c.component_id} value={c.component_id}>
                  {c.component_name} ({c.component_code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Override Type</label>
              <select value={overrideType} onChange={e => setOverType(e.target.value)} className={sel}>
                {OVERRIDE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {overrideType !== 'None' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Override Value</label>
                <input type="number" value={overrideValue} onChange={e => setOverVal(e.target.value)} className={inp} step="0.01" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inp} placeholder="Leave blank to use component default" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || !selected} className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Structure Detail (expanded accordion) ────────────────────────────────────
function StructureDetail({ structure, allComponents, onRefresh }) {
  const [detail, setDetail]     = useState(null);
  const [loadingDetail, setLD]  = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [savingLine, setSL]     = useState(false);

  const loadDetail = useCallback(async () => {
    setLD(true);
    try { setDetail(await getStructure(structure.structure_id)); }
    catch { errorToast('Failed to load structure detail'); }
    finally { setLD(false); }
  }, [structure.structure_id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const lines = detail?.lines ?? [];
  const existingIds = new Set(lines.map(l => l.component_id));

  const handleAddLine = async (payload) => {
    setSL(true);
    try {
      await updateStructure(structure.structure_id, {
        structure_name: structure.structure_name,
        description: structure.description,
        is_default: structure.is_default,
        lines: [...lines, payload],
      });
      successToast('Component added');
      setAddOpen(false);
      await loadDetail();
      onRefresh();
    } catch (err) { errorToast(getErrorMessage(err, 'Failed to add')); }
    finally { setSL(false); }
  };

  const handleRemoveLine = async (componentId) => {
    if (!window.confirm('Remove this component from the structure?')) return;
    try {
      await removeStructureLine(structure.structure_id, componentId);
      successToast('Removed');
      await loadDetail();
    } catch (err) { errorToast(getErrorMessage(err, 'Failed')); }
  };

  const CAT_ORDER = ['Earning', 'Deduction', 'Employer Contribution'];
  const grouped = CAT_ORDER.reduce((a, cat) => {
    a[cat] = lines.filter(l => l.category === cat).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    return a;
  }, {});

  const CAT_COLOR = {
    'Earning':               'text-green-700 bg-green-50',
    'Deduction':             'text-red-700 bg-red-50',
    'Employer Contribution': 'text-blue-700 bg-blue-50',
  };

  if (loadingDetail) return <div className="px-5 py-6 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{lines.length} component{lines.length !== 1 ? 's' : ''} in this structure</span>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
          <Plus size={12} /> Add Component
        </button>
      </div>

      {CAT_ORDER.map(cat => grouped[cat]?.length > 0 && (
        <div key={cat} className="mb-4">
          <p className={`text-[11px] font-semibold px-2 py-1 rounded-md inline-block mb-2 ${CAT_COLOR[cat]}`}>{cat}</p>
          <div className="space-y-1">
            {grouped[cat].map(line => (
              <div key={line.component_id} className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-3 py-2">
                <GripVertical size={13} className="text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">{line.component_name}</span>
                  <span className="text-[11px] text-gray-400 font-mono ml-2">{line.component_code}</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  {line.override_type
                    ? <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                        Override: {line.override_type} {line.override_value}
                      </span>
                    : <span className="text-gray-400">Default calc</span>
                  }
                </div>
                {!line.is_system && (
                  <button onClick={() => handleRemoveLine(line.component_id)}
                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {lines.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-400">No components yet. Click "Add Component" to start building.</div>
      )}

      {addOpen && (
        <AddLineModal
          structureId={structure.structure_id}
          existingIds={existingIds}
          allComponents={allComponents}
          onAdded={handleAddLine}
          onClose={() => setAddOpen(false)}
          saving={savingLine}
        />
      )}
    </div>
  );
}

// ── Structure Card ────────────────────────────────────────────────────────────
function StructureCard({ s, allComponents, onEdit, onRefresh, onOpenEditor }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm">{s.structure_name}</span>
            {s.is_default && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-medium">Default</span>
            )}
          </div>
          {s.description && <p className="text-[11px] text-gray-400 mt-0.5">{s.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenEditor(s.structure_id)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 font-medium"
          >
            <ExternalLink size={12} /> Open Editor
          </button>
          <button onClick={() => onEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil size={13} /></button>
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {open && (
        <StructureDetail structure={s} allComponents={allComponents} onRefresh={onRefresh} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SalaryStructuresPage() {
  const navigate = useNavigate();
  const [structures, setStructures]   = useState([]);
  const [allComponents, setAllComp]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([listStructures(), listComponents(null)]);
      setStructures(s);
      setAllComp(c);
    } catch { errorToast('Failed to load structures'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateStructure(editing.structure_id, { ...data, lines: [] });
        successToast('Structure updated');
      } else {
        await createStructure({ ...data, lines: [] });
        successToast('Structure created');
      }
      setFormOpen(false);
      setEditing(null);
      load();
    } catch (err) { errorToast(getErrorMessage(err, 'Failed to save')); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Structures</h1>
          <p className="text-sm text-gray-400 mt-0.5">Named structures with configurable component lines</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/salary-structures/new")}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            <Plus size={15} /> Build New Structure
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50">
            <Plus size={15} /> Quick Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : structures.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No structures yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {structures.map(s => (
            <StructureCard key={s.structure_id} s={s} allComponents={allComponents}
              onEdit={s => { setEditing(s); setFormOpen(true); }}
              onRefresh={load}
              onOpenEditor={(sid) => navigate(`/dashboard/salary-structures/${sid}`)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <StructureForm initial={editing} onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }} saving={saving} />
      )}
    </div>
  );
}
