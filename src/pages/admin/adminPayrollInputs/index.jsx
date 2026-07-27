import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { TABS, ORANGE } from "./constants";
import { cssClass } from "../../../utils/classStyles";
import MonthBar from "./components/MonthBar";
import LOPDays from "./components/LOPDays";
import Arrears from "./components/Arrears";
import OvertimeRegister from "./components/OvertimeRegister";
import FinalSettlement from "./components/FinalSettlement";
import StopSalary from "./components/StopSalary";

const AdminPayrollInputs = React.memo(function AdminPayrollInputs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "lop";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const setTab = useCallback((t) => setSearchParams({ tab: t }), [setSearchParams]);
  const handleMonthYearChange = useCallback((m, y) => { setMonth(m); setYear(y); }, []);

  const needsMonth = ["lop", "overtime", "settlement"].includes(tab);
  const needsYear = ["arrears"].includes(tab);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>
          Payroll Inputs
        </h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Manage LOP days, overtime, arrears and salary holds
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

      {(needsMonth || needsYear) && (
        <MonthBar month={month} year={year} onChange={handleMonthYearChange} />
      )}

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "lop" && <LOPDays month={month} year={year} />}
        {tab === "arrears" && <Arrears year={year} />}
        {tab === "overtime" && <OvertimeRegister month={month} year={year} />}
        {tab === "settlement" && <FinalSettlement month={month} year={year} />}
        {tab === "stop" && <StopSalary />}
      </div>
    </div>
  );
});

export default AdminPayrollInputs;
