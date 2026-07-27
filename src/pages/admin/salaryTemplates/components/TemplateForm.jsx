import React, { useState } from "react";
import { X } from "lucide-react";
import { BLANK } from "../constants";
import Toggle from "./Toggle";
import NumField from "./NumField";

const TemplateForm = React.memo(function TemplateForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || BLANK);
  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
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
          {}
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

          {}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Percentage Components</p>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Basic %" name="basic_pct" value={form.basic_pct} onChange={handle} suffix="% of CTC" />
              <NumField label="HRA %" name="hra_pct" value={form.hra_pct} onChange={handle} suffix="% of Basic" />
              <NumField label="Variable %" name="variable_pct" value={form.variable_pct} onChange={handle} suffix="% of CTC" />
            </div>
          </div>

          {}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fixed Allowances</p>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Telephone Allowance (monthly ₹)" name="telephone_monthly" value={form.telephone_monthly} onChange={handle} suffix="₹/mo" />
              <NumField label="Leave Travel Allowance (annual ₹)" name="lta_annual" value={form.lta_annual} onChange={handle} suffix="₹/yr" />
            </div>
          </div>

          {}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Other Costs (Annual ₹)</p>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Insurance Cost" name="insurance_cost" value={form.insurance_cost} onChange={handle} />
              <NumField label="Other Allowances" name="other_allowances" value={form.other_allowances} onChange={handle} />
              <NumField label="Professional Tax" name="professional_tax" value={form.professional_tax} onChange={handle} />
            </div>
          </div>

          {}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applicability</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={form.pf_applicable} onChange={(v) => setForm((f) => ({ ...f, pf_applicable: v }))} label="PF Applicable" />
              <Toggle value={form.pf_cap} onChange={(v) => setForm((f) => ({ ...f, pf_cap: v }))} label="PF Cap @ ₹15k" />
              <Toggle value={form.gratuity_applicable} onChange={(v) => setForm((f) => ({ ...f, gratuity_applicable: v }))} label="Gratuity" />
              <Toggle value={form.bonus_applicable} onChange={(v) => setForm((f) => ({ ...f, bonus_applicable: v }))} label="Statutory Bonus" />
              <Toggle value={form.is_default} onChange={(v) => setForm((f) => ({ ...f, is_default: v }))} label="Set as Default" />
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
});

export default TemplateForm;
