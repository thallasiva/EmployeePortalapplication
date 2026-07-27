import React, { useMemo } from "react";
import { useArrears } from "../hooks/useArrears";
import { fmtINR } from "../utils/formatters";
import { ORANGE } from "../constants";
import { cssClass } from "../../../../utils/classStyles";
import Table from "./Table";

const Arrears = React.memo(function Arrears({ year }) {
  const { rows, loading } = useArrears(year);

  const cols = useMemo(() => [
    { key: "emp_code", label: "Emp Code" },
    { key: "employee_name", label: "Employee" },
    {
      key: "prev_effective", label: "Previous From",
      render: (r) =>
        r.prev_effective ? new Date(r.prev_effective).toLocaleDateString("en-IN") : "—",
    },
    {
      key: "curr_effective", label: "Revised From",
      render: (r) =>
        r.curr_effective ? new Date(r.curr_effective).toLocaleDateString("en-IN") : "—",
    },
    { key: "prev_ctc", label: "Previous CTC", right: true, render: (r) => fmtINR(r.prev_ctc) },
    { key: "curr_ctc", label: "Revised CTC", right: true, render: (r) => fmtINR(r.curr_ctc) },
    {
      key: "arrears_diff", label: "Monthly Arrears", right: true,
      render: (r) => (
        <span className={cssClass({ fontWeight: 700, color: ORANGE })}>
          {fmtINR(r.arrears_diff)}
        </span>
      ),
    },
    {
      key: "status", label: "Status",
      render: () => (
        <span className={cssClass({
          background: "#fef3c7", color: "#92400e", borderRadius: 4,
          padding: "2px 8px", fontSize: 11, fontWeight: 600,
        })}>
          PENDING
        </span>
      ),
    },
  ], []);

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  return (
    <Table cols={cols} rows={rows} emptyMsg="No arrears found — no salary revisions detected" />
  );
});

export default Arrears;
