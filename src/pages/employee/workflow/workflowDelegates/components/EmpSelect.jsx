import React from "react";
import { ChevronDown } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const EmpSelect = React.memo(function EmpSelect({
  value, onChange, employees, placeholder = "Select delegate…", excludeId,
}) {
  return (
    <div className={cssClass({ position: "relative" })}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cssClass({
          width: "100%", height: 36, paddingLeft: 10, paddingRight: 28,
          border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
          color: value ? "#1e293b" : "#94a3b8", background: "#fff",
          outline: "none", appearance: "none", cursor: "pointer",
        })}
      >
        <option value="">{placeholder}</option>
        {employees
          .filter((e) => e.employee_id !== excludeId)
          .map((e) => (
            <option key={e.employee_id} value={e.employee_id}>
              {[e.first_name, e.last_name].filter(Boolean).join(" ")}{" "}
              {e.emp_job_title ? `· ${e.emp_job_title}` : ""}
            </option>
          ))}
      </select>
      <ChevronDown
        size={14}
        className={cssClass({
          position: "absolute", right: 8, top: "50%",
          transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
        })}
      />
    </div>
  );
});

export default EmpSelect;
