import React, { useMemo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { ORANGE } from "../constants";
import { fmtINR } from "../utils";
import { useForm16Data } from "../hooks/useForm16Data";
import Table from "./Table";

const Form16 = React.memo(function Form16({ year }) {
  const { rows, loading } = useForm16Data(year);

  const cols = useMemo(
    () => [
      { key: "emp_code", label: "Emp Code" },
      { key: "employee_name", label: "Employee Name" },
      {
        key: "pan_number",
        label: "PAN",
        render: (r) =>
          r.pan_number ? (
            <code
              className={cssClass({
                fontSize: 12,
                background: "#f0fdf4",
                color: "#166534",
                padding: "2px 6px",
                borderRadius: 3,
              })}
            >
              {r.pan_number}
            </code>
          ) : (
            <span className={cssClass({ color: "#dc2626" })}>Not Linked</span>
          ),
      },
      {
        key: "fy",
        label: "Financial Year",
        render: () => `${year}-${String(year + 1).slice(2)}`,
      },
      {
        key: "total_gross",
        label: "Gross Salary",
        right: true,
        render: (r) => fmtINR(r.total_gross),
      },
      {
        key: "total_pf",
        label: "PF Deducted",
        right: true,
        render: (r) => fmtINR(r.total_pf),
      },
      {
        key: "estimated_tds",
        label: "TDS Deducted",
        right: true,
        render: (r) => (
          <span className={cssClass({ fontWeight: 700, color: ORANGE })}>
            {fmtINR(r.estimated_tds)}
          </span>
        ),
      },
      { key: "months", label: "Months Worked", right: true },
      {
        key: "status",
        label: "Form 16 Status",
        render: (r) =>
          r.months >= 12 ? (
            <span
              className={cssClass({
                background: "#dcfce7",
                color: "#166534",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              })}
            >
              READY
            </span>
          ) : (
            <span
              className={cssClass({
                background: "#fef3c7",
                color: "#92400e",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              })}
            >
              PARTIAL ({r.months}/12)
            </span>
          ),
      },
      {
        key: "download",
        label: "",
        render: (r) => (
          <button
            disabled={r.months === 0}
            className={cssClass({
              padding: "4px 12px",
              background: r.months > 0 ? ORANGE : "#ddd",
              color: r.months > 0 ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 4,
              cursor: r.months > 0 ? "pointer" : "default",
              fontSize: 12,
            })}
          >
            Download
          </button>
        ),
      },
    ],
    [year]
  );

  if (loading)
    return (
      <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>
    );

  return (
    <>
      <div className={cssClass({ marginBottom: 12, fontSize: 13, color: "#666" })}>
        Form 16 — TDS Certificate for FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No payslip data for this year" />
    </>
  );
});

export default Form16;
