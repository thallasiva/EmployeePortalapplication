import React, { useState, useCallback } from "react";
import { Pencil, Power, ChevronDown, ChevronUp } from "lucide-react";
import { CAT_COLOR } from "../constants";
import { formatCalcDisplay } from "../utils";

const ComponentRow = React.memo(function ComponentRow({ c, onEdit, onToggle }) {
  const [open, setOpen] = useState(false);
  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return (
    <>
      <tr className={`border-t border-gray-100 ${!c.is_active ? "opacity-50" : ""}`}>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-800">{c.component_name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{c.component_code}</div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${CAT_COLOR[c.category] || ""}`}>
            {c.category}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {c.calc_type === "Formula" ? (
            <span className="font-mono text-[11px] text-purple-700">{c.formula_expr}</span>
          ) : (
            formatCalcDisplay(c)
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{c.frequency}</td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {c.show_offer_letter && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">Offer</span>}
            {c.show_ctc_breakup && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">CTC</span>}
            {c.show_payslip && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Slip</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
              <Pencil size={13} />
            </button>
            {!c.is_system && (
              <button
                onClick={() => onToggle(c)}
                title={c.is_active ? "Deactivate" : "Activate"}
                className={`p-1.5 rounded-lg ${c.is_active ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
              >
                <Power size={13} />
              </button>
            )}
            <button onClick={toggleOpen} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50 border-t border-gray-100">
          <td colSpan={6} className="px-6 py-3">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span>Taxable: <b>{c.is_taxable ? "Yes" : "No"}</b></span>
              <span>PF: <b>{c.pf_applicable ? "Yes" : "No"}</b></span>
              <span>ESI: <b>{c.esi_applicable ? "Yes" : "No"}</b></span>
              <span>Gratuity: <b>{c.gratuity_applicable ? "Yes" : "No"}</b></span>
              <span>Sort: <b>{c.sort_order}</b></span>
              {c.description && <span>Note: <i>{c.description}</i></span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

export default ComponentRow;
