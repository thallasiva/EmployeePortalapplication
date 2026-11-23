import React, { useState, useEffect } from "react";
import { listPayslips } from "../../../api/payroll.api";
import { cssClass } from "../../../utils/classStyles";
import { fmtINR } from "./shared";
import { Table } from "./Table";
function PayrollDiff({
  month,
  year
}) {
  const [prevSlips, setPrevSlips] = useState([]);
  const [currSlips, setCurrSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    Promise.all([listPayslips({
      month: prevM,
      year: prevY,
      limit: 500
    }), listPayslips({
      month,
      year,
      limit: 500
    })]).then(([p, c]) => {
      setPrevSlips(p.data || []);
      setCurrSlips(c.data || []);
    }).finally(() => setLoading(false));
  }, [month, year]);
  if (loading) return <div className={cssClass({
    padding: 40,
    textAlign: "center",
    color: "#aaa"
  })}>Loading…</div>;
  const prevMap = {};
  prevSlips.forEach(r => {
    prevMap[r.employee_id] = r;
  });
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const prevLabel = `${MONTH_NAMES[(month === 1 ? 12 : month) - 2]} ${month === 1 ? year - 1 : year}`;
  const currLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const rows = currSlips.map(c => {
    const p = prevMap[c.employee_id];
    const diff = Number(c.net_pay || 0) - Number(p?.net_pay || 0);
    return {
      ...c,
      prev_net: p?.net_pay || 0,
      diff
    };
  });
  const cols = [{
    key: "emp_code",
    label: "Emp Code"
  }, {
    key: "employee_name",
    label: "Employee"
  }, {
    key: "prev_net",
    label: `Net (${prevLabel})`,
    right: true,
    render: r => fmtINR(r.prev_net)
  }, {
    key: "net_pay",
    label: `Net (${currLabel})`,
    right: true,
    render: r => fmtINR(r.net_pay)
  }, {
    key: "diff",
    label: "Difference",
    right: true,
    render: r => {
      const d = r.diff;
      const clr = d > 0 ? "#16a34a" : d < 0 ? "#dc2626" : "#888";
      return <span className={cssClass({
        color: clr,
        fontWeight: 600
      })}>{d >= 0 ? "+" : ""}{fmtINR(d)}</span>;
    }
  }, {
    key: "lop_days",
    label: "LOP Days",
    right: true
  }];
  return <Table cols={cols} rows={rows} emptyMsg="No data for this month" />;
}
export { PayrollDiff };
