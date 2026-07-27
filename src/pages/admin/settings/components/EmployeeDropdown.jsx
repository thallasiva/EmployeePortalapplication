import React from "react";
import { Users, ChevronDown, Check, X, Search } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const EmployeeDropdown = React.memo(function EmployeeDropdown({
  empSchedules, schedLoading,
  schedSearch, setSchedSearch,
  empDropOpen, setEmpDropOpen,
  checkedEmps, setCheckedEmps,
  filteredEmpScheds,
  toggleCheck, toggleAll,
}) {
  return (
    <div>
      <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 })}>
        Select Employees
      </p>
      <div className={cssClass({ position: "relative" })}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setEmpDropOpen((o) => !o)}
          className={cssClass({
            width: "100%", height: 40, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff",
            fontSize: 13, color: checkedEmps.size > 0 ? "#1e293b" : "#94a3b8", cursor: "pointer",
          })}
        >
          <span className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
            <Users size={13} className={cssClass({ color: "#94a3b8" })} />
            {schedLoading ? "Loading…" :
              checkedEmps.size === 0 ? "Choose employees…" :
              checkedEmps.size === empSchedules.length ? "All employees selected" :
              `${checkedEmps.size} employee${checkedEmps.size > 1 ? "s" : ""} selected`}
          </span>
          <ChevronDown size={13} className={cssClass({ color: "#94a3b8", transform: empDropOpen ? "rotate(180deg)" : "none", transition: "0.2s" })} />
        </button>

        {/* Dropdown panel */}
        {empDropOpen && (
          <div className={cssClass({
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden",
          })}>
            {/* Search */}
            <div className={cssClass({ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" })}>
              <div className={cssClass({ position: "relative" })}>
                <Search size={12} className={cssClass({ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" })} />
                <input
                  type="text" value={schedSearch} onChange={(e) => setSchedSearch(e.target.value)}
                  placeholder="Search…"
                  className={cssClass({ width: "100%", height: 30, paddingLeft: 24, border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" })}
                />
              </div>
            </div>

            {/* Select all row */}
            <div
              onClick={() => toggleAll(filteredEmpScheds)}
              className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" })}
            >
              <div className={cssClass({
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length ? "#f18200" : "#d1d5db"}`,
                background: checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length ? "#f18200" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              })}>
                {checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length && <Check size={9} color="#fff" />}
              </div>
              <span className={cssClass({ fontSize: 12, fontWeight: 600, color: "#64748b" })}>
                {checkedEmps.size === filteredEmpScheds.length && filteredEmpScheds.length > 0
                  ? "Deselect all"
                  : `Select all (${filteredEmpScheds.length})`}
              </span>
            </div>

            {/* Employee list */}
            <div className={cssClass({ maxHeight: 220, overflowY: "auto" })}>
              {filteredEmpScheds.length === 0 ? (
                <p className={cssClass({ fontSize: 12, color: "#94a3b8", padding: "16px 12px", textAlign: "center" })}>
                  {schedLoading ? "Loading employees…" : "No employees found"}
                </p>
              ) : filteredEmpScheds.map((emp) => {
                const checked = checkedEmps.has(emp.employee_id);
                return (
                  <div
                    key={emp.employee_id}
                    onClick={() => toggleCheck(emp.employee_id)}
                    className={cssClass({
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      cursor: "pointer", background: checked ? "#fff7ed" : "#fff",
                      borderBottom: "1px solid #f8fafc",
                    })}
                  >
                    <div className={cssClass({
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: `1.5px solid ${checked ? "#f18200" : "#d1d5db"}`,
                      background: checked ? "#f18200" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    })}>
                      {checked && <Check size={9} color="#fff" />}
                    </div>
                    <div className={cssClass({ flex: 1, minWidth: 0 })}>
                      <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>
                        {emp.employee_name}
                      </div>
                      <div className={cssClass({ fontSize: 11, color: "#94a3b8" })}>
                        {emp.department_name || "—"}{emp.work_days ? ` · ${emp.work_days.join(", ")}` : ""}
                      </div>
                    </div>
                    {emp.schedule_id && (
                      <span className={cssClass({ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", flexShrink: 0 })}>
                        Custom
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className={cssClass({ padding: "8px 12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
              <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>{checkedEmps.size} selected</span>
              <button
                onClick={() => setEmpDropOpen(false)}
                className={cssClass({ fontSize: 12, fontWeight: 600, color: "#f18200", background: "none", border: "none", cursor: "pointer" })}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected chips */}
      {checkedEmps.size > 0 && (
        <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 })}>
          {[...checkedEmps].slice(0, 5).map((id) => {
            const emp = empSchedules.find((e) => e.employee_id === id);
            return emp ? (
              <span key={id} className={cssClass({
                display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                padding: "3px 8px", borderRadius: 999, background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa",
              })}>
                {emp.employee_name.split(" ")[0]}
                <span onClick={() => toggleCheck(id)} className={cssClass({ cursor: "pointer", lineHeight: 1 })}>
                  <X size={10} />
                </span>
              </span>
            ) : null;
          })}
          {checkedEmps.size > 5 && (
            <span className={cssClass({ fontSize: 11, color: "#94a3b8", padding: "3px 8px" })}>
              +{checkedEmps.size - 5} more
            </span>
          )}
          <button
            onClick={() => setCheckedEmps(new Set())}
            className={cssClass({ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "3px 4px" })}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
});

export default EmployeeDropdown;
