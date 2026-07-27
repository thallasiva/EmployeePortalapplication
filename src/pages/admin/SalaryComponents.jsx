import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Power, ChevronDown, ChevronUp, X, Search } from "lucide-react";
import {
  listComponents, createComponent, updateComponent, toggleComponent,
} from "../../api/salaryComponent.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

const CATEGORIES = ['Earning', 'Deduction', 'Employer Contribution'];
const CALC_TYPES  = ['Fixed', 'Percentage', 'Formula'];
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'One-Time'];

const CAT_COLOR = {
  'Earning':               'bg-green-50 text-green-700 border-green-200',
  'Deduction':             'bg-red-50 text-red-700 border-red-200',
  'Employer Contribution': 'bg-blue-50 text-blue-700 border-blue-200',
};

const BLANK = {
  component_name: '', component_code: '', category: 'Earning',
  calc_type: 'Fixed', percentage_value: '', percentage_of: '', formula_expr: '',
  frequency: 'Monthly', is_taxable: true, pf_applicable: false, esi_applicable: false,
  gratuity_applicable: false, show_offer_letter: true, show_ctc_breakup: true,
  show_payslip: true, sort_order: '100', description: '',
};

function Toggle({ value, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
        value ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
      }`}>
      {value ? '✓ ' : ''}{label}
    </button>
  );
}

function Field({ label, children, half }) {
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white";

function ComponentForm({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(initial ? {
    ...initial,
    percentage_value: initial.percentage_value ?? '',
    sort_order: initial.sort_order ?? 100,
  } : BLANK);

  const set = (name, val) => setF(p => ({ ...p, [name]: val }));
  const handle = e => set(e.target.name, e.target.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {initial ? 'Edit Component' : 'Add Salary Component'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="px-6 py-5 space-y-5">

          {/* Identity */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Component Name *" half>
              <input required name="component_name" value={f.component_name} onChange={handle} className={inp} placeholder="e.g. House Rent Allowance" />
            </Field>
            <Field label="Code *" half>
              <input required name="component_code" value={f.component_code} onChange={handle} className={inp} placeholder="e.g. HRA" maxLength={30}
                style={{ textTransform: 'uppercase' }}
                onBlur={e => set('component_code', e.target.value.toUpperCase().replace(/\s/g,'_'))} />
            </Field>
            <Field label="Category *" half>
              <select name="category" value={f.category} onChange={handle} className={sel}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Frequency" half>
              <select name="frequency" value={f.frequency} onChange={handle} className={sel}>
                {FREQUENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Calculation */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Calculation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calculation Type" half>
                <select name="calc_type" value={f.calc_type} onChange={handle} className={sel}>
                  {CALC_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              {f.calc_type === 'Percentage' && (
                <>
                  <Field label="Percentage Value (%)" half>
                    <input type="number" name="percentage_value" value={f.percentage_value} onChange={handle} className={inp} placeholder="e.g. 40" step="0.01" />
                  </Field>
                  <Field label="% Of (component code)" half>
                    <input name="percentage_of" value={f.percentage_of} onChange={handle} className={inp} placeholder="e.g. BASIC or CTC_MONTHLY" />
                  </Field>
                </>
              )}
              {f.calc_type === 'Formula' && (
                <Field label="Formula Expression">
                  <input name="formula_expr" value={f.formula_expr} onChange={handle} className={inp}
                    placeholder="e.g. MIN(BASIC*0.12, 1800)  or  GROSS - BASIC - HRA" />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Supported: component codes, MIN(), MAX(), ROUND(), IF(cond,a,b), +−×÷
                  </p>
                </Field>
              )}
            </div>
          </div>

          {/* Statutory flags */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Statutory Applicability</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={!!f.is_taxable}           onChange={v => set('is_taxable', v)}           label="Taxable" />
              <Toggle value={!!f.pf_applicable}        onChange={v => set('pf_applicable', v)}        label="PF Applicable" />
              <Toggle value={!!f.esi_applicable}       onChange={v => set('esi_applicable', v)}       label="ESI Applicable" />
              <Toggle value={!!f.gratuity_applicable}  onChange={v => set('gratuity_applicable', v)}  label="Gratuity Applicable" />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Visibility</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={!!f.show_offer_letter} onChange={v => set('show_offer_letter', v)} label="Offer Letter" />
              <Toggle value={!!f.show_ctc_breakup}  onChange={v => set('show_ctc_breakup', v)}  label="CTC Breakup" />
              <Toggle value={!!f.show_payslip}       onChange={v => set('show_payslip', v)}       label="Payslip" />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sort Order" half>
              <input type="number" name="sort_order" value={f.sort_order} onChange={handle} className={inp} />
            </Field>
            <Field label="Description" half>
              <input name="description" value={f.description} onChange={handle} className={inp} placeholder="Brief description" />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
              {saving ? 'Saving…' : initial ? 'Update' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ComponentRow({ c, onEdit, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className={`border-t border-gray-100 ${!c.is_active ? 'opacity-50' : ''}`}>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-800">{c.component_name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{c.component_code}</div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${CAT_COLOR[c.category] || ''}`}>
            {c.category}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {c.calc_type === 'Percentage'
            ? `${c.percentage_value}% of ${c.percentage_of}`
            : c.calc_type === 'Formula'
              ? <span className="font-mono text-[11px] text-purple-700">{c.formula_expr}</span>
              : 'Fixed'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{c.frequency}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {c.show_offer_letter ? <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Offer</span> : null}
            {c.show_ctc_breakup  ? <span className="text-[10px] bg-blue-50   text-blue-600   px-1.5 py-0.5 rounded">CTC</span>   : null}
            {c.show_payslip      ? <span className="text-[10px] bg-green-50  text-green-600  px-1.5 py-0.5 rounded">Slip</span>  : null}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Pencil size={13} /></button>
            {!c.is_system && (
              <button onClick={() => onToggle(c)} title={c.is_active ? 'Deactivate' : 'Activate'}
                className={`p-1.5 rounded-lg ${c.is_active ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}>
                <Power size={13} />
              </button>
            )}
            <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={6} className="px-6 py-3">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span>Taxable: <b>{c.is_taxable ? 'Yes' : 'No'}</b></span>
              <span>PF: <b>{c.pf_applicable ? 'Yes' : 'No'}</b></span>
              <span>ESI: <b>{c.esi_applicable ? 'Yes' : 'No'}</b></span>
              <span>Gratuity: <b>{c.gratuity_applicable ? 'Yes' : 'No'}</b></span>
              <span>Sort: <b>{c.sort_order}</b></span>
              {c.description && <span>Note: <i>{c.description}</i></span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SalaryComponentsPage() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setComponents(await listComponents(null)); }
    catch { errorToast('Failed to load components'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = components.filter(c => {
    if (!showInactive && !c.is_active) return false;
    if (catFilter && c.category !== catFilter) return false;
    if (search && !c.component_name.toLowerCase().includes(search.toLowerCase()) &&
        !c.component_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filtered.filter(c => c.category === cat);
    return acc;
  }, {});

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) { await updateComponent(editing.component_id, data); successToast('Component updated'); }
      else          { await createComponent(data);                       successToast('Component added'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { errorToast(getErrorMessage(err, 'Failed to save')); }
    finally { setSaving(false); }
  };

  const handleToggle = async (c) => {
    try {
      await toggleComponent(c.component_id, !c.is_active);
      successToast(c.is_active ? 'Component deactivated' : 'Component activated');
      load();
    } catch (err) { errorToast(getErrorMessage(err, 'Failed')); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Components</h1>
          <p className="text-sm text-gray-400 mt-0.5">{components.filter(c=>c.is_active).length} active components</p>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#16304f]">
          <Plus size={15} /> Add Component
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search components…"
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
        </div>
        <select value={catFilter} onChange={e => setCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => grouped[cat]?.length > 0 && (
            <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 ${
                cat === 'Earning' ? 'bg-green-50' : cat === 'Deduction' ? 'bg-red-50' : 'bg-blue-50'
              }`}>
                <span className={`text-xs font-semibold ${CAT_COLOR[cat].split(' ').slice(1).join(' ')}`}>{cat}</span>
                <span className="text-[11px] text-gray-400">({grouped[cat].length})</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Component</th>
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Category</th>
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Calculation</th>
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Frequency</th>
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Visibility</th>
                    <th className="px-4 py-2 text-[11px] text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[cat].map(c => (
                    <ComponentRow key={c.component_id} c={c}
                      onEdit={c => { setEditing(c); setFormOpen(true); }}
                      onToggle={handleToggle} />
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <ComponentForm initial={editing} onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }} saving={saving} />
      )}
    </div>
  );
}
