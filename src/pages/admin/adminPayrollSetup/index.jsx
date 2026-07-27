import React, { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, TABS } from "./constants";
import SalaryComponents from "./components/SalaryComponents";
import RevisionPlanner from "./components/RevisionPlanner";
import PayrollSettings from "./components/PayrollSettings";

const AdminPayrollSetup = React.memo(function AdminPayrollSetup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "components";

  const setTab = useCallback((t) => setSearchParams({ tab: t }), [setSearchParams]);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>
          Payroll Setup
        </h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Salary structures, revision history and payroll configuration
        </p>
      </div>

      <div
        className={cssClass({
          display: "flex",
          gap: 0,
          borderBottom: "2px solid #eee",
          marginBottom: 24,
        })}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cssClass({
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? ORANGE : "#666",
              borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom: -2,
            })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={cssClass({
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #eee",
          padding: 20,
          boxShadow: "0 1px 4px #0000000a",
        })}
      >
        {tab === "components" && <SalaryComponents />}
        {tab === "revision" && <RevisionPlanner />}
        {tab === "settings" && <PayrollSettings />}
      </div>
    </div>
  );
});

export default AdminPayrollSetup;
