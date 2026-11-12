import React, { useMemo, useState } from "react";
import { AlertTriangle, Download, IndianRupee, Users, Wallet, Building2, CircleDollarSign, TrendingDown, TrendingUp, BadgeCheck, PlayCircle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import Card from "./Card";
const formatMoney = (value, currency = "INR", compact = false) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency, notation: compact ? "compact" : "standard", maximumFractionDigits: compact ? 1 : 2,
}).format(Number(value || 0));

const csvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};
const EMPTY_ROWS = [];

function downloadReport(data, label) {
  const lines = [
    ["Section", "Name", "Employees", "Gross", "Deductions", "Net", "Employer Cost"],
    ...data.departments.map((row) => ["Department", row.department, row.employees, row.gross, "", row.net, row.employerContributions]),
    ...data.components.map((row) => [row.category, row.label, "", row.category === "Earning" ? row.amount : "", row.category === "Deduction" ? row.amount : "", "", row.category === "Employer Contribution" ? row.amount : ""]),
  ];
  const csv = lines.map((row) => row.map(csvValue).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `payroll-dashboard-${label.replace(/\s+/g, "-").toLowerCase()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value, detail, icon: Icon, tint = "#fff7ed", accent = "#e87500" }) {
  return (
    <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, minWidth: 0, border: "1px solid #eef0f3", borderRadius: 12, background: "#fff", padding: 13 })}>
      <span className={cssClass({ width: 34, height: 34, flex: "0 0 34px", display: "grid", placeItems: "center", borderRadius: 10, color: accent, background: tint })}><Icon size={17} /></span>
      <span className={cssClass({ minWidth: 0 })}>
        <span className={cssClass({ display: "block", color: "#667085", fontSize: 11, fontWeight: 650 })}>{label}</span>
        <span className={cssClass({ display: "block", color: "#182230", fontSize: 18, fontWeight: 850, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" })}>{value}</span>
        {detail && <span className={cssClass({ display: "block", color: "#98a2b3", fontSize: 10, marginTop: 1 })}>{detail}</span>}
      </span>
    </div>
  );
}

export default function PayrollDashboardInsights({ data, loading, periodLabel }) {
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [componentType, setComponentType] = useState("Earning");
  const totals = data?.totals || {};
  const currency = data?.currency || "INR";
  const departments = data?.departments || EMPTY_ROWS;
  const trends = data?.trends || EMPTY_ROWS;
  const components = useMemo(() => (data?.components || []).filter((item) => item.category === componentType), [data, componentType]);
  const visibleDepartments = useMemo(() => departments.filter((row) => row.department.toLowerCase().includes(departmentSearch.trim().toLowerCase())), [departments, departmentSearch]);
  const maxGross = Math.max(1, ...trends.map((row) => Number(row.gross || 0)));
  const previous = useMemo(() => {
    const currentMonth = Number(data?.period?.month);
    const currentYear = Number(data?.period?.year);
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return trends.find((row) => Number(row.month) === previousMonth && Number(row.year) === previousYear) || null;
  }, [data?.period?.month, data?.period?.year, trends]);
  const grossChange = previous ? Number(totals.gross || 0) - Number(previous.gross || 0) : null;
  const netChange = previous ? Number(totals.net || 0) - Number(previous.net || 0) : null;
  const pct = (change, base) => base ? `${change > 0 ? "+" : ""}${((change / base) * 100).toFixed(1)}%` : "—";

  if (loading && !data) return <Card title="Payroll insights" subtitle="Loading this company's payroll totals…"><div className={cssClass({ color: "#667085", fontSize: 13 })}>Loading payroll data…</div></Card>;
  if (!data) return <Card title="Payroll insights" subtitle="Live payroll metrics could not be loaded"><div className={cssClass({ color: "#667085", fontSize: 13 })}>Refresh the page or check your payroll access and API connection.</div></Card>;

  return (
    <div className={cssClass({ marginBottom: 16 })}>
      <Card title="Payroll insights" subtitle={`Company payroll data · ${periodLabel}`} icon={<IndianRupee size={16} color="#e87500" />} right={
        <button type="button" onClick={() => downloadReport(data, periodLabel)} className={cssClass({ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #f2d6bf", borderRadius: 8, padding: "7px 10px", background: "#fffaf5", color: "#b45309", fontSize: 11, fontWeight: 750, cursor: "pointer" })}><Download size={13} /> Export CSV</button>
      }>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 9, marginBottom: 14 })}>
          <Metric label="Total employees" value={totals.totalEmployees ?? 0} detail="Employees in this company" icon={Users} />
          <Metric label="Payroll eligible" value={totals.eligibleEmployees ?? 0} detail="Employees with payable salary" icon={BadgeCheck} />
          <Metric label="Gross payroll" value={formatMoney(totals.gross, currency, true)} detail="Current month" icon={IndianRupee} />
          <Metric label="Net payable" value={formatMoney(totals.net, currency, true)} detail="After deductions" icon={Wallet} tint="#f0fdf4" accent="#15803d" />
          <Metric label="Total deductions" value={formatMoney(totals.deductions, currency, true)} detail="Employee deductions" icon={TrendingDown} />
          <Metric label="Employer contribution" value={formatMoney(totals.employerContributions, currency, true)} detail="Company contribution total" icon={Building2} tint="#f0fdf4" accent="#15803d" />
          <Metric label="Pending approvals" value={totals.pendingApprovals ?? 0} detail="Payroll runs awaiting review" icon={AlertTriangle} />
          <Metric label="Pending bank payments" value={totals.pendingPayments ?? 0} detail="Awaiting bank reconciliation" icon={Wallet} />
          <Metric label="Failed payments" value={totals.failedPayments ?? 0} detail="Require correction or retry" icon={CircleDollarSign} tint="#fff1f2" accent="#be123c" />
          <Metric label="Payroll status" value={String(totals.payrollStatus || "NOT_STARTED").replace(/_/g, " ")} detail="Selected payroll period" icon={PlayCircle} />
        </div>
        {!totals.paymentTrackingAvailable && <div className={cssClass({ marginBottom: 12, padding: "9px 11px", borderRadius: 9, background: "#fff7ed", color: "#9a3412", fontSize: 11.5 })}>Payment reconciliation storage is not installed yet. Apply database migration 066 to enable these counts.</div>}
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 9, marginBottom: 12 })}>
          <div className={cssClass({ border: "1px solid #eef0f3", borderRadius: 10, background: "#fff", padding: "10px 12px" })}><div className={cssClass({ color: "#667085", fontSize: 10.5, fontWeight: 700 })}>Gross payroll variance vs previous month</div><div className={cssClass({ display: "flex", alignItems: "center", gap: 7, marginTop: 5, color: grossChange == null ? "#98a2b3" : grossChange > 0 ? "#b45309" : "#15803d", fontSize: 14, fontWeight: 800 })}><TrendingUp size={15} />{grossChange == null ? "No previous run" : `${formatMoney(grossChange, currency)} (${pct(grossChange, Number(previous.gross || 0))})`}</div></div>
          <div className={cssClass({ border: "1px solid #eef0f3", borderRadius: 10, background: "#fff", padding: "10px 12px" })}><div className={cssClass({ color: "#667085", fontSize: 10.5, fontWeight: 700 })}>Net payable variance vs previous month</div><div className={cssClass({ display: "flex", alignItems: "center", gap: 7, marginTop: 5, color: netChange == null ? "#98a2b3" : netChange > 0 ? "#b45309" : "#15803d", fontSize: 14, fontWeight: 800 })}><TrendingUp size={15} />{netChange == null ? "No previous run" : `${formatMoney(netChange, currency)} (${pct(netChange, Number(previous.net || 0))})`}</div></div>
        </div>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 12 })}>
          <Card title="Monthly payroll trend" subtitle="Gross and net payroll from saved payslips" pad={13}>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 4, color: "#667085", fontSize: 9.5 })}><span><b className={cssClass({ color: "#e87500" })}>■</b> Gross</span><span><b className={cssClass({ color: "#16a34a" })}>■</b> Net</span></div>
            {trends.length ? <div className={cssClass({ display: "flex", alignItems: "flex-end", gap: 9, height: 150, overflowX: "auto", paddingTop: 6 })}>
              {trends.map((row) => <div key={`${row.year}-${row.month}`} title={`${row.monthLabel} ${row.year}: Gross ${formatMoney(row.gross, currency)}, Net ${formatMoney(row.net, currency)}`} className={cssClass({ minWidth: 34, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%", gap: 5 })}>
                <span className={cssClass({ color: "#667085", fontSize: 9, whiteSpace: "nowrap" })}>{formatMoney(row.gross, currency, true)}</span>
                <span className={cssClass({ width: "100%", maxWidth: 38, height: "100%", minHeight: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3 })}>
                  <i title={`Gross ${formatMoney(row.gross, currency)}`} className={cssClass({ width: 14, minHeight: 3, height: `${Math.max(3, (Number(row.gross || 0) / maxGross) * 100)}%`, borderRadius: "5px 5px 1px 1px", background: "linear-gradient(180deg,#f59e0b,#e87500)" })} />
                  <i title={`Net ${formatMoney(row.net, currency)}`} className={cssClass({ width: 14, minHeight: 3, height: `${Math.max(3, (Number(row.net || 0) / maxGross) * 100)}%`, borderRadius: "5px 5px 1px 1px", background: "linear-gradient(180deg,#4ade80,#16a34a)" })} />
                </span>
                <span className={cssClass({ color: "#667085", fontSize: 10 })}>{row.monthLabel}</span>
              </div>)}
            </div> : <p className={cssClass({ color: "#98a2b3", fontSize: 12, margin: 0 })}>Saved payroll history will appear here.</p>}
          </Card>
          <Card title="Salary component breakdown" subtitle="Calculated component totals" pad={13}>
            <div className={cssClass({ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" })}>
              {["Earning", "Deduction", "Employer Contribution"].map((type) => <button key={type} type="button" onClick={() => setComponentType(type)} className={cssClass({ border: componentType === type ? "1px solid #e87500" : "1px solid #e5e7eb", borderRadius: 7, padding: "5px 8px", background: componentType === type ? "#fff7ed" : "#fff", color: componentType === type ? "#b45309" : "#667085", fontSize: 10, fontWeight: 700, cursor: "pointer" })}>{type}</button>)}
            </div>
            <div className={cssClass({ display: "grid", gap: 8, maxHeight: 130, overflowY: "auto" })}>
              {components.slice(0, 8).map((item) => <div key={`${item.category}-${item.code || item.label}`} className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 11.5 })}><span className={cssClass({ color: "#475467", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{item.label}</span><strong className={cssClass({ color: "#182230", whiteSpace: "nowrap" })}>{formatMoney(item.amount, currency, true)}</strong></div>)}
              {!components.length && <span className={cssClass({ color: "#98a2b3", fontSize: 11 })}>No calculated components for this period.</span>}
            </div>
          </Card>
        </div>
        <div className={cssClass({ marginTop: 12 })}>
          <Card title="Department-wise salary expense" subtitle="Actual calculated payroll by department" pad={13}>
            <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginBottom: 8 })}><input type="search" value={departmentSearch} onChange={(event) => setDepartmentSearch(event.target.value)} placeholder="Search department" aria-label="Search department" className={cssClass({ width: 210, border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 9px", color: "#344054", fontSize: 11 })} /></div>
            <div className={cssClass({ overflowX: "auto" })}>
              <table className={cssClass({ width: "100%", borderCollapse: "collapse", minWidth: 560 })}>
                <thead><tr>{["Department", "Employees", "Gross", "Net payable", "Employer cost"].map((heading) => <th key={heading} className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #eef0f3", textAlign: heading === "Department" ? "left" : "right", color: "#667085", fontSize: 10, fontWeight: 750 })}>{heading}</th>)}</tr></thead>
                <tbody>{visibleDepartments.map((row) => <tr key={row.department}><td className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #f2f4f7", color: "#344054", fontSize: 11.5, fontWeight: 650 })}>{row.department}</td><td className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #f2f4f7", textAlign: "right", color: "#475467", fontSize: 11.5 })}>{row.employees}</td><td className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #f2f4f7", textAlign: "right", color: "#475467", fontSize: 11.5 })}>{formatMoney(row.gross, currency)}</td><td className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #f2f4f7", textAlign: "right", color: "#475467", fontSize: 11.5 })}>{formatMoney(row.net, currency)}</td><td className={cssClass({ padding: "8px 7px", borderBottom: "1px solid #f2f4f7", textAlign: "right", color: "#475467", fontSize: 11.5 })}>{formatMoney(row.employerContributions, currency)}</td></tr>)}
                  {!visibleDepartments.length && <tr><td colSpan={5} className={cssClass({ padding: 14, textAlign: "center", color: "#98a2b3", fontSize: 11.5 })}>No departments match this search.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
