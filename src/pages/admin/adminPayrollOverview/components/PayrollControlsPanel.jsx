import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import Toggle from "./Toggle";

const CONTROL_ITEMS = [
  { key: "payrollInputs",    label: "Payroll Inputs",          sub: "Allow data entry" },
  { key: "employeeView",     label: "Employee Payslip View",   sub: "Release to staff" },
  { key: "itStatementView",  label: "IT Statement View",       sub: "Release IT forms" },
  { key: "payroll",          label: "Payroll Processing",      sub: "Allow payroll run" },
];

const QUICK_LINKS = [
  { label: "Payroll Statement",    path: "/dashboard/payroll/statement" },
  { label: "PF / ESI Compliance", path: "/dashboard/payroll/compliance?tab=pan" },
  { label: "Payslip Release",      path: "/dashboard/payroll/compliance?tab=release" },
  { label: "IT Declaration",       path: "/dashboard/it-declaration" },
];

const PayrollControlsPanel = React.memo(function PayrollControlsPanel({ controls, onControlChange }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      padding: "22px 24px", boxShadow: "0 2px 8px #0000000d",
    })}>
      <div className={cssClass({ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 4 })}>Payroll Controls</div>
      <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginBottom: 16 })}>Access & lock settings</div>

      {CONTROL_ITEMS.map((item) => (
        <div key={item.key} className={cssClass({
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "11px 13px", borderRadius: 8, marginBottom: 7,
          background: controls[item.key] ? "#fff8f0" : "#fafafa",
          border: `1px solid ${controls[item.key] ? BRAND + "30" : "#f0f0f0"}`,
          transition: "all .2s",
        })}>
          <div>
            <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1a1a1a" })}>{item.label}</div>
            <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{item.sub}</div>
          </div>
          <Toggle on={controls[item.key]} onChange={(v) => onControlChange(item.key, v)} />
        </div>
      ))}

      <div className={cssClass({ borderTop: "1px solid #f3f4f6", marginTop: 14, paddingTop: 12 })}>
        <div className={cssClass({
          fontSize: 10, fontWeight: 700, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: .5, marginBottom: 8,
        })}>
          Quick Access
        </div>
        {QUICK_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.path}
            onMouseEnter={(e) => e.currentTarget.style.color = BRAND}
            onMouseLeave={(e) => e.currentTarget.style.color = "#374151"}
            className={cssClass({
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0", fontSize: 12, color: "#374151", textDecoration: "none",
              borderBottom: "1px solid #f3f4f6", transition: "color .15s",
            })}
          >
            <span>{l.label}</span>
            <span className={cssClass({ color: "#d1d5db" })}>›</span>
          </a>
        ))}
      </div>
    </div>
  );
});

export default PayrollControlsPanel;
