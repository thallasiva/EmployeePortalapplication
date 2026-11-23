import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips } from "../../../api/payroll.api";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, TABS } from "./shared";
import { MonthBar } from "./MonthBar";
import { QuickStatement } from "./QuickStatement";
import { PayrollStatement } from "./PayrollStatement";
import { CTCPayslip } from "./CTCPayslip";
import { PayrollDiff } from "./PayrollDiff";
function AdminPayrollStatement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "quick";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const setTab = t => setSearchParams({
    tab: t
  });
  const load = useCallback(() => {
    if (tab === "diff") return;
    setLoading(true);
    listPayslips({
      month,
      year,
      limit: 500
    }).then(r => setPayslips(r.data || [])).catch(() => setPayslips([])).finally(() => setLoading(false));
  }, [month, year, tab]);
  useEffect(() => {
    load();
  }, [load]);
  return <div className={cssClass({
    padding: "28px 32px",
    fontFamily: "var(--font-ui)"
  })}>
      {}
      <div className={cssClass({
      marginBottom: 24
    })}>
        <h2 className={cssClass({
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: "#1a1a1a"
      })}>Payroll Reports</h2>
        <p className={cssClass({
        margin: "4px 0 0",
        color: "#888",
        fontSize: 13
      })}>
          Salary statements and payroll verification
        </p>
      </div>
      {}
      <div className={cssClass({
      display: "flex",
      gap: 0,
      borderBottom: "2px solid #eee",
      marginBottom: 24
    })}>
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} className={cssClass({
        padding: "10px 20px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: tab === t.key ? 700 : 500,
        color: tab === t.key ? ORANGE : "#666",
        borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
        marginBottom: -2,
        transition: "all .15s"
      })}>
          {t.label}</button>)}
      </div>
      {}
      {tab !== "diff" && <MonthBar month={month} year={year} onChange={(m, y) => {
      setMonth(m);
      setYear(y);
    }} />}
      {}
      <div className={cssClass({
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #eee",
      padding: 20,
      boxShadow: "0 1px 4px #0000000a"
    })}>
        {loading && tab !== "diff" ? <div className={cssClass({
        padding: 60,
        textAlign: "center",
        color: "#aaa"
      })}>Loading…</div> : <>
            {tab === "quick" && <QuickStatement payslips={payslips} />}
            {tab === "statement" && <PayrollStatement payslips={payslips} />}
            {tab === "ctc" && <CTCPayslip payslips={payslips} />}
            {tab === "diff" && <PayrollDiff month={month} year={year} />}
          </>}
      </div>
    </div>;
}
export { AdminPayrollStatement };
