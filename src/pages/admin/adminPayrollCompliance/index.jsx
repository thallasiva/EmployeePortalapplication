import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, TABS } from "./constants";
import MonthBar from "./components/MonthBar";
import PANStatus from "./components/PANStatus";
import PFKYCMapping from "./components/PFKYCMapping";
import Remittances from "./components/Remittances";
import PayrollRelease from "./components/PayrollRelease";

function AdminPayrollCompliance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "pan";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const setTab = useCallback((t) => setSearchParams({ tab: t }), [setSearchParams]);
  const handleMonthChange = useCallback((m, y) => { setMonth(m); setYear(y); }, []);

  const needsMonth = ["remittances", "release"].includes(tab);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>
          Payroll Admin
        </h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          PAN/PF compliance, statutory remittances and payslip release management
        </p>
      </div>

      <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #eee", marginBottom: 24, flexWrap: "wrap" })}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cssClass({
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? ORANGE : "#666",
              borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom: -2,
            })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {needsMonth && <MonthBar month={month} year={year} onChange={handleMonthChange} />}

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "pan" && <PANStatus />}
        {tab === "pf-kyc" && <PFKYCMapping />}
        {tab === "remittances" && <Remittances month={month} year={year} />}
        {tab === "release" && <PayrollRelease month={month} year={year} />}
      </div>
    </div>
  );
}

export default React.memo(AdminPayrollCompliance);
