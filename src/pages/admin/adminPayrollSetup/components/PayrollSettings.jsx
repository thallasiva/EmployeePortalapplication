import React, { useState, useCallback } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { ORANGE } from "../constants";

const ToggleRow = React.memo(function ToggleRow({ label, desc, field, value, onToggle }) {
  return (
    <div
      className={cssClass({
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #f0f0f0",
      })}
    >
      <div>
        <div className={cssClass({ fontWeight: 600, fontSize: 14, color: "#1a1a1a" })}>{label}</div>
        <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 2 })}>{desc}</div>
      </div>
      <div
        onClick={() => onToggle(field)}
        className={cssClass({
          width: 44,
          height: 24,
          borderRadius: 12,
          cursor: "pointer",
          position: "relative",
          background: value ? ORANGE : "#ddd",
          transition: "background .2s",
        })}
      >
        <div
          className={cssClass({
            position: "absolute",
            top: 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s",
            boxShadow: "0 1px 3px #0004",
            left: value ? 22 : 2,
          })}
        />
      </div>
    </div>
  );
});

const PayrollSettings = React.memo(function PayrollSettings() {
  const [settings, setSettings] = useState({
    pfEnabled: true,
    pfCap: 15000,
    esiEnabled: true,
    esiGrossLimit: 21000,
    ptEnabled: true,
    payrollCycleDay: 25,
    salaryDay: 1,
    taxRegime: "new",
    emailPayslips: true,
  });

  const handleToggle = useCallback((field) => {
    setSettings((p) => ({ ...p, [field]: !p[field] }));
  }, []);

  const handleSelect = useCallback(
    (field) => (e) => {
      setSettings((p) => ({ ...p, [field]: Number(e.target.value) }));
    },
    []
  );

  const handleTaxRegime = useCallback((regime) => {
    setSettings((p) => ({ ...p, taxRegime: regime }));
  }, []);

  return (
    <div className={cssClass({ maxWidth: 640 })}>
      <div className={cssClass({ marginBottom: 20 })}>
        <h3 className={cssClass({ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a1a" })}>
          Statutory Deductions
        </h3>
        <ToggleRow
          label="Provident Fund (EPF)"
          desc={`12% of basic capped at ₹${settings.pfCap.toLocaleString("en-IN")}`}
          field="pfEnabled"
          value={settings.pfEnabled}
          onToggle={handleToggle}
        />
        <ToggleRow
          label="Employee State Insurance (ESI)"
          desc={`0.75% of gross (employees earning ≤ ₹${settings.esiGrossLimit.toLocaleString("en-IN")}/month)`}
          field="esiEnabled"
          value={settings.esiEnabled}
          onToggle={handleToggle}
        />
        <ToggleRow
          label="Professional Tax"
          desc="Computed per state slab on gross earnings"
          field="ptEnabled"
          value={settings.ptEnabled}
          onToggle={handleToggle}
        />
      </div>

      <div className={cssClass({ marginBottom: 20 })}>
        <h3 className={cssClass({ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a1a" })}>
          Payroll Cycle
        </h3>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 })}>
          <div>
            <label className={cssClass({ fontSize: 13, color: "#555", fontWeight: 600 })}>
              Payroll Processing Day
            </label>
            <select
              value={settings.payrollCycleDay}
              onChange={handleSelect("payrollCycleDay")}
              className={cssClass({
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 13,
                marginTop: 6,
              })}
            >
              {[20, 21, 22, 23, 24, 25, 26, 27, 28].map((d) => (
                <option key={d} value={d}>
                  {d}th of each month
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, color: "#555", fontWeight: 600 })}>
              Salary Credit Day
            </label>
            <select
              value={settings.salaryDay}
              onChange={handleSelect("salaryDay")}
              className={cssClass({
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ddd",
                fontSize: 13,
                marginTop: 6,
              })}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}st of next month
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cssClass({ marginBottom: 20 })}>
        <h3 className={cssClass({ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a1a" })}>
          Tax Configuration
        </h3>
        <div className={cssClass({ display: "flex", gap: 12 })}>
          {["old", "new"].map((regime) => (
            <div
              key={regime}
              onClick={() => handleTaxRegime(regime)}
              className={cssClass({
                flex: 1,
                padding: "14px 18px",
                borderRadius: 8,
                cursor: "pointer",
                border:
                  settings.taxRegime === regime ? `2px solid ${ORANGE}` : "2px solid #eee",
                background: settings.taxRegime === regime ? "#fff8f0" : "#fff",
              })}
            >
              <div
                className={cssClass({
                  fontWeight: 700,
                  fontSize: 14,
                  color: settings.taxRegime === regime ? ORANGE : "#1a1a1a",
                })}
              >
                {regime === "new" ? "New Tax Regime (Default)" : "Old Tax Regime"}
              </div>
              <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 4 })}>
                {regime === "new"
                  ? "Lower rates, no exemptions/deductions"
                  : "Higher rates with HRA, 80C, 80D deductions"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cssClass({ marginBottom: 20 })}>
        <h3 className={cssClass({ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#1a1a1a" })}>
          Notifications
        </h3>
        <ToggleRow
          label="Email payslips to employees"
          desc="Send payslip PDF via email after payroll is processed"
          field="emailPayslips"
          value={settings.emailPayslips}
          onToggle={handleToggle}
        />
      </div>

      <button
        className={cssClass({
          padding: "10px 24px",
          background: ORANGE,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
        })}
      >
        Save Settings
      </button>
    </div>
  );
});

export default PayrollSettings;
