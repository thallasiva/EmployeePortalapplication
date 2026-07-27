import React, { useMemo } from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { fmtAmt } from "../utils";
import EmployeePanel from "./EmployeePanel";

const tableSt = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thSt = { background: "#fff8f0", padding: "6px 10px", fontSize: 11, color: "#5a7a8a", fontWeight: 600, textAlign: "right" };
const thLSt = { ...thSt, textAlign: "left" };
const tdSt = { padding: "7px 10px", borderBottom: "1px solid #f0f0f0" };
const tdRSt = { ...tdSt, textAlign: "right", fontFamily: "monospace" };

const CtcPayslipTab = React.memo(function CtcPayslipTab({ payslip, structure }) {
  const b = useMemo(() => buildSalaryBreakdown(structure, payslip), [payslip, structure]);
  const hasData = b.basic > 0;

  const items = hasData
    ? [
        { label: "FULL BASIC", value: b.basic },
        { label: "FULL HRA", value: b.hra },
        { label: "FULL SPECIAL ALLOWANCE", value: b.special },
        { label: "FULL LTA", value: b.lta },
        { label: "FULL TELEPHONE AND INTERNET EXPENSES", value: b.telephone },
        { label: "FULL CONVEYANCE ALLOWANCE", value: b.conveyance },
        { label: "FULL MEDICAL ALLOWANCE", value: b.medical },
        { label: "FULL EMPLOYER PF", value: b.empPf, highlight: "#c8380a" },
        { label: "MONTHLY GROSS", value: b.gross, highlight: "#f18200", bold: true },
        { label: "MONTHLY CTC", value: b.ctc, highlight: "#f18200", bold: true }
      ].filter((r) => r.value > 0)
    : [];

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" })}>
      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Items</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.label}>
                <td className={cssClass({ ...tdSt, color: r.highlight || "#333", fontWeight: r.bold ? 700 : 400 })}>
                  {r.label}
                </td>
                <td className={cssClass({ ...tdRSt, color: r.highlight || "#222", fontWeight: r.bold ? 700 : 400 })}>
                  {fmtAmt(r.value)}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>
                  No salary structure found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EmployeePanel
        payslip={payslip}
        structure={structure}
        month={payslip?.month}
        year={payslip?.year}
      />
    </div>
  );
});

export default CtcPayslipTab;
