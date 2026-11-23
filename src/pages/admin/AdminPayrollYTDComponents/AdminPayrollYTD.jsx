import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, TABS } from "./shared";
import { YTDSummary } from "./YTDSummary";
import { PFYTDStatement } from "./PFYTDStatement";
import { ReimbStatement } from "./ReimbStatement";
function AdminPayrollYTD() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "ytd";
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const setTab = t => setSearchParams({
    tab: t
  });
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);
  return <div className={cssClass({
    padding: "28px 32px",
    fontFamily: "var(--font-ui)"
  })}>
      <div className={cssClass({
      marginBottom: 24
    })}>
        <h2 className={cssClass({
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: "#1a1a1a"
      })}>Published Info</h2>
        <p className={cssClass({
        margin: "4px 0 0",
        color: "#888",
        fontSize: 13
      })}>
          Year-to-date earnings, PF contributions and reimbursements
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
        marginBottom: -2
      })}>
          {t.label}</button>)}
      </div>
      {}
      <div className={cssClass({
      display: "flex",
      gap: 10,
      alignItems: "center",
      marginBottom: 20
    })}>
        {tab === "reimb" && <select value={month} onChange={e => setMonth(Number(e.target.value))} className={cssClass({
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #ddd",
        fontSize: 14
      })}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>}
        <select value={year} onChange={e => setYear(Number(e.target.value))} className={cssClass({
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #ddd",
        fontSize: 14
      })}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className={cssClass({
      background: "#fff",
      borderRadius: 10,
      border: "1px solid #eee",
      padding: 20,
      boxShadow: "0 1px 4px #0000000a"
    })}>
        {tab === "ytd" && <YTDSummary year={year} />}
        {tab === "pf-ytd" && <PFYTDStatement year={year} />}
        {tab === "reimb" && <ReimbStatement month={month} year={year} />}
      </div>
    </div>;
}
export { AdminPayrollYTD };
