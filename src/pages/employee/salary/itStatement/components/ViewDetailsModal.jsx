import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { GROUPS, SECTION_MAP } from "../constants";

const ViewDetailsModal = React.memo(function ViewDetailsModal({ onClose, totals }) {
  return (
    <div className={cssClass({ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 860, boxShadow: "0 24px 60px rgba(0,0,0,0.25)" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" })}>
          <div>
            <h3 className={cssClass({ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" })}>Income Tax Act 2025 — Section Changes</h3>
            <p className={cssClass({ margin: "4px 0 0", fontSize: 12, color: "#64748b" })}>Mapping of old sections (IT Act 1961) to new sections (IT Act 2025)</p>
          </div>
          <button type="button" onClick={onClose} className={cssClass({ background: "none", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", lineHeight: 1 })}>{"✕"}</button>
        </div>
        <div className={cssClass({ padding: "16px 20px", maxHeight: "70vh", overflowY: "auto" })}>
          {GROUPS.map(({ key, label, color, bg }) => (
            <div key={key} className={cssClass({ marginBottom: 20 })}>
              <div className={cssClass({ background: bg, padding: "6px 12px", borderRadius: 6, marginBottom: 8 })}>
                <span className={cssClass({ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.06em" })}>{label}</span>
              </div>
              <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
                <thead>
                  <tr className={cssClass({ background: "#f8fafc" })}>
                    <th className={cssClass({ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0", width: "22%" })}>IT Act 1961</th>
                    <th className={cssClass({ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0", width: "28%" })}>IT Act 2025</th>
                    <th className={cssClass({ padding: "7px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0" })}>Description</th>
                    <th className={cssClass({ padding: "7px 12px", textAlign: "center", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 90 })}>Applicable</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTION_MAP[key].map((row, i) => {
                    const active = row.key ? (totals[row.key] || 0) > 0 : false;
                    return (
                      <tr key={i} className={cssClass({ background: active ? "#fffbeb" : "#fff", borderBottom: "1px solid #f1f5f9" })}>
                        <td className={cssClass({ padding: "7px 12px", color: "#334155", fontWeight: active ? 600 : 400 })}>{row.old}</td>
                        <td className={cssClass({ padding: "7px 12px", color: active ? color : "#334155", fontWeight: active ? 700 : 400 })}>{row.new25}</td>
                        <td className={cssClass({ padding: "7px 12px", color: "#475569" })}>{row.desc}</td>
                        <td className={cssClass({ padding: "7px 12px", textAlign: "center" })}>
                          {active
                            ? <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 10 })}>{"✓"} Active</span>
                            : <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{"—"}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className={cssClass({ padding: "12px 20px", borderTop: "1px solid #e2e8f0", textAlign: "right" })}>
          <button type="button" onClick={onClose} className={cssClass({ padding: "8px 20px", background: "#f18200", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" })}>Close</button>
        </div>
      </div>
    </div>
  );
});

export default ViewDetailsModal;
