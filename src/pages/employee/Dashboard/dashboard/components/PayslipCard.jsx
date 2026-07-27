import React from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Download, Loader2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import InteractivePieChart, { formatINR as fmtINR } from "../../../../../component/charts/InteractivePieChart";
import { fmt } from "../utils/formatters";

const PayslipCard = React.memo(function PayslipCard({
  loading,
  sal,
  showSal,
  setShowSal,
  downloading,
  handleDownload,
}) {
  return (
    <div className={cssClass({ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 })}>
      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 })}>
        <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#1e293b" })}>Payslip</span>
        <Link to="/employee/payroll/payslips" className={cssClass({ fontSize: 12, color: "#f18200", fontWeight: 600, textDecoration: "none" })}>
          View All →
        </Link>
      </div>

      {loading ? (
        <div className={cssClass({ display: "flex", justifyContent: "center", padding: 30 })}>
          <Loader2 size={24} color="#f18200" className={cssClass({ animation: "spin 1s linear infinite" })} />
        </div>
      ) : sal.basic === 0 ? (
        <p className={cssClass({ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" })}>
          No salary structure found.
        </p>
      ) : (
        <>
          {showSal ? (
            <InteractivePieChart
              size={160}
              donut={true}
              legendBelow={true}
              valueFormatter={fmtINR}
              data={[
                { label: "Net Pay", value: sal.net, color: "#16a34a" },
                { label: "PF", value: sal.pf, color: "#f18200" },
                { label: "Prof. Tax", value: sal.profTax, color: "#dc2626" },
              ]}
            />
          ) : (
            <div className={cssClass({ display: "flex", gap: 20, alignItems: "center" })}>
              <div className={cssClass({ position: "relative", width: 160, height: 160, flexShrink: 0 })}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="#f1f5f9" />
                  <circle cx="80" cy="80" r="42" fill="#fff" />
                </svg>
                <div className={cssClass({ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
                  <span className={cssClass({ fontSize: 22, color: "#94a3b8", letterSpacing: "0.15em" })}>•••</span>
                  <span className={cssClass({ fontSize: 11, color: "#cbd5e1", marginTop: 4 })}>Hidden</span>
                </div>
              </div>
              <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", gap: 10 })}>
                {[
                  { label: "Net Pay", color: "#16a34a" },
                  { label: "PF", color: "#f18200" },
                  { label: "Prof. Tax", color: "#dc2626" },
                ].map((row) => (
                  <div key={row.label} className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 })}>
                    <span className={cssClass({ display: "flex", alignItems: "center", gap: 6, color: "#64748b" })}>
                      <span className={cssClass({ width: 10, height: 10, borderRadius: "50%", background: row.color, display: "inline-block" })} />
                      {row.label}
                    </span>
                    <span className={cssClass({ color: "#94a3b8", letterSpacing: "0.15em" })}>•••••</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sal.fromPayslip && (
            <div className={cssClass({
              fontSize: 11, color: "#f59e0b", background: "#fffbeb",
              border: "1px solid #fde68a", borderRadius: 6, padding: "4px 10px",
              marginBottom: 12, textAlign: "center",
            })}>
              Projected from salary structure — payslip not yet generated
            </div>
          )}

          <div className={cssClass({ display: "flex", gap: 10 })}>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={cssClass({
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 0", border: "1px solid #f18200", borderRadius: 6, background: "#fff",
                color: "#f18200", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: downloading ? 0.6 : 1,
              })}
            >
              <Download size={13} />
              {downloading ? "…" : "Download"}
            </button>
            <button
              onClick={() => setShowSal((v) => !v)}
              className={cssClass({
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 0", border: "1px solid #f18200", borderRadius: 6, background: "#fff",
                color: "#f18200", fontWeight: 600, fontSize: 13, cursor: "pointer",
              })}
            >
              {showSal ? <EyeOff size={13} /> : <Eye size={13} />}
              {showSal ? "Hide" : "Show Salary"}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default PayslipCard;
