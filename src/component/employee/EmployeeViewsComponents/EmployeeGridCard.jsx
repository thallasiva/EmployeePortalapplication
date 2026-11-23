import React from "react";
import { Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeStatusBadge } from "../../../utils/employeeStatus";
import { formatEmployeeId, getDepartmentName, getDeptBadgeClass, getEmployeeDisplayName } from "../../../utils/employeeDisplay";
import { avatarDataUri } from "../../../lib/placeholders";
import { cssClass, joinClasses } from "../../../utils/classStyles";
function EmployeeGridCard({
  employee
}) {
  const navigate = useNavigate();
  const name = getEmployeeDisplayName(employee);
  const department = getDepartmentName(employee);
  return <article className={joinClasses("emp-card", cssClass({
    cursor: "pointer"
  }))} onClick={() => navigate(`/dashboard/employee/${employee.employee_id}`)}>
      <img className="emp-card__avatar" src={avatarDataUri(employee.employee_id, 72)} alt={name} />
      <h3 className="emp-card__name">{name}</h3>
      <p className="emp-card__title">{employee.emp_job_title}</p>
      <p className="emp-card__id">{formatEmployeeId(employee)}</p>
      <div className="emp-card__badges">
        <span className={`emp-card__dept ${getDeptBadgeClass(department)}`}>
          {department}
        </span>
        <EmployeeStatusBadge employee={employee} />
      </div>
      <div className="emp-card__contact">
        <span>
          <Mail size={14} />
          {employee.email}
        </span>
        <span>
          <Phone size={14} />
          {employee.mobile}
        </span>
      </div>
      {employee.assigned_member && <p className="emp-card__assigned">
          Assigned to: <strong>{employee.assigned_member}</strong>
        </p>}
    </article>;
}
export { EmployeeGridCard };
