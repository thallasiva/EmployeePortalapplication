import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { MONTH_NAMES } from "../constants";
import { fmtAmt } from "../utils";

const EmployeePanel = React.memo(function EmployeePanel({
  user,
  payslip,
  structure,
  empProfile,
  bankDetails,
  month,
  year,
  onHide
}) {
  const empNo = empProfile?.emp_code || payslip?.emp_code || user?.empCode || "—";
  const empName = empProfile
    ? [empProfile.first_name, empProfile.last_name].filter(Boolean).join(" ")
    : user?.name || "—";
  const bank = bankDetails?.bank_name || empProfile?.bank_name || "—";
  const bankAcc = bankDetails?.account_number || empProfile?.account_number || "—";
  const rawDate = empProfile?.emp_joining_date || empProfile?.joining_date;
  const joinDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const pfNo = empProfile?.pf_number || bankDetails?.pf_number || "—";
  const netPay = Number(payslip?.net_salary ?? payslip?.net_pay ?? 0);
  const monthLabel = month ? `${MONTH_NAMES[Number(month) - 1]} ${year}` : "—";

  return (
    <div className={cssClass({ background: "#fffde7", border: "1px solid #e8e1a0", borderRadius: 8, padding: 16, minWidth: 220 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 })}>
        <span className={cssClass({ fontSize: 11, color: "#7b7b3b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" })}>
          Employee details
        </span>
        <button
          type="button"
          onClick={onHide}
          className={cssClass({ fontSize: 11, color: "#f18200", background: "none", border: "none", cursor: "pointer", fontWeight: 600 })}
        >
          Hide
        </button>
      </div>
      {[
        { label: "Employee No", value: empNo },
        { label: "Name", value: empName },
        { label: "Bank", value: bank },
        { label: "Bank Account No", value: bankAcc },
        { label: "Joining Date", value: joinDate },
        { label: "PF No", value: pfNo }
      ].map(({ label, value }) => (
        <div key={label} className={cssClass({ marginBottom: 10 })}>
          <div className={cssClass({ fontSize: 10, color: "#9e9e5a" })}>{label}</div>
          <div className={cssClass({ fontSize: 13, color: value !== "—" ? "#333" : "#bbb", fontWeight: 500, marginTop: 2, wordBreak: "break-all" })}>
            {value}
          </div>
        </div>
      ))}
      <div className={cssClass({ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #d4ce7a" })}>
        <div className={cssClass({ fontSize: 11, color: "#7b7b3b" })}>Net Pay for {monthLabel}</div>
        <div className={cssClass({ fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginTop: 4 })}>
          ₹{fmtAmt(netPay)}
        </div>
      </div>
    </div>
  );
});

export default EmployeePanel;
