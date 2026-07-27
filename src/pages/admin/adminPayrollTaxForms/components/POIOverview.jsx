import React, { useMemo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { ORANGE } from "../constants";
import { fmtINR } from "../utils";
import { usePOIData } from "../hooks/usePOIData";
import Table from "./Table";

const POIOverview = React.memo(function POIOverview({ year }) {
  const { rows, loading } = usePOIData(year);

  const submitted = useMemo(() => rows.filter((r) => r.declaration).length, [rows]);
  const withPOI = useMemo(
    () => rows.filter((r) => r.declaration?.poi_status).length,
    [rows]
  );

  const stats = useMemo(
    () => [
      { label: "Total Employees", value: rows.length, color: ORANGE },
      { label: "Declarations Submitted", value: submitted, color: "#2563eb" },
      { label: "POI Uploaded", value: withPOI, color: "#16a34a" },
      { label: "Pending POI", value: submitted - withPOI, color: "#dc2626" },
    ],
    [rows.length, submitted, withPOI]
  );

  const cols = useMemo(
    () => [
      { key: "emp_code", label: "Emp Code" },
      {
        key: "name",
        label: "Employee",
        render: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim(),
      },
      { key: "department_name", label: "Department" },
      {
        key: "decl_status",
        label: "IT Declaration",
        render: (r) =>
          r.declaration ? (
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
              {(r.declaration.status || "SUBMITTED").toUpperCase()}
            </span>
          ) : (
            <span
              className={cssClass({
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              })}
            >
              NOT SUBMITTED
            </span>
          ),
      },
      {
        key: "poi_status",
        label: "POI Submission",
        render: (r) =>
          r.declaration?.poi_status ? (
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
              UPLOADED
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
              PENDING
            </span>
          ),
      },
      {
        key: "declared_amount",
        label: "Declared Amount",
        right: true,
        render: (r) =>
          r.declaration?.total_declared ? fmtINR(r.declaration.total_declared) : "—",
      },
      {
        key: "approved_amount",
        label: "Approved Amount",
        right: true,
        render: (r) =>
          r.declaration?.total_approved ? fmtINR(r.declaration.total_approved) : "—",
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
      <div className={cssClass({ display: "flex", gap: 16, marginBottom: 16 })}>
        {stats.map((s) => (
          <div
            key={s.label}
            className={cssClass({
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 8,
              padding: "12px 20px",
              textAlign: "center",
            })}
          >
            <div className={cssClass({ fontSize: 22, fontWeight: 700, color: s.color })}>
              {s.value}
            </div>
            <div className={cssClass({ fontSize: 12, color: "#888", marginTop: 2 })}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <Table cols={cols} rows={rows} emptyMsg="No employees found" />
    </>
  );
});

export default POIOverview;
