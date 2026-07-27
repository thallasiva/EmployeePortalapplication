import React, { useMemo } from "react";
import { useFinalSettlement } from "../hooks/useFinalSettlement";
import { fmtINR } from "../utils/formatters";
import { ORANGE } from "../constants";
import { cssClass } from "../../../../utils/classStyles";
import Table from "./Table";

const FinalSettlement = React.memo(function FinalSettlement({ month, year }) {
  const { rows, loading } = useFinalSettlement(month, year);

  const cols = useMemo(() => [
    { key: "emp_code", label: "Emp Code" },
    {
      key: "employee_name", label: "Employee",
      render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim(),
    },
    { key: "department_name", label: "Department" },
    {
      key: "employee_status", label: "Separation Type",
      render: (r) => (
        <span className={cssClass({
          background: "#fee2e2", color: "#991b1b", borderRadius: 4,
          padding: "2px 8px", fontSize: 11, fontWeight: 600,
        })}>
          {r.employee_status || "Separated"}
        </span>
      ),
    },
    {
      key: "date_of_leaving", label: "Last Working Day",
      render: (r) =>
        r.date_of_leaving ? new Date(r.date_of_leaving).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "settlement", label: "Settlement Status",
      render: () => (
        <span className={cssClass({
          background: "#fef3c7", color: "#92400e", borderRadius: 4,
          padding: "2px 8px", fontSize: 11, fontWeight: 600,
        })}>
          PENDING
        </span>
      ),
    },
    { key: "gratuity", label: "Gratuity", right: true, render: () => "—" },
    {
      key: "actions", label: "",
      render: () => (
        <button className={cssClass({
          padding: "4px 12px", background: ORANGE, color: "#fff", border: "none",
          borderRadius: 4, cursor: "pointer", fontSize: 12,
        })}>
          Process
        </button>
      ),
    },
  ], []);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  return (
    <Table cols={cols} rows={rows} emptyMsg="No separated employees found" />
  );
});

export default FinalSettlement;
