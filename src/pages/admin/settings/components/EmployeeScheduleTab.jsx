import React from "react";
import { Save } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import EmployeeDropdown from "./EmployeeDropdown";

const DAYS = [
  { id: "mon", label: "Mon" }, { id: "tue", label: "Tue" }, { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" }, { id: "fri", label: "Fri" }, { id: "sat", label: "Sat" }, { id: "sun", label: "Sun" },
];

const EmployeeScheduleTab = React.memo(function EmployeeScheduleTab({
  empSchedules, schedLoading,
  schedSearch, setSchedSearch,
  empDropOpen, setEmpDropOpen,
  checkedEmps, setCheckedEmps,
  bulkForm, setBulkForm,
  bulkSaving,
  filteredEmpScheds,
  toggleBulkDay, toggleCheck, toggleAll, applyBulk,
}) {
  return (
    <div className={cssClass({ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 })}>

      {/* Employee selector + schedule type */}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 })}>
        <EmployeeDropdown
          empSchedules={empSchedules}
          schedLoading={schedLoading}
          schedSearch={schedSearch}
          setSchedSearch={setSchedSearch}
          empDropOpen={empDropOpen}
          setEmpDropOpen={setEmpDropOpen}
          checkedEmps={checkedEmps}
          setCheckedEmps={setCheckedEmps}
          filteredEmpScheds={filteredEmpScheds}
          toggleCheck={toggleCheck}
          toggleAll={toggleAll}
        />

        <div>
          <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 })}>
            Schedule Type
          </p>
          <select
            value={bulkForm.schedule_type}
            onChange={(e) => setBulkForm((f) => ({ ...f, schedule_type: e.target.value }))}
            className={cssClass({
              width: "100%", height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 9,
              fontSize: 13, color: "#1e293b", background: "#fff", outline: "none", cursor: "pointer",
            })}
          >
            <option value="fixed">Fixed Schedule (Mon–Fri / Mon–Sat)</option>
            <option value="rotational">Rotational Shift</option>
          </select>
        </div>
      </div>

      {/* Bulk form */}
      <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px" })}>
        {bulkForm.schedule_type === "fixed" ? (
          <div className={cssClass({ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 20, alignItems: "start" })}>
            <div>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 })}>Working Days</p>
              <div className={cssClass({ display: "flex", gap: 6, flexWrap: "wrap" })}>
                {DAYS.map((d) => {
                  const sel = (bulkForm.work_days || []).includes(d.id);
                  return (
                    <button
                      key={d.id} type="button" onClick={() => toggleBulkDay(d.id)}
                      className={cssClass({
                        padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        border: sel ? "1.5px solid #f18200" : "1px solid #e2e8f0",
                        background: sel ? "#f18200" : "#fff",
                        color: sel ? "#fff" : "#64748b",
                      })}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 })}>Start Time</p>
              <input type="time" value={bulkForm.start_time}
                onChange={(e) => setBulkForm((f) => ({ ...f, start_time: e.target.value }))}
                className={cssClass({ width: "100%", height: 40, border: "1px solid #e2e8f0", borderRadius: 9, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" })}
              />
            </div>
            <div>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 })}>End Time</p>
              <input type="time" value={bulkForm.end_time}
                onChange={(e) => setBulkForm((f) => ({ ...f, end_time: e.target.value }))}
                className={cssClass({ width: "100%", height: 40, border: "1px solid #e2e8f0", borderRadius: 9, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" })}
              />
            </div>
          </div>
        ) : (
          <div>
            <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 })}>Rotation Pattern</p>
            <input type="text" value={bulkForm.rotation_pattern}
              onChange={(e) => setBulkForm((f) => ({ ...f, rotation_pattern: e.target.value }))}
              placeholder="e.g. Week A: Mon-Fri, Week B: Tue-Sat"
              className={cssClass({ width: "100%", height: 40, border: "1px solid #e2e8f0", borderRadius: 9, padding: "0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" })}
            />
          </div>
        )}
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={applyBulk}
        disabled={checkedEmps.size === 0 || bulkSaving}
        className={cssClass({
          alignSelf: "flex-start", padding: "10px 28px", borderRadius: 9, border: "none",
          background: checkedEmps.size === 0 ? "#e2e8f0" : "#f18200",
          color: checkedEmps.size === 0 ? "#94a3b8" : "#fff",
          fontSize: 13, fontWeight: 700, cursor: checkedEmps.size === 0 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
        })}
      >
        <Save size={13} />
        {bulkSaving ? "Saving…" :
          checkedEmps.size === 0 ? "Select employees to apply" :
          `Apply Schedule to ${checkedEmps.size} Employee${checkedEmps.size > 1 ? "s" : ""}`}
      </button>
    </div>
  );
});

export default EmployeeScheduleTab;
