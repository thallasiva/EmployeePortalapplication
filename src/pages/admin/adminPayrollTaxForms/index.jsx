import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import { ORANGE, TABS } from "./constants";
import Form16 from "./components/Form16";
import Form24Q from "./components/Form24Q";
import POIOverview from "./components/POIOverview";

const AdminPayrollTaxForms = React.memo(function AdminPayrollTaxForms() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "form16";

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState(currentYear);

  const setTab = useCallback((t) => setSearchParams({ tab: t }), [setSearchParams]);

  const years = useMemo(() => {
    const result = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) result.push(y);
    return result;
  }, [currentYear]);

  const handleYearChange = useCallback((e) => setYear(Number(e.target.value)), []);

  return (
    <div className={cssClass({ padding: "28px 32px", fontFamily: "sans-serif" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" })}>
          Tax & Statutory Forms
        </h2>
        <p className={cssClass({ margin: "4px 0 0", color: "#888", fontSize: 13 })}>
          Form 16, Form 24Q and Proof of Investment overview
        </p>
      </div>

      <div
        className={cssClass({
          display: "flex",
          gap: 0,
          borderBottom: "2px solid #eee",
          marginBottom: 24,
        })}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cssClass({
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? ORANGE : "#666",
              borderBottom: tab === t.key ? `2px solid ${ORANGE}` : "2px solid transparent",
              marginBottom: -2,
            })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={cssClass({
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 20,
        })}
      >
        <label className={cssClass({ fontSize: 13, color: "#555" })}>Financial Year:</label>
        <select
          value={year}
          onChange={handleYearChange}
          className={cssClass({
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 14,
          })}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              FY {y}-{String(y + 1).slice(2)}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cssClass({
          background: "#fff",
          borderRadius: 10,
          border: "1px solid #eee",
          padding: 20,
          boxShadow: "0 1px 4px #0000000a",
        })}
      >
        {tab === "form16" && <Form16 year={year} />}
        {tab === "form24q" && <Form24Q year={year} />}
        {tab === "poi" && <POIOverview year={year} />}
      </div>
    </div>
  );
});

export default AdminPayrollTaxForms;
