/**
 * AdminPayrollInputs — Payroll Inputs section
 * Tabs: LOP Days | Arrears | Overtime Register | Final Settlement | Stop Salary
 */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listPayslips, listSalaryStructures } from "../../api/payroll.api";
import { listEmployees } from "../../api/employee.api";import { cssClass, joinClasses } from "../../utils/classStyles";

const ORANGE = "#f18200";
const TABS = [
{ key: "lop", label: "Employee LOP Days" },
{ key: "arrears", label: "Arrears" },
{ key: "overtime", label: "Overtime Register" },
{ key: "settlement", label: "Final Settlement" },
{ key: "stop", label: "Stop Salary Processing" }];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtINR = (v) =>
"₹ " + Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });

function MonthBar({ month, year, onChange }) {
  const now = new Date();
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) years.push(y);
  return (
    <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 })}>
      <select value={month} onChange={(e) => onChange(Number(e.target.value), year)} className={cssClass(
        { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>
      <select value={year} onChange={(e) => onChange(month, Number(e.target.value))} className={cssClass(
        { padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14 })}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>);

}

function Table({ cols, rows, emptyMsg = "No data" }) {
  if (!rows.length) return (
    <div className={cssClass({ textAlign: "center", padding: 60, color: "#aaa", fontSize: 14 })}>{emptyMsg}</div>);

  return (
    <div className={cssClass({ overflowX: "auto" })}>
      <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
        <thead>
          <tr className={cssClass({ background: "#fafafa" })}>
            {cols.map((c) =>
            <th key={c.key} className={cssClass({
              padding: "10px 12px", textAlign: c.right ? "right" : "left",
              borderBottom: "2px solid #eee", color: "#555", fontWeight: 600, whiteSpace: "nowrap"
            })}>{c.label}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) =>
          <tr key={i} className={cssClass({ background: i % 2 === 0 ? "#fff" : "#fafafa" })}>
              {cols.map((c) =>
            <td key={c.key} className={cssClass({
              padding: "9px 12px", borderBottom: "1px solid #f0f0f0",
              textAlign: c.right ? "right" : "left", color: "#333", whiteSpace: "nowrap"
            })}>
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
            )}
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

/* ── LOP DAYS ─────────────────────────────────────────────────── */
function LOPDays({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 }).
    then((r) => setRows(r.data || [])).
    finally(() => setLoading(false));
  }, [month, year]);

  const totalLOP = rows.reduce((s, r) => s + Number(r.lop_days || 0), 0);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee Name" },
  { key: "department_name", label: "Department" },
  { key: "working_days", label: "Working Days", right: true },
  { key: "paid_days", label: "Paid Days", right: true },
  { key: "lop_days", label: "LOP Days", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 600, color: Number(r.lop_days) > 0 ? "#dc2626" : "#333" })}>
        {r.lop_days || 0}
      </span>
  },
  { key: "lop_deduction", label: "LOP Deduction", right: true, render: (r) => {
      const daily = Number(r.gross_earnings || 0) / Math.max(Number(r.working_days || 26), 1);
      return <span className={cssClass({ color: "#dc2626" })}>{fmtINR(daily * Number(r.lop_days || 0))}</span>;
    } },
  { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return (
    <>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this month" />
      {rows.length > 0 &&
      <div className={cssClass({ textAlign: "right", padding: "10px 0", fontSize: 13, color: "#888" })}>
          Total LOP Days this month: <strong className={cssClass({ color: "#dc2626" })}>{totalLOP}</strong>
        </div>
      }
    </>);

}

/* ── ARREARS ──────────────────────────────────────────────────── */
function Arrears({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Arrears = employees with multiple salary structures (revised during year)
    listSalaryStructures({ limit: 500 }).
    then((r) => {
      const structs = r.data || [];
      // Group by employee, find those with >1 revision
      const map = {};
      structs.forEach((s) => {
        if (!map[s.employee_id]) {
          map[s.employee_id] = {
            employee_id: s.employee_id,
            emp_code: s.emp_code,
            employee_name: s.employee_name || s.emp_name,
            revisions: []
          };
        }
        map[s.employee_id].revisions.push(s);
      });
      const arrears = [];
      Object.values(map).forEach((emp) => {
        const sorted = emp.revisions.sort((a, b) =>
        new Date(a.effective_from || 0) - new Date(b.effective_from || 0));
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          const diff = Number(curr.net_pay || curr.ctc || 0) - Number(prev.net_pay || prev.ctc || 0);
          if (diff > 0) {
            arrears.push({
              emp_code: emp.emp_code,
              employee_name: emp.employee_name,
              prev_effective: prev.effective_from,
              curr_effective: curr.effective_from,
              prev_ctc: prev.ctc || prev.gross,
              curr_ctc: curr.ctc || curr.gross,
              arrears_diff: diff
            });
          }
        }
      });
      setRows(arrears);
    }).
    finally(() => setLoading(false));
  }, [year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "prev_effective", label: "Previous From", render: (r) => r.prev_effective ? new Date(r.prev_effective).toLocaleDateString("en-IN") : "—" },
  { key: "curr_effective", label: "Revised From", render: (r) => r.curr_effective ? new Date(r.curr_effective).toLocaleDateString("en-IN") : "—" },
  { key: "prev_ctc", label: "Previous CTC", right: true, render: (r) => fmtINR(r.prev_ctc) },
  { key: "curr_ctc", label: "Revised CTC", right: true, render: (r) => fmtINR(r.curr_ctc) },
  { key: "arrears_diff", label: "Monthly Arrears", right: true, render: (r) =>
    <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.arrears_diff)}</span>
  },
  { key: "status", label: "Status", render: () =>
    <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PENDING</span>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No arrears found — no salary revisions detected" />;
}

/* ── OVERTIME REGISTER ────────────────────────────────────────── */
function OvertimeRegister({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Overtime derived: paid_days > working_days indicates OT or extra days
    listPayslips({ month, year, limit: 500 }).
    then((r) => {
      const slips = r.data || [];
      // Show all employees; OT = paid_days >= working_days && working_days > 0
      const withOT = slips.map((s) => {
        const ot_days = Math.max(0, Number(s.paid_days || 0) - Number(s.working_days || 0));
        const daily = Number(s.gross_earnings || 0) / Math.max(Number(s.working_days || 26), 1);
        return { ...s, ot_days, ot_amount: +(daily * ot_days * 2).toFixed(2) }; // 2x rate
      });
      setRows(withOT);
    }).
    finally(() => setLoading(false));
  }, [month, year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee" },
  { key: "department_name", label: "Department" },
  { key: "working_days", label: "Scheduled Days", right: true },
  { key: "paid_days", label: "Worked Days", right: true },
  { key: "ot_days", label: "OT Days", right: true, render: (r) =>
    <span className={cssClass({ color: r.ot_days > 0 ? ORANGE : "#888", fontWeight: r.ot_days > 0 ? 700 : 400 })}>
        {r.ot_days}
      </span>
  },
  { key: "ot_amount", label: "OT Amount (2x)", right: true, render: (r) =>
    <span className={cssClass({ color: r.ot_days > 0 ? ORANGE : "#888" })}>{fmtINR(r.ot_amount)}</span>
  },
  { key: "net_pay", label: "Net Pay", right: true, render: (r) => fmtINR(r.net_pay) }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No payslip data for this month" />;
}

/* ── FINAL SETTLEMENT ─────────────────────────────────────────── */
function FinalSettlement({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listEmployees({ has_left: true, limit: 500 }).
    then((r) => {
      const emps = r.data || [];
      // Filter for this month (date_of_leaving in month/year if field available)
      setRows(emps.filter((e) => e.has_left_organization || e.employee_status === "Resigned" || e.employee_status === "Terminated"));
    }).
    catch(() => {
      // Fallback: show separated employees
      listEmployees({ limit: 500 }).
      then((r) => {
        const emps = r.data || [];
        setRows(emps.filter((e) => e.employee_status === "Resigned" || e.employee_status === "Terminated" || e.has_left_organization));
      }).
      finally(() => setLoading(false));
      setLoading(false);
    }).
    finally(() => setLoading(false));
  }, [month, year]);

  const cols = [
  { key: "emp_code", label: "Emp Code" },
  { key: "employee_name", label: "Employee", render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
  { key: "department_name", label: "Department" },
  { key: "employee_status", label: "Separation Type", render: (r) =>
    <span className={cssClass({
      background: "#fee2e2", color: "#991b1b", borderRadius: 4,
      padding: "2px 8px", fontSize: 11, fontWeight: 600
    })}>{r.employee_status || "Separated"}</span>
  },
  { key: "date_of_leaving", label: "Last Working Day", render: (r) =>
    r.date_of_leaving ? new Date(r.date_of_leaving).toLocaleDateString("en-IN") : "—"
  },
  { key: "settlement", label: "Settlement Status", render: () =>
    <span className={cssClass({
      background: "#fef3c7", color: "#92400e", borderRadius: 4,
      padding: "2px 8px", fontSize: 11, fontWeight: 600
    })}>PENDING</span>
  },
  { key: "gratuity", label: "Gratuity", right: true, render: () => "—" },
  { key: "actions", label: "", render: () =>
    <button className={cssClass({
      padding: "4px 12px", background: ORANGE, color: "#fff", border: "none",
      borderRadius: 4, cursor: "pointer", fontSize: 12
    })}>Process</button>
  }];


  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  return <Table cols={cols} rows={rows} emptyMsg="No separated employees found" />;
}

/* ── STOP SALARY ──────────────────────────────────────────────── */
function StopSalary() {
  const [emps, setEmps] = useState([]);
  const [stopped, setStopped] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 }).
    then((r) => setEmps(r.data || [])).
    finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;

  return (
    <>
      <div className={cssClass({
        background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8,
        padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400e"
      })}>
        ⚠️ Stopping salary will exclude the employee from payroll processing for the selected month. This action can be reversed before payroll is finalized.
      </div>
      <div className={cssClass({ overflowX: "auto" })}>
        <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
          <thead>
            <tr className={cssClass({ background: "#fafafa" })}>
              {["Emp Code", "Employee", "Department", "Designation", "Status", "Action"].map((h) =>
              <th key={h} className={cssClass({ padding: "10px 12px", borderBottom: "2px solid #eee", color: "#555", fontWeight: 600, textAlign: "left" })}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {emps.map((e, i) =>
            <tr key={e.employee_id} className={cssClass({ background: i % 2 === 0 ? "#fff" : "#fafafa" })}>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>{e.emp_code}</td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {`${e.first_name || ""} ${e.last_name || ""}`.trim()}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>{e.department_name || "—"}</td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>{e.emp_job_title || "—"}</td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {stopped[e.employee_id] ?
                <span className={cssClass({ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>STOPPED</span> :

                <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>ACTIVE</span>
                }
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  <button
                  onClick={() => setStopped((prev) => ({ ...prev, [e.employee_id]: !prev[e.employee_id] }))} className={cssClass(
                    {
                      padding: "4px 14px", border: "none", borderRadius: 4, cursor: "pointer",
                      fontSize: 12, fontWeight: 600,
                      background: stopped[e.employee_id] ? "#dcfce7" : "#fee2e2",
                      color: stopped[e.employee_id] ? "#166534" : "#991b1b"
                    })}>
                  
                    {stopped[e.employee_id] ? "Resume" : "Stop"}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>);

}

/* ── MAIN ────────────────────────────────────────────────────── */
export default function AdminPayrollInputs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "lop";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const setTab = (t) => setSearchParams({ tab: t });
  const needsMonth = ["lop", "overtime", "settlement"].includes(tab);
  const needsYear = ["arrears"].includes(tab);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>Payroll Inputs</h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Manage LOP days, overtime, arrears and salary holds
        </p>
      </div>

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #eee", marginBottom: 24, flexWrap: "wrap" })}>
        {TABS.map((t) =>
        <button key={t.key} onClick={() => setTab(t.key)} className={cssClass(
          {
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? ORANGE : "#666",
            borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
            marginBottom: -2
          })}>
          {t.label}</button>
        )}
      </div>

      {/* Filters */}
      {(needsMonth || needsYear) &&
      <MonthBar month={month} year={year} onChange={(m, y) => {setMonth(m);setYear(y);}} />
      }

      <div className={cssClass({ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: 20, boxShadow: "0 1px 4px #0000000a" })}>
        {tab === "lop" && <LOPDays month={month} year={year} />}
        {tab === "arrears" && <Arrears year={year} />}
        {tab === "overtime" && <OvertimeRegister month={month} year={year} />}
        {tab === "settlement" && <FinalSettlement month={month} year={year} />}
        {tab === "stop" && <StopSalary />}
      </div>
    </div>);

}
