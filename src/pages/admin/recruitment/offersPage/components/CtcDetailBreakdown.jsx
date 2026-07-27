import React from "react";
import CtcTableRow from "./CtcTableRow";
import { fmt, fmtM } from "../utils/ctcUtils";

const CtcDetailBreakdown = React.memo(function CtcDetailBreakdown({ d }) {
  return (
    <div className="mt-3.5 px-3.5 py-3.5 bg-[#fff7ed] rounded-lg border-l-[3px] border-[#f18200]">
      <div className="grid grid-cols-3 pb-1.5 mb-1 border-b-2 border-[#f18200]">
        <span className="text-[11px] font-bold text-[#92400e] uppercase">Components</span>
        <span className="text-[11px] font-bold text-[#92400e] uppercase text-right">Monthly</span>
        <span className="text-[11px] font-bold text-[#92400e] uppercase text-right">Annual</span>
      </div>
      <CtcTableRow label="Basic" monthly={fmtM(d.basic)} annual={fmt(d.basic)} />
      <CtcTableRow label="HRA" monthly={fmtM(d.hra)} annual={fmt(d.hra)} />
      <CtcTableRow label="Telephone/Internet Expenses" monthly={fmtM(d.telephone_allowance)} annual={fmt(d.telephone_allowance)} />
      <CtcTableRow label="Leave Travel Allowance" monthly={fmtM(d.leave_travel)} annual={fmt(d.leave_travel)} />
      <CtcTableRow label="Spl. Allowance" monthly={fmtM(d.special_allowance)} annual={fmt(d.special_allowance)} />
      <CtcTableRow label="Gross Salary" monthly={fmtM(d.gross_salary)} annual={fmt(d.gross_salary)} highlight />
      <CtcTableRow label="Company's PF Contribution" monthly={fmtM(d.pf_contribution)} annual={fmt(d.pf_contribution)} />
      <CtcTableRow label="Statutory Bonus" monthly={fmtM(d.statutory_bonus)} annual={fmt(d.statutory_bonus)} />
      <CtcTableRow label="Gratuity" monthly={fmtM(d.gratuity)} annual={fmt(d.gratuity)} />
      <CtcTableRow label="ESI" monthly={fmtM(d.esi)} annual={fmt(d.esi)} />
      <CtcTableRow label="Variable Pay" monthly="" annual="" />
      <CtcTableRow label="Insurance premiums (GMC, GPA and Term life)" monthly="" annual="" />
      <CtcTableRow label="Cost To Company" monthly={fmtM(d.ctc)} annual={fmt(d.ctc)} highlight />
      {d.ctc_in_words && (
        <div className="mt-2.5 text-[12px] text-amber-900 italic">
          <strong>In Words:</strong> {d.ctc_in_words}
        </div>
      )}
    </div>
  );
});

export default CtcDetailBreakdown;
