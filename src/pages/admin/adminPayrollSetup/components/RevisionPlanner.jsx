import React, { useMemo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { fmtINR } from "../utils";
import { useRevisionData } from "../hooks/useRevisionData";
import Table from "./Table";

const RevisionPlanner = React.memo(function RevisionPlanner() {
  const { revisions, loading } = useRevisionData();

  const cols = useMemo(
    () => [
      { key: "emp_code", label: "Emp Code" },
      { key: "employee_name", label: "Employee" },
      {
        key: "revision_date",
        label: "Effective Date",
        render: (r) =>
          r.revision_date ? new Date(r.revision_date).toLocaleDateString("en-IN") : "—",
      },
      {
        key: "prev_ctc",
        label: "Previous CTC",
        right: true,
        render: (r) =>
          r.is_initial ? (
            <span className={cssClass({ color: "#aaa" })}>Initial</span>
          ) : (
            fmtINR(r.prev_ctc)
          ),
      },
      {
        key: "new_ctc",
        label: "Revised CTC",
        right: true,
        render: (r) => (
          <span className={cssClass({ fontWeight: 600 })}>{fmtINR(r.new_ctc)}</span>
        ),
      },
      {
        key: "increment",
        label: "Increment",
        right: true,
        render: (r) =>
          r.is_initial ? (
            "—"
          ) : (
            <span
              className={cssClass({
                color: r.increment >= 0 ? "#16a34a" : "#dc2626",
                fontWeight: 600,
              })}
            >
              {r.increment >= 0 ? "+" : ""}
              {fmtINR(r.increment)}
            </span>
          ),
      },
      {
        key: "increment_pct",
        label: "Hike %",
        right: true,
        render: (r) =>
          r.is_initial ? (
            "—"
          ) : (
            <span
              className={cssClass({
                background: Number(r.increment_pct) > 0 ? "#dcfce7" : "#fee2e2",
                color: Number(r.increment_pct) > 0 ? "#166534" : "#dc2626",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              })}
            >
              {r.increment_pct}%
            </span>
          ),
      },
    ],
    []
  );

  if (loading)
    return (
      <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>
    );

  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        Salary revision history across all employees
      </div>
      <Table cols={cols} rows={revisions} emptyMsg="No salary revisions found" />
    </>
  );
});

export default RevisionPlanner;
