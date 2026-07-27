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
  {
    key: "pf_number",
    label: "PF Account No.",
    render: (r) =>
      r.pf_number ? (
        <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#f0fdf4", color: "#166534" })}>
          {r.pf_number}
        </code>
      ) : (
        <span className={cssClass({ color: "#dc2626" })}>Not Available</span>
      ),
  },
  {
    key: "uan_number",
    label: "UAN Number",
    render: (r) =>
      r.uan_number ? (
        <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#eff6ff", color: "#1e40af" })}>
          {r.uan_number}
        </code>
      ) : (
        <span className={cssClass({ color: "#dc2626" })}>Not Linked</span>
      ),
  },
  {
    key: "pf_join_date",
    label: "PF Join Date",
    render: (r) => (r.pf_join_date ? new Date(r.pf_join_date).toLocaleDateString("en-IN") : "—"),
  },
  {
    key: "esi_number",
    label: "ESI Number",
    render: (r) =>
      r.esi_number ? (
        <code className={cssClass({ padding: "2px 6px", borderRadius: 3, background: "#faf5ff", color: "#6b21a8" })}>
          {r.esi_number}
        </code>
      ) : "—",
  },
  {
    key: "kyc_status",
    label: "KYC Status",
    render: (r) =>
      r.uan_number && r.pan_number ? (
        <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>APPROVED</span>
      ) : (
        <span className={cssClass({ background: "#fef3c7", color: "#92400e", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>PENDING</span>
      ),
  },
];

function PFKYCMapping() {
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
  return <PayrollTable cols={cols} rows={rows} emptyMsg="No employees found" />;
}

export default React.memo(PFKYCMapping);
