import React, { useMemo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { ORANGE } from "../constants";
import { fmtINR } from "../utils";
import { useForm24QData } from "../hooks/useForm24QData";
import Table from "./Table";

const DUE_DATES = {
  "Q1 (Apr–Jun)": "31-Jul",
  "Q2 (Jul–Sep)": "31-Oct",
  "Q3 (Oct–Dec)": "31-Jan",
  "Q4 (Jan–Mar)": "31-May",
};

const Form24Q = React.memo(function Form24Q({ year }) {
  const { rows, loading } = useForm24QData(year);

  const cols = useMemo(
    () => [
      { key: "quarter", label: "Quarter" },
      { key: "employees", label: "Employees", right: true },
      { key: "slips", label: "Payslips", right: true },
      {
        key: "totalGross",
        label: "Total Salary",
        right: true,
        render: (r) => fmtINR(r.totalGross),
      },
      {
        key: "totalTDS",
        label: "Total TDS",
        right: true,
        render: (r) => (
          <span className={cssClass({ fontWeight: 700, color: ORANGE })}>
            {fmtINR(r.totalTDS)}
          </span>
        ),
      },
      {
        key: "due_date",
        label: "Filing Due",
        render: (r) => DUE_DATES[r.quarter] || "—",
      },
      {
        key: "status",
        label: "Status",
        render: (r) =>
          r.slips > 0 ? (
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
              PENDING FILING
            </span>
          ) : (
            <span
              className={cssClass({
                background: "#f3f4f6",
                color: "#888",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              })}
            >
              NO DATA
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
        Quarterly TDS Return (Form 24Q) — FY {year}-{String(year + 1).slice(2)}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No data" />
    </>
  );
});

export default Form24Q;
