import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import { CATEGORIES, CALC_TYPES, FREQUENCIES, BLANK, inp, sel } from "../constants";
import Toggle from "./Toggle";
import Field from "./Field";

const ComponentForm = React.memo(function ComponentForm({ initial, onSave, onClose, saving }) {
  const [f, setF] = useState(
    initial
      ? {
          ...initial,
          percentage_value: initial.percentage_value ?? "",
          sort_order: initial.sort_order ?? 100,
        }
      : BLANK
  );

  const set = useCallback((name, val) => setF((p) => ({ ...p, [name]: val })), []);
  const handle = useCallback((e) => set(e.target.name, e.target.value), [set]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {initial ? "Edit Component" : "Add Salary Component"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(f);
          }}
          className="px-6 py-5 space-y-5"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Component Name *" half>
              <input required name="component_name" value={f.component_name} onChange={handle} className={inp} placeholder="e.g. House Rent Allowance" />
            </Field>
            <Field label="Code *" half>
              <input
                required name="component_code" value={f.component_code} onChange={handle}
                className={inp} placeholder="e.g. HRA" maxLength={30}
                style={{ textTransform: "uppercase" }}
                onBlur={(e) => set("component_code", e.target.value.toUpperCase().replace(/\s/g, "_"))}
              />
            </Field>
            <Field label="Category *" half>
              <select name="category" value={f.category} onChange={handle} className={sel}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Frequency" half>
              <select name="frequency" value={f.frequency} onChange={handle} className={sel}>
                {FREQUENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Calculation</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calculation Type" half>
                <select name="calc_type" value={f.calc_type} onChange={handle} className={sel}>
                  {CALC_TYPES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              {f.calc_type === "Percentage" && (
                <>
                  <Field label="Percentage Value (%)" half>
                    <input type="number" name="percentage_value" value={f.percentage_value} onChange={handle} className={inp} placeholder="e.g. 40" step="0.01" />
                  </Field>
                  <Field label="% Of (component code)" half>
                    <input name="percentage_of" value={f.percentage_of} onChange={handle} className={inp} placeholder="e.g. BASIC or CTC_MONTHLY" />
                  </Field>
                </>
              )}
              {f.calc_type === "Formula" && (
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

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Statutory Applicability</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={!!f.is_taxable} onChange={(v) => set("is_taxable", v)} label="Taxable" />
              <Toggle value={!!f.pf_applicable} onChange={(v) => set("pf_applicable", v)} label="PF Applicable" />
              <Toggle value={!!f.esi_applicable} onChange={(v) => set("esi_applicable", v)} label="ESI Applicable" />
              <Toggle value={!!f.gratuity_applicable} onChange={(v) => set("gratuity_applicable", v)} label="Gratuity Applicable" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Visibility</p>
            <div className="flex flex-wrap gap-2">
              <Toggle value={!!f.show_offer_letter} onChange={(v) => set("show_offer_letter", v)} label="Offer Letter" />
              <Toggle value={!!f.show_ctc_breakup} onChange={(v) => set("show_ctc_breakup", v)} label="CTC Breakup" />
              <Toggle value={!!f.show_payslip} onChange={(v) => set("show_payslip", v)} label="Payslip" />
            </div>
          </div>

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
              {saving ? "Saving…" : initial ? "Update" : "Add Component"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ComponentForm;
