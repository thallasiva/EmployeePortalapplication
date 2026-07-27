import React, { useState } from "react";
import { Pencil, Trash2, Star, ChevronDown, ChevronUp } from "lucide-react";
import { pct, money, yn } from "../utils";

const TemplateCard = React.memo(function TemplateCard({ t, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-white rounded-2xl border ${t.is_default ? "border-indigo-300 shadow-sm" : "border-gray-200"} overflow-hidden`}>
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{t.template_name}</h3>
            {t.is_default ?
            <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Star size={9} fill="currentColor" /> Default
              </span> :
            null}
          </div>
          {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">Basic {pct(t.basic_pct)}</span>
            <span className="text-[11px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">HRA {pct(t.hra_pct)}</span>
            {Number(t.variable_pct) > 0 &&
            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">Variable {pct(t.variable_pct)}</span>
            }
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
          <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {open &&
      <div className="border-t border-gray-100 px-5 py-4">
          <table className="w-full text-xs text-gray-600">
            <tbody className="divide-y divide-gray-50">
              {[
            ["Basic %", pct(t.basic_pct)],
            ["HRA %", pct(t.hra_pct)],
            ["Variable %", pct(t.variable_pct)],
            ["Telephone (monthly)", money(t.telephone_monthly)],
            ["LTA (annual)", money(t.lta_annual)],
            ["PF Applicable", yn(t.pf_applicable)],
            ["PF Cap @ ₹15k Basic", yn(t.pf_cap)],
            ["Gratuity", yn(t.gratuity_applicable)],
            ["Statutory Bonus", yn(t.bonus_applicable)],
            ["Insurance (annual)", money(t.insurance_cost)],
            ["Other Allowances", money(t.other_allowances)],
            ["Professional Tax", money(t.professional_tax)]].
            map(([k, v]) =>
            <tr key={k}>
                  <td className="py-1.5 text-gray-400 w-40">{k}</td>
                  <td className="py-1.5 font-medium text-gray-700 text-right">{v}</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
});

export default TemplateCard;
