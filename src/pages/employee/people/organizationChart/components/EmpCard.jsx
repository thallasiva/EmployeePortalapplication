import React from "react";
import { cssClass, joinClasses } from "../../../../../utils/classStyles";
import { BRAND, deptColor } from "../constants/palette";
import { fullName, initials } from "../utils/empHelpers";

const EmpCard = React.memo(function EmpCard({ emp, isSelf, badge, search }) {
  const color = deptColor(emp.department_id);
  const name = fullName(emp);
  const matched = search && name.toLowerCase().includes(search.toLowerCase().trim());

  return (
    <div className={joinClasses(`org-card${matched ? " org-card--highlight" : ""}`, cssClass({
      outline: isSelf ? `2px solid ${color}` : undefined,
      outlineOffset: 2,
      position: "relative",
    }))}>
      <div className={joinClasses("org-avatar", cssClass({ background: `${color}1a`, color }))}>
        {emp.profile_photo ? (
          <img
            src={emp.profile_photo}
            alt={name}
            className={cssClass({ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" })}
          />
        ) : initials(name)}
      </div>

      <p className="org-name">{name}</p>
      <p className="org-title">{emp.emp_job_title || emp.designation_name || "—"}</p>

      <div className={cssClass({ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 4 })}>
        {emp.department_name && (
          <span className={joinClasses("org-badge", cssClass({ background: `${color}18`, color }))}>
            {emp.department_name}
          </span>
        )}
        {isSelf && (
          <span className={cssClass({
            fontSize: 9, fontWeight: 700, background: "#fff8f0", color: BRAND,
            border: `1px solid ${BRAND}`, borderRadius: 4, padding: "1px 5px",
          })}>YOU</span>
        )}
        {badge && !isSelf && (
          <span className={cssClass({
            fontSize: 9, fontWeight: 700, background: "#f5f3ff", color: "#7c3aed",
            border: "1px solid #c4b5fd", borderRadius: 4, padding: "1px 5px",
          })}>{badge}</span>
        )}
      </div>
    </div>
  );
});

export default EmpCard;
