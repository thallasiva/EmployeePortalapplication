import React, { useState, useCallback, useEffect } from "react";
import { RefreshCw, Eye } from "lucide-react";
import { computeCTC } from "../../../api/salaryComponent.api";
import { errorToast } from "../../../utils/ToastControllers";
import { fmtINR } from "./salaryHelpers";

function Section({ title, items, colorClass }) {
  const total = items.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${colorClass}`}>{title}</p>
      <div className="space-y-1.5">
        {items.map((c) => (
          <div key={c.component_code} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{c.component_name}</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-800">{fmtINR(c.monthly_amount)}</span>
              <span className="text-[10px] text-gray-400 ml-2">{fmtINR(c.annual_amount)}/yr</span>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className={`flex justify-between items-center mt-2 pt-2 border-t font-semibold text-sm ${colorClass}`}>
          <span>Total {title}</span>
          <span>{fmtINR(total)}</span>
        </div>
      )}
    </div>
  );
}

export default function SalaryPreviewTab({ structureId }) {
  const [ctcM, setCtcM]       = useState(100000);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (!structureId || ctcM < 1000) return;
    setLoading(true);
    try { setResult(await computeCTC(structureId, ctcM * 12)); }
    catch { errorToast("Failed to compute. Make sure the structure is saved first."); }
    finally { setLoading(false); }
  }, [structureId, ctcM]);

  useEffect(() => { compute(); }, [compute]);

  const components = result?.components ?? [];
  const earnings   = components.filter((c) => c.category === "Earning");
  const deductions = components.filter((c) => c.category === "Deduction");
  const employer   = components.filter((c) => c.category === "Employer Contribution");
  const totalE     = earnings.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const totalD     = deductions.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const net        = Math.max(0, totalE - totalD);

  return (
    <div className="p-5">
      {/* CTC Input bar */}
      <div className="flex items-center gap-4 mb-6 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
        <Eye size={16} className="text-gray-400 shrink-0" />
        <label className="text-sm text-gray-600 shrink-0">Preview CTC (Monthly)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input
            type="number" value={ctcM} min={1000}
            onChange={(e) => setCtcM(Number(e.target.value))}
            className="pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 w-36"
          />
        </div>
        <span className="text-xs text-gray-400">Annual: ₹{(ctcM * 12).toLocaleString("en-IN")}</span>
        <button onClick={compute}
          className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-100">
          <RefreshCw size={12} /> Recalculate
        </button>
        {loading && <span className="text-xs text-indigo-400 animate-pulse">Computing…</span>}
      </div>

      {!result ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {loading ? "Computing…" : !structureId ? "Save the structure first to preview calculations." : "Enter CTC above and click Recalculate."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-10">
          {/* Left column: Earnings + Deductions + Net */}
          <div className="space-y-6">
            <Section title="Earnings" items={earnings} colorClass="text-green-700" />
            <Section title="Deductions" items={deductions} colorClass="text-red-700" />

            {/* Net pay */}
            <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="font-semibold text-green-800">Net Salary (Take Home)</span>
              <span className="text-lg font-bold text-green-700">{fmtINR(net)}</span>
            </div>
          </div>

          {/* Right column: Employer + CTC Summary */}
          <div className="space-y-6">
            <Section title="Employer Contributions" items={employer} colorClass="text-blue-700" />

            {/* CTC Summary */}
            <div className="bg-[#1e3a5f] text-white rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-4">CTC Summary (Annual)</p>
              {[
                ["Total Fixed Pay (Annual)",         earnings.filter(c => c.frequency === "Monthly").reduce((s,c) => s + (c.annual_amount||0), 0)],
                ["Total Variable Pay (Annual)",      earnings.filter(c => c.frequency !== "Monthly").reduce((s,c) => s + (c.annual_amount||0), 0)],
                ["Employer Contributions (Annual)",  employer.reduce((s,c) => s + (c.annual_amount||0), 0)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="opacity-70">{label}</span>
                  <span className="font-medium">{fmtINR(val)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-3 border-t border-white/20">
                <span>Total CTC (Annual)</span>
                <span className="text-yellow-300">{fmtINR(ctcM * 12)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
