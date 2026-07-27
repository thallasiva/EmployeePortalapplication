import React, { useState, useEffect } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { listEmployees } from "../../../../api/employee.api";
import PayrollTable from "./PayrollTable";

const cols = [
  { key: "emp_code", label: "Emp Code" },
  {
    key: "name",
    label: "Employee",
    render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim(),
  },
  { key: "department_name", label: "Department" },
  {
    key: "pan_number",
    label: "PAN Number",
    render: (r) =>
      r.pan_number ? (
        <code className={cssClass({ background: "#f0fdf4", color: "#166534", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" })}>
          {r.pan_number}
        </code>
      ) : (
        <span className={cssClass({ color: "#dc2626", fontWeight: 600 })}>Not Linked</span>
      ),
  },
  {
    key: "uan_number",
    label: "UAN Number",
    render: (r) =>
      r.uan_number ? (
        <code className={cssClass({ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: 3 })}>
          {r.uan_number}
        </code>
      ) : "—",
  },
  {
    key: "account_number",
    label: "Bank Account",
    render: (r) => (r.account_number ? `****${String(r.account_number).slice(-4)}` : "—"),
  },
  { key: "bank_name", label: "Bank" },
  {
    key: "pan_status",
    label: "PAN Status",
    render: (r) =>
      r.pan_number ? (
        <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>VERIFIED</span>
      ) : (
        <span className={cssClass({ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>MISSING</span>
      ),
  },
];

function PANStatus() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmployees({ status: "Active", limit: 500 })
      .then((r) => setRows(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  const missing = rows.filter((r) => !r.pan_number).length;
  return (
    <>
      {missing > 0 && (
        <div className={cssClass({ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991b1b" })}>
          ⚠️ {missing} employee{missing > 1 ? "s" : ""} missing PAN number — TDS deduction may be at higher rate (20%)
        </div>
      )}
      <PayrollTable cols={cols} rows={rows} emptyMsg="No employees found" />
    </>
  );
}

export default React.memo(PANStatus);
