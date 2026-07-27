import React, { useState, useMemo, useCallback } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { ORANGE } from "../constants";
import { fmtINR } from "../utils";
import { useSalaryStructures } from "../hooks/useSalaryStructures";
import Table from "./Table";

const SalaryComponents = React.memo(function SalaryComponents() {
  const [search, setSearch] = useState("");
  const { filtered, loading } = useSalaryStructures(search);

  const handleSearch = useCallback((e) => setSearch(e.target.value), []);

  const cols = useMemo(
    () => [
      { key: "emp_code", label: "Emp Code" },
      {
        key: "employee_name",
        label: "Employee",
        render: (r) => r.employee_name || r.emp_name || "—",
      },
      {
        key: "effective_from",
        label: "Effective From",
        render: (r) =>
          r.effective_from ? new Date(r.effective_from).toLocaleDateString("en-IN") : "—",
      },
      { key: "basic", label: "Basic", right: true, render: (r) => fmtINR(r.basic) },
      { key: "hra", label: "HRA", right: true, render: (r) => fmtINR(r.hra) },
      { key: "conveyance", label: "Conveyance", right: true, render: (r) => fmtINR(r.conveyance) },
      {
        key: "medical_allowance",
        label: "Medical",
        right: true,
        render: (r) => fmtINR(r.medical_allowance),
      },
      {
        key: "special_allowance",
        label: "Special Allow.",
        right: true,
        render: (r) => fmtINR(r.special_allowance),
      },
      { key: "lta", label: "LTA", right: true, render: (r) => fmtINR(r.lta) },
      {
        key: "telephone_allowance",
        label: "Telephone",
        right: true,
        render: (r) => fmtINR(r.telephone_allowance),
      },
      {
        key: "pf_employee",
        label: "PF (Emp)",
        right: true,
        render: (r) => fmtINR(r.pf_employee),
      },
      {
        key: "pf_employer",
        label: "PF (Emp'r)",
        right: true,
        render: (r) => fmtINR(r.pf_employer),
      },
      {
        key: "professional_tax",
        label: "Prof. Tax",
        right: true,
        render: (r) => fmtINR(r.professional_tax),
      },
      {
        key: "ctc",
        label: "CTC",
        right: true,
        render: (r) => (
          <span className={cssClass({ fontWeight: 700, color: ORANGE })}>{fmtINR(r.ctc)}</span>
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
      <div
        className={cssClass({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        })}
      >
        <div className={cssClass({ fontSize: 13, color: "#666" })}>
          {filtered.length} salary structure{filtered.length !== 1 ? "s" : ""}
        </div>
        <input
          placeholder="Search employee…"
          value={search}
          onChange={handleSearch}
          className={cssClass({
            padding: "7px 14px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 13,
            width: 220,
          })}
        />
      </div>
      <Table cols={cols} rows={filtered} emptyMsg="No salary structures found" />
    </>
  );
});

export default SalaryComponents;
