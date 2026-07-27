import React, { useMemo } from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { fmtAmt } from "../utils";

const tableSt = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thSt = { background: "#fff8f0", padding: "6px 10px", textAlign: "right", fontSize: 11, color: "#5a7a8a", fontWeight: 600 };
const thLSt = { ...thSt, textAlign: "left" };
const tdSt = { padding: "7px 10px", borderBottom: "1px solid #f0f0f0", color: "#333" };
const tdRSt = { ...tdSt, textAlign: "right", fontFamily: "monospace", color: "#222" };
const tfSt = { padding: "8px 10px", fontWeight: 700, color: "#1a1a1a" };
const tfRSt = { ...tfSt, textAlign: "right", fontFamily: "monospace", fontSize: 14 };

const PayslipTab = React.memo(function PayslipTab({ payslip, structure }) {
  const b = useMemo(() => buildSalaryBreakdown(structure, payslip), [payslip, structure]);
  const hasData = b.basic > 0;

  const earnings = hasData
    ? [
        { label: "BASIC", value: b.basic },
        { label: "HRA", value: b.hra },
        { label: "SPECIAL ALLOWANCE", value: b.special },
        { label: "LTA", value: b.lta },
        { label: "TELEPHONE AND INTERNET EXPENSES", value: b.telephone },
        { label: "CONVEYANCE ALLOWANCE", value: b.conveyance },
        { label: "MEDICAL ALLOWANCE", value: b.medical }
      ].filter((r) => r.value > 0)
    : [];

  const deductions = hasData
    ? [
        { label: "PROVIDENT FUND (EMPLOYEE)", value: b.pf },
        { label: "PROFESSIONAL TAX", value: b.profTax }
      ].filter((r) => r.value > 0)
    : [];

  const totalEarnings = b.gross;
  const totalDeductions = b.deductions;

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "start" })}>
      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Earnings</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((r) => (
              <tr key={r.label}>
                <td className={cssClass(tdSt)}>{r.label}</td>
                <td className={cssClass(tdRSt)}>{fmtAmt(r.value)}</td>
              </tr>
            ))}
            {!earnings.length && (
              <tr>
                <td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className={cssClass({ borderTop: "2px solid #ffe0b2" })}>
              <td className={cssClass(tfSt)}>Total</td>
              <td className={cssClass(tfRSt)}>{fmtAmt(totalEarnings)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className={cssClass({ border: "1px solid #ffe0b2", borderRadius: 6, overflow: "hidden" })}>
        <table className={cssClass(tableSt)}>
          <thead>
            <tr>
              <th className={cssClass(thLSt)}>Deductions</th>
              <th className={cssClass(thSt)}>Amount in (₹)</th>
            </tr>
          </thead>
          <tbody>
            {deductions.map((r) => (
              <tr key={r.label}>
                <td className={cssClass(tdSt)}>{r.label}</td>
                <td className={cssClass(tdRSt)}>{fmtAmt(r.value)}</td>
              </tr>
            ))}
            {!deductions.length && (
              <tr>
                <td colSpan={2} className={cssClass({ ...tdSt, color: "#aaa", textAlign: "center" })}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className={cssClass({ borderTop: "2px solid #ffe0b2" })}>
              <td className={cssClass(tfSt)}>Total</td>
              <td className={cssClass(tfRSt)}>{fmtAmt(totalDeductions)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

export default PayslipTab;
