import React from "react";
import { cssClass, joinClasses } from "../../../../../utils/classStyles";
import EmpCard from "./EmpCard";

const TeamRow = React.memo(function TeamRow({ manager, team, selfId, search }) {
  return (
    <div className={joinClasses("org-tree", cssClass({ marginTop: 0 }))}>
      <ul>
        <li>
          <div className={cssClass({ position: "relative", display: "inline-block" })}>
            <EmpCard emp={manager} search={search} badge="Manager" />
          </div>
          {team.length > 0 && (
            <ul>
              {team.map((emp) => (
                <li key={emp.employee_id}>
                  <EmpCard emp={emp} isSelf={emp.employee_id === selfId} search={search} />
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
});

export default TeamRow;
