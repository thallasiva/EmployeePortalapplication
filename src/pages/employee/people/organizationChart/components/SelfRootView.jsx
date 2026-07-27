import React from "react";
import EmpCard from "./EmpCard";

const SelfRootView = React.memo(function SelfRootView({ self, directReports, search }) {
  return (
    <div className="org-tree">
      <ul>
        <li>
          <EmpCard emp={self} isSelf search={search} />
          {directReports.length > 0 && (
            <ul>
              {directReports.map((emp) => (
                <li key={emp.employee_id}>
                  <EmpCard emp={emp} search={search} />
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
});

export default SelfRootView;
