import React, { useState, useEffect } from "react";
import { X, Mail, Calendar } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { getManagerDetails } from "../../../../api/orgHierarchy.api";
import { BRAND } from "../constants/tabs";
import { fmtDate, statusColor } from "../utils/formatters";

const ManagerDetailModal = React.memo(function ManagerDetailModal({ managerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;
    setLoading(true);
    getManagerDetails(managerId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [managerId]);

  if (!managerId) return null;

  return (
    <div className={cssClass({
      position: "fixed", inset: 0, background: "#0006", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    })}>
      <div className={cssClass({
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px #0003",
      })}>
        <div className={cssClass({
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
        })}>
          <div className={cssClass({ fontSize: 18, fontWeight: 700, color: "#111827" })}>Employee Details</div>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#6b7280" })}>
            <X size={20} />
          </button>
        </div>

        <div className={cssClass({ padding: "24px" })}>
          {loading ? (
            <div className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>Loading…</div>
          ) : !data ? (
            <div className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>Not found</div>
          ) : (
            <>
              <div className={cssClass({ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 })}>
                <div className={cssClass({
                  width: 56, height: 56, borderRadius: "50%", background: BRAND + "20",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: BRAND, flexShrink: 0,
                })}>
                  {data.full_name?.[0] || "?"}
                </div>
                <div className={cssClass({ flex: 1 })}>
                  <div className={cssClass({ fontSize: 20, fontWeight: 700, color: "#111827" })}>{data.full_name}</div>
                  <div className={cssClass({ fontSize: 13, color: "#6b7280", marginTop: 2 })}>
                    {data.designation_name} · {data.department_name}
                  </div>
                  <div className={cssClass({ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" })}>
                    <span className={cssClass({ ...statusColor(data.employee_status), borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 })}>
                      {data.employee_status}
                    </span>
                    <span className={cssClass({ background: "#eff6ff", color: "#2563eb", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 })}>
                      {data.direct_reports?.length || 0} Direct · {data.indirect_reports?.length || 0} Indirect
                    </span>
                  </div>
                </div>
              </div>

              <div className={cssClass({ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" })}>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" })}>
                  <Mail size={14} color={BRAND} /> {data.email || "—"}
                </div>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" })}>
                  <Calendar size={14} color={BRAND} /> Joined {fmtDate(data.emp_joining_date)}
                </div>
              </div>

              {data.direct_reports?.length > 0 && (
                <div>
                  <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 })}>
                    Direct Reports ({data.direct_reports.length})
                  </div>
                  <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" })}>
                    <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
                      <thead>
                        <tr className={cssClass({ background: "#f9fafb" })}>
                          {["Name", "Designation", "Joined", "Status"].map((h) => (
                            <th key={h} className={cssClass({
                              padding: "10px 14px", textAlign: "left", fontWeight: 600,
                              color: "#6b7280", fontSize: 11, textTransform: "uppercase",
                            })}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.direct_reports.map((e, i) => (
                          <tr key={e.employee_id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                            <td className={cssClass({ padding: "10px 14px", fontWeight: 600, color: "#111827" })}>{e.full_name}</td>
                            <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{e.designation_name || "—"}</td>
                            <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(e.emp_joining_date)}</td>
                            <td className={cssClass({ padding: "10px 14px" })}>
                              <span className={cssClass({ ...statusColor(e.employee_status), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                                {e.employee_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ManagerDetailModal;
