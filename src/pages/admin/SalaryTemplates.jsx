import React, { useEffect, useState, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { Plus, Pencil, Trash2, Star, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import {
  listSalaryTemplates, createSalaryTemplate,
  updateSalaryTemplate, deleteSalaryTemplate,
} from "../../api/salaryTemplate.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

/* ── helpers ── */
const pct   = (v) => `${Number(v).toFixed(2)}%`;
const money = (v) => v > 0 ? `₹${Number(v).toLocaleString("en-IN")}` : "—";
const yn    = (v) => v ? "Yes" : "No";

const BLANK = {
  template_name: "", description: "",
  basic_pct: "50", hra_pct: "40", variable_pct: "0",
  telephone_monthly: "1500", lta_annual: "39996",
  pf_applicable: true, pf_cap: true,
  gratuity_applicable: false, bonus_applicable: true,
  insurance_cost: "0", other_allowances: "0", professional_tax: "0",
  is_default: false,
};

/* ── Toggle pill ── */
function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        value
          ? "bg-green-50 border-green-300 text-green-700"
          : "bg-gray-50 border-gray-200 text-gray-500"
      }`}
    >
      {value ? <Check size={12} /> : <X size={12} />}
      {label}
    </button>
  );
}

/* ── Number field ── */
function NumField({ label, name, value, onChange, suffix = "" }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <input
          type="number" name={name} value={value} onChange={onChange} min={0}
          className="flex-1 px-3 py-2 text-sm outline-none bg-white"
        />
        {suffix && (
          <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 h-full flex items-center">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Template Card ── */
function TemplateCard({ t, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl border ${t.is_default ? "border-indigo-300 shadow-sm" : "border-gray-200"} overflow-hidden`}>
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{t.template_name}</h3>
            {t.is_default ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Star size={9} fill="currentColor" /> Default
              </span>
            ) : null}
          </div>
          {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">Basic {pct(t.basic_pct)}</span>
            <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">HRA {pct(t.hra_pct)}</span>
            {Number(t.variable_pct) > 0 && (
              <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">Variable {pct(t.variable_pct)}</span>
            )}
            <span className="text-[11px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">PF {yn(t.pf_applicable)}</span>
            <span className="text-[11px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">Bonus {yn(t.bonus_applicable)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          <table className="w-full text-xs text-gray-600">
            <tbody className="divide-y divide-gray-50">
              {[
                ["Basic %",               pct(t.basic_pct)],
                ["HRA %",                 pct(t.hra_pct)],
                ["Variable %",            pct(t.variable_pct)],
                ["Telephone (monthly)",   money(t.telephone_monthly)],
                ["LTA (annual)",          money(t.lta_annual)],
                ["PF Applicable",         yn(t.pf_applicable)],
                ["PF Cap @ ₹15k Basic",  yn(t.pf_cap)],
                ["Gratuity",              yn(t.gratuity_applicable)],
                ["Statutory Bonus",       yn(t.bonus_applicable)],
                ["Insurance (annual)",    money(t.insurance_cost)],
                ["Other Allowances",      money(t.other_allowances)],
                ["Professional Tax",      money(t.professional_tax)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-1.5 text-gray-400 w-40">{k}</td>
                  <td className="py-1.5 font-medium text-gray-700 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Form Modal ── */
function TemplateForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || BLANK);
  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {initial ? "Edit Template" : "Create Salary Template"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Template Name *</label>
              <input required name="template_name" value={form.template_name} onChange={handle}
                placeholder="e.g. Standard, Senior, Contract"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input name="description" value={form.description} onChange={handle}
                placeholder="Brief description of this template"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Percentage components */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Percentage Components</p>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Basic %" name="basic_pct" value={form.basic_pct} onChange={handle} suffix="% of CTC" />
              <NumField label="HRA %" name="hra_pct" value={form.hra_pct} onChange={handle} suffix="% of Basic" />
              <NumField label="Variable %" name="variable_pct" value={form.variable_pct} onChange={handle} suffix="% of CTC" />
            </div>
          </div>

          {/* Fixed allowances */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fixed Allowances</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Telephone Allowance (monthly ₹)" name="telephone_monthly" value={form.telephone_monthly} onChange={handle} suffix="₹/mo" />
              <NumField label="Leave Travel Allowance (annual ₹)" name="lta_annual" value={form.lta_annual} onChange={handle} suffix="₹/yr" />
            </div>
          </div>

          {/* Other costs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Other Costs (Annual ₹)</p>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Insurance Cost" name="insurance_cost" value={form.insurance_cost} onChange={handle} />
              <NumField label="Other Allowances" name="other_allowances" value={form.other_allowances} onChange={handle} />
              <NumField label="Professional Tax" name="professional_tax" value={form.professional_tax} onChange={handle} />
            </div>
          </div>

          {/* Toggles */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applicability</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={form.pf_applicable}        onChange={v => setForm(f => ({...f, pf_applicable: v}))}        label="PF Applicable" />
              <Toggle value={form.pf_cap}               onChange={v => setForm(f => ({...f, pf_cap: v}))}               label="PF Cap @ ₹15k" />
              <Toggle value={form.gratuity_applicable}  onChange={v => setForm(f => ({...f, gratuity_applicable: v}))}  label="Gratuity" />
              <Toggle value={form.bonus_applicable}     onChange={v => setForm(f => ({...f, bonus_applicable: v}))}     label="Statutory Bonus" />
              <Toggle value={form.is_default}           onChange={v => setForm(f => ({...f, is_default: v}))}           label="Set as Default" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
              {saving ? "Saving…" : initial ? "Update Template" : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function SalaryTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTemplates(await listSalaryTemplates()); }
    catch { errorToast("Failed to load templates"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit   = (t)  => { setEditing(t);    setFormOpen(true); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateSalaryTemplate(editing.template_id, data);
        successToast("Template updated");
      } else {
        await createSalaryTemplate(data);
        successToast("Template created");
      }
      setFormOpen(false); setEditing(null);
      load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to save template"));
    } finally { setSaving(false); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.template_name}"?`)) return;
    try {
      await deleteSalaryTemplate(t.template_id);
      successToast("Template deleted");
      load();
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to delete"));
    }
  };

  const defaultTpl  = templates.find(t => t.is_default);
  const otherTpls   = templates.filter(t => !t.is_default);
  const { paged: pagedTpls, page: tplPage, setPage: setTplPage, totalPages: tplTotalPages, from: tplFrom, to: tplTo, total: tplTotal, pageSize: tplPageSize, setPageSize: setTplPageSize } = usePagination(otherTpls);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Templates</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure reusable salary structures for offer creation
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#16304f] transition-colors">
          <Plus size={15} /> New Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm mb-3">No salary templates yet</p>
          <button onClick={openCreate}
            className="text-indigo-600 text-sm font-medium hover:underline">
            Create your first template
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default template section */}
          {defaultTpl && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Default Template</p>
              <TemplateCard t={defaultTpl} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          )}

          {/* Other templates */}
          {otherTpls.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                All Templates ({otherTpls.length})
              </p>
              <div className="grid gap-3">
                {pagedTpls.map(t => (
                  <TemplateCard key={t.template_id} t={t} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
              <Pagination page={tplPage} setPage={setTplPage} totalPages={tplTotalPages} from={tplFrom} to={tplTo} total={tplTotal} pageSize={tplPageSize} setPageSize={setTplPageSize} />
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <TemplateForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
