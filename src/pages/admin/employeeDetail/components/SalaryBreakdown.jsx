import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const SalaryBreakdown = React.memo(function SalaryBreakdown({ bk }) {
  const net = bk.netSalary ?? bk.totalEarnings - bk.totalDeductions;

  const summaryCards = [
    { label: "Monthly Basic", value: bk.basic, bg: "#f0f9ff", color: "#0369a1" },
    { label: "Gross Earnings", value: bk.totalEarnings, bg: "#f0fdf4", color: "#16a34a" },
    { label: "Total Deductions", value: bk.totalDeductions, bg: "#fef2f2", color: "#dc2626" },
    { label: "Net Pay", value: net, bg: "#f0fdf4", color: "#16a34a" },
    { label: "CTC Monthly", value: bk.ctc, bg: "#fff7ed", color: BRAND },
    { label: "CTC Annual", value: bk.ctc * 12, bg: "#fff7ed", color: BRAND },
  ];

  const earningsRows = [
    ["Basic", bk.basic], ["HRA (40%)", bk.hra], ["Special (25%)", bk.specialAllowance],
    ["LTA (4.5%)", bk.lta], ["Tel & Net (2%)", bk.telephoneAndInternet],
    ["Medical (5%)", bk.medicalAllowance], ["Conveyance (3%)", bk.conveyance],
    ["Bonus (5%)", bk.bonus], ["Incentives (5%)", bk.incentives],
    ["Arrears (7.5%)", bk.arrears], ["Other (1%)", bk.otherEarnings],
  ];

  const empDeductionRows = [
    ["PF (12%)", bk.pf], ["ESI (0.75%)", bk.esiEmployee || 0],
    ["Prof. Tax", bk.professionalTax], ["TDS / IT", bk.tds],
  ];

  const employerRows = [
    ["EPS (8.33%)", bk.eps], ["EPF (3.67%)", bk.epf],
    ["EDLI (0.5%)", bk.edli], ["ESI (3.25%)", bk.esiEmployer || 0],
  ];

  return (
    <div className={cssClass({ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 })}>
      <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 12 })}>
        Calculated Salary Breakdown
      </div>
      <div className={cssClass({ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 })}>
        {summaryCards.map(({ label, value, bg, color }) => (
          <div key={label} className={cssClass({ background: bg, border: `1px solid ${color}22`, borderRadius: 8, padding: "8px 14px", minWidth: 130 })}>
            <div className={cssClass({ fontSize: 10, color: "#6b7280", marginBottom: 2 })}>{label}</div>
            <div className={cssClass({ fontSize: 14, fontWeight: 800, color })}>₹ {(value || 0).toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
        <div>
          <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", marginBottom: 6 })}>Earnings</div>
          <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 11 })}>
              <tbody>
                {earningsRows.map(([l, v]) => (
                  <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}>
                    <td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td>
                    <td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600 })}>{(v || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className={cssClass({ background: "#f0fdf4" })}>
                  <td className={cssClass({ padding: "6px 10px", fontWeight: 700, color: "#16a34a" })}>Total</td>
                  <td className={cssClass({ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" })}>{(bk.totalEarnings || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: 6 })}>Deductions</div>
          <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" })}>
            <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 11 })}>
              <tbody>
                <tr className={cssClass({ background: "#fef2f2" })}>
                  <td colSpan={2} className={cssClass({ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#dc2626" })}>Employee</td>
                </tr>
                {empDeductionRows.map(([l, v]) => (
                  <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}>
                    <td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td>
                    <td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600 })}>{(v || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className={cssClass({ background: "#fff7ed" })}>
                  <td colSpan={2} className={cssClass({ padding: "4px 10px", fontSize: 10, fontWeight: 700, color: BRAND })}>Employer (CTC)</td>
                </tr>
                {employerRows.map(([l, v]) => (
                  <tr key={l} className={cssClass({ borderTop: "1px solid #f3f4f6" })}>
                    <td className={cssClass({ padding: "5px 10px", color: "#374151" })}>{l}</td>
                    <td className={cssClass({ padding: "5px 10px", textAlign: "right", fontWeight: 600, color: BRAND })}>{(v || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className={cssClass({ background: "#f0fdf4" })}>
                  <td className={cssClass({ padding: "6px 10px", fontWeight: 700, color: "#16a34a" })}>Net Pay</td>
                  <td className={cssClass({ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#16a34a" })}>{(net || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SalaryBreakdown;
