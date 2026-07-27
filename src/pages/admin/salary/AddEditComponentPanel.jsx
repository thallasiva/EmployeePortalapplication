import React, { useState } from "react";
import { X } from "lucide-react";
import {
  CALC_TYPES, CATEGORIES, FREQUENCIES, PCT_OF_OPTS,
  codeFromName, inp, sel } from
"./salaryHelpers";

export default function AddEditComponentPanel({
  initial,
  masterComponents,
  existingIds,
  defaultCategory,
  onSave,
  onClose
}) {
  const isEdit = !!initial;
  const [mode, setMode] = useState(isEdit ? "new" : "existing");
  const [existingId, setExId] = useState("");


  const [name, setName] = useState(initial?.component_name ?? "");
  const [code, setCode] = useState(initial?.component_code ?? "");
  const [category, setCat] = useState(initial?.category ?? defaultCategory ?? "Earning");
  const [calcType, setCalc] = useState(initial?.effective_calc_type ?? initial?.calc_type ?? "Percentage");
  const [pct, setPct] = useState(initial?.effective_pct ?? initial?.percentage_value ?? "");
  const [pctOf, setPctOf] = useState(initial?.effective_pct_of ?? initial?.percentage_of ?? "CTC_MONTHLY");
  const [fixedAmt, setFixed] = useState(initial?.fixed_amount ?? "");
  const [formula, setFormula] = useState(initial?.effective_formula ?? initial?.formula_expr ?? "");
  const [frequency, setFreq] = useState(initial?.frequency ?? "Monthly");
  const [sortOrder, setSort] = useState(initial?.sort_order ?? 100);
  const [taxable, setTax] = useState(initial?.is_taxable !== false);
  const [pfAppl, setPf] = useState(!!initial?.pf_applicable);
  const [esiAppl, setEsi] = useState(!!initial?.esi_applicable);
  const [showPayslip, setSP] = useState(initial?.show_on_payslip !== false);
  const [showOffer, setSO] = useState(initial?.show_offer_letter !== false);
  const [showCTC, setSC] = useState(initial?.show_ctc_breakup !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const available = masterComponents.filter(
    (c) => c.is_active && !existingIds.has(c.component_id)
  );

  const handleNameChange = (v) => {
    setName(v);
    if (!isEdit) setCode(codeFromName(v));
  };

  const handleSave = async () => {
    setError("");
    if (!isEdit && mode === "existing") {
      if (!existingId) {setError("Please select a component.");return;}
      setSaving(true);
      try {await onSave({ mode: "existing", component_id: Number(existingId), sort_order: Number(sortOrder) });} finally
      {setSaving(false);}
      return;
    }
    if (!name.trim()) {setError("Component name is required.");return;}
    if (!code.trim()) {setError("Short code is required.");return;}
    if (calcType === "Percentage" && !pct) {setError("Enter percentage value.");return;}
    if (calcType === "Fixed Amount" && !fixedAmt) {setError("Enter fixed amount.");return;}
    if (calcType === "Formula" && !formula.trim()) {setError("Enter formula expression.");return;}

    setSaving(true);
    try {
      await onSave({
        mode: "new",
        component_id: initial?.component_id ?? null,
        component_name: name.trim(),
        component_code: code.trim().toUpperCase(),
        category, calc_type: calcType,
        percentage_value: calcType === "Percentage" ? Number(pct) : null,
        percentage_of: calcType === "Percentage" ? pctOf : null,
        formula_expr: calcType === "Formula" ? formula.trim() : null,
        fixed_amount: calcType === "Fixed Amount" ? Number(fixedAmt) : null,
        frequency, sort_order: Number(sortOrder),
        is_taxable: taxable, pf_applicable: pfAppl, esi_applicable: esiAppl,
        show_payslip: showPayslip, show_offer_letter: showOffer, show_ctc_breakup: showCTC
      });
    } finally {setSaving(false);}
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl flex flex-col border-l border-gray-200">
      {}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">
          {isEdit ? "Edit Component" : "Add Component"}
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
          <X size={15} />
        </button>
      </div>

      {}
      {!isEdit &&
      <div className="flex border-b border-gray-100">
          {[["existing", "Add Existing"], ["new", "Create New"]].map(([m, lbl]) =>
        <button key={m} onClick={() => setMode(m)}
        className={`flex-1 py-2.5 text-xs font-medium transition-all ${
        mode === m ?
        "border-b-2 border-indigo-600 text-indigo-600" :
        "text-gray-400 hover:text-gray-600"}`
        }>
              {lbl}
            </button>
        )}
        </div>
      }

      {}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {error &&
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">{error}</div>
        }

        {}
        {!isEdit && mode === "existing" ?
        <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Component *</label>
              <select value={existingId} onChange={(e) => setExId(e.target.value)} className={sel}>
                <option value="">— select —</option>
                {available.map((c) =>
              <option key={c.component_id} value={c.component_id}>
                    {c.component_name} ({c.component_code}) — {c.category}
                  </option>
              )}
              </select>
              {available.length === 0 &&
            <p className="text-[11px] text-amber-600 mt-1">
                  All active master components are already in this structure. Switch to "Create New" to add a custom one.
                </p>
            }
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Display Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSort(e.target.value)} className={inp} />
            </div>
          </> : (


        <>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Component Name *</label>
                <input value={name} onChange={(e) => handleNameChange(e.target.value)}
              className={inp} placeholder="e.g. House Rent Allowance" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Short Code *</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inp} placeholder="HRA" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category *</label>
                <select value={category} onChange={(e) => setCat(e.target.value)} className={sel}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Calculation Type *</label>
                <select value={calcType} onChange={(e) => setCalc(e.target.value)} className={sel}>
                  {CALC_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequency *</label>
                <select value={frequency} onChange={(e) => setFreq(e.target.value)} className={sel}>
                  {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {}
            {calcType === "Percentage" &&
          <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Percentage (%)</label>
                  <input type="number" value={pct} onChange={(e) => setPct(e.target.value)}
              className={inp} placeholder="40" step="0.01" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Based On</label>
                  <select value={pctOf} onChange={(e) => setPctOf(e.target.value)} className={sel}>
                    {PCT_OF_OPTS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
          }
            {calcType === "Fixed Amount" &&
          <div>
                <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
                <input type="number" value={fixedAmt} onChange={(e) => setFixed(e.target.value)}
            className={inp} placeholder="1500" />
              </div>
          }
            {calcType === "Formula" &&
          <div>
                <label className="block text-xs text-gray-500 mb-1">Formula Expression</label>
                <input value={formula} onChange={(e) => setFormula(e.target.value)}
            className={inp} placeholder="CTC_MONTHLY - BASIC - HRA - SPL" />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Tokens: BASIC, HRA, GROSS, CTC_MONTHLY, CTC_ANNUAL, MIN(), MAX(), ROUND(), IF()
                </p>
              </div>
          }

            <div>
              <label className="block text-xs text-gray-500 mb-1">Display Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSort(e.target.value)}
            className={inp} placeholder="100" />
            </div>

            {}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Flags</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                {[
              [taxable, setTax, "Taxable"],
              [pfAppl, setPf, "PF Applicable"],
              [esiAppl, setEsi, "ESI Applicable"],
              [showPayslip, setSP, "Show in Payslip"],
              [showOffer, setSO, "Show in Offer Letter"],
              [showCTC, setSC, "Show in CTC"]].
              map(([val, setter, label]) =>
              <label key={label} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                    {label}
                  </label>
              )}
              </div>
            </div>
          </>)
        }
      </div>

      {}
      <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onClose}
        className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
        className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
          {saving ? "Saving…" : isEdit ? "Update" : "Save & Add"}
        </button>
      </div>
    </div>);

}
