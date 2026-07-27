import React from "react";
import { UserCheck, Search, X, Building, Users, Eye } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";
import { statusColor } from "../utils/formatters";

const ManagersTab = React.memo(function ManagersTab({
  managers,
  mgSearch,
  setMgSearch,
  setSelectedNode,
}) {
  const filtered = managers.filter(
    (m) =>
      !mgSearch ||
      m.full_name?.toLowerCase().includes(mgSearch.toLowerCase()) ||
      m.designation_name?.toLowerCase().includes(mgSearch.toLowerCase()) ||
      m.department_name?.toLowerCase().includes(mgSearch.toLowerCase())
  );

  return (
    <div>
      <div className={cssClass({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, gap: 12, flexWrap: "wrap",
      })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          <UserCheck size={18} color={BRAND} />
          <span className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827" })}>
            Reporting Managers ({managers.length})
          </span>
        </div>
        <div className={cssClass({
          display: "flex", alignItems: "center", gap: 8, background: "#f9fafb",
          border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", minWidth: 240,
        })}>
          <Search size={14} color="#9ca3af" />
          <input
            value={mgSearch}
            onChange={(e) => setMgSearch(e.target.value)}
            placeholder="Search by name, designation…"
            className={cssClass({ border: "none", background: "none", outline: "none", fontSize: 13, flex: 1 })}
          />
          {mgSearch && (
            <button onClick={() => setMgSearch("")}
              className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 })}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={cssClass({
          textAlign: "center", padding: 40, color: "#9ca3af",
          background: "#f9fafb", borderRadius: 12, fontSize: 13,
        })}>
          {mgSearch ? "No matching managers" : "No reporting managers found"}
        </div>
      ) : (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 })}>
          {filtered.map((m) => {
            const initials = (m.full_name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div
                key={m.employee_id}
                onClick={() => setSelectedNode({ id: m.employee_id, name: m.full_name })}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(241,130,0,0.15)"; e.currentTarget.style.borderColor = BRAND; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px #0001"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                className={cssClass({
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                  padding: "16px 18px", cursor: "pointer", transition: "all .15s",
                  boxShadow: "0 1px 4px #0001", display: "flex", flexDirection: "column", gap: 12,
                })}
              >
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
                  <div className={cssClass({
                    width: 46, height: 46, borderRadius: "50%",
                    background: `linear-gradient(135deg,${BRAND}30,${BRAND}15)`,
                    border: `2px solid ${BRAND}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: BRAND, flexShrink: 0,
                  })}>
                    {initials}
                  </div>
                  <div className={cssClass({ flex: 1, minWidth: 0 })}>
                    <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {m.full_name}
                    </div>
                    <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {m.designation_name || "—"}
                    </div>
                  </div>
                  <span className={cssClass({ ...statusColor(m.employee_status || "Active"), borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, flexShrink: 0 })}>
                    {m.employee_status || "Active"}
                  </span>
                </div>

                <div className={cssClass({
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", background: "#f9fafb", borderRadius: 8, gap: 10,
                })}>
                  <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" })}>
                    <Building size={13} color="#9ca3af" />
                    <span className={cssClass({ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 })}>
                      {m.department_name || "—"}
                    </span>
                  </div>
                  <div className={cssClass({ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: BRAND, flexShrink: 0 })}>
                    <Users size={13} color={BRAND} />
                    {m.team_count != null ? m.team_count : "—"} reports
                  </div>
                </div>

                <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 12, color: BRAND, fontWeight: 600 })}>
                  <Eye size={13} /> View Details
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ManagersTab;
