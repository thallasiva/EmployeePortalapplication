import React from "react";
import { useStopSalary } from "../hooks/useStopSalary";
import { cssClass } from "../../../../utils/classStyles";

const StopSalary = React.memo(function StopSalary() {
  const { emps, stopped, loading, toggleStopped } = useStopSalary();

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#aaa" })}>Loading…</div>;
  }

  return (
    <>
      <div className={cssClass({
        background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8,
        padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400e",
      })}>
        ⚠️ Stopping salary will exclude the employee from payroll processing for the selected month.
        This action can be reversed before payroll is finalized.
      </div>
      <div className={cssClass({ overflowX: "auto" })}>
        <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
          <thead>
            <tr className={cssClass({ background: "#fafafa" })}>
              {["Emp Code", "Employee", "Department", "Designation", "Status", "Action"].map((h) => (
                <th key={h} className={cssClass({
                  padding: "10px 12px", borderBottom: "2px solid #eee",
                  color: "#555", fontWeight: 600, textAlign: "left",
                })}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emps.map((e, i) => (
              <tr key={e.employee_id} className={cssClass({ background: i % 2 === 0 ? "#fff" : "#fafafa" })}>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {e.emp_code}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {`${e.first_name || ""} ${e.last_name || ""}`.trim()}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {e.department_name || "—"}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {e.emp_job_title || "—"}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  {stopped[e.employee_id] ? (
                    <span className={cssClass({ background: "#fee2e2", color: "#991b1b", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                      STOPPED
                    </span>
                  ) : (
                    <span className={cssClass({ background: "#dcfce7", color: "#166534", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                      ACTIVE
                    </span>
                  )}
                </td>
                <td className={cssClass({ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" })}>
                  <button
                    onClick={() => toggleStopped(e.employee_id)}
                    className={cssClass({
                      padding: "4px 14px", border: "none", borderRadius: 4, cursor: "pointer",
                      fontSize: 12, fontWeight: 600,
                      background: stopped[e.employee_id] ? "#dcfce7" : "#fee2e2",
                      color: stopped[e.employee_id] ? "#166534" : "#991b1b",
                    })}
                  >
                    {stopped[e.employee_id] ? "Resume" : "Stop"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
});

export default StopSalary;
