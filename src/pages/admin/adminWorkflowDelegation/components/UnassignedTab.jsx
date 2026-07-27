import React from "react";
import { AlertTriangle, UserCheck, Check } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants/tabs";
import { Btn } from "./SharedUI";
import ManagerSelect from "./ManagerSelect";

const UnassignedTab = React.memo(function UnassignedTab({
  unassigned,
  managers,
  assignMap,
  setAssignMap,
  saving,
  handleAssign,
  bulkSelected,
  setBulkSelected,
  bulkManager,
  setBulkManager,
  bulkSaving,
  handleBulkAssign,
}) {
  return (
    <div>
      {unassigned.length > 0 && (
        <div className={cssClass({
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
          padding: 18, marginBottom: 20,
        })}>
          <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginBottom: 12 })}>
            Bulk Assignment
          </div>
          <div className={cssClass({ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" })}>
            <div className={cssClass({ fontSize: 13, color: "#374151" })}>{bulkSelected.length} selected</div>
            <div className={cssClass({ flex: 1, minWidth: 240 })}>
              <ManagerSelect
                managers={managers}
                value={bulkManager}
                onChange={setBulkManager}
                placeholder="Select manager for bulk assign…"
              />
            </div>
            <Btn onClick={handleBulkAssign} disabled={!bulkSelected.length || !bulkManager || bulkSaving}>
              <UserCheck size={14} /> Assign All
            </Btn>
          </div>
        </div>
      )}

      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 })}>
        <AlertTriangle size={18} color="#f59e0b" />
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827" })}>
          Employees Without Reporting Manager ({unassigned.length})
        </div>
      </div>

      {unassigned.length === 0 ? (
        <div className={cssClass({
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12,
          padding: 32, textAlign: "center",
        })}>
          <Check size={32} color="#f18200" className={cssClass({ margin: "0 auto 10px" })} />
          <div className={cssClass({ fontSize: 15, fontWeight: 600, color: "#f18200" })}>
            All employees have reporting managers
          </div>
        </div>
      ) : (
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {unassigned.map((emp) => (
            <div
              key={emp.employee_id}
              className={cssClass({
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "16px 18px", display: "flex", gap: 16,
                alignItems: "center", flexWrap: "wrap",
              })}
            >
              <input
                type="checkbox"
                checked={bulkSelected.includes(emp.employee_id)}
                onChange={(e) =>
                  setBulkSelected((sel) =>
                    e.target.checked
                      ? [...sel, emp.employee_id]
                      : sel.filter((id) => id !== emp.employee_id)
                  )
                }
                className={cssClass({ width: 16, height: 16, flexShrink: 0, cursor: "pointer" })}
              />
              <div className={cssClass({
                width: 40, height: 40, borderRadius: "50%", background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, color: "#dc2626", flexShrink: 0,
              })}>
                {emp.full_name?.[0] || "?"}
              </div>
              <div className={cssClass({ flex: 1, minWidth: 140 })}>
                <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>{emp.full_name}</div>
                <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 2 })}>
                  {emp.designation_name || "—"} · {emp.department_name || "—"}
                </div>
                <div className={cssClass({ fontSize: 11, color: "#dc2626", marginTop: 3 })}>🔴 No reporting manager</div>
              </div>
              <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", minWidth: 280 })}>
                <div className={cssClass({ flex: 1 })}>
                  <ManagerSelect
                    managers={managers}
                    value={assignMap[emp.employee_id] || null}
                    onChange={(val) => setAssignMap((m) => ({ ...m, [emp.employee_id]: val }))}
                    placeholder="Select manager…"
                  />
                </div>
                <Btn
                  onClick={() => handleAssign(emp.employee_id)}
                  disabled={!assignMap[emp.employee_id] || saving[emp.employee_id]}
                  style={{ padding: "9px 14px", whiteSpace: "nowrap" }}
                >
                  <Check size={14} /> Save
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default UnassignedTab;
