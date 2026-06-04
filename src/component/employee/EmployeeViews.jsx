import React from "react";
import { Check, Mail, Phone } from "lucide-react";
import {
  formatEmployeeId,
  getDepartmentName,
  getDeptBadgeClass,
  getEmployeeDisplayName,
  getEmployeeInitials,
} from "../../utils/employeeDisplay";
import { avatarDataUri } from "../../lib/placeholders";
import "./employee.css";

export default function EmployeeGridCard({ employee }) {
  const name = getEmployeeDisplayName(employee);
  const department = getDepartmentName(employee.department_id);
  const isActive = employee.employee_status === "Active";

  return (
    <article className="emp-card">
      <img
        className="emp-card__avatar"
        src={avatarDataUri(employee.employee_id, 72)}
        alt={name}
      />
      <h3 className="emp-card__name">{name}</h3>
      <p className="emp-card__title">{employee.emp_job_title}</p>
      <p className="emp-card__id">{formatEmployeeId(employee)}</p>
      <div className="emp-card__badges">
        <span className={`emp-card__dept ${getDeptBadgeClass(department)}`}>
          {department}
        </span>
        <span className={`emp-card__status ${isActive ? "is-active" : "is-inactive"}`}>
          {isActive && <Check size={12} />}
          {employee.employee_status}
        </span>
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
      {employee.assigned_member && (
        <p className="emp-card__assigned">
          Assigned to: <strong>{employee.assigned_member}</strong>
        </p>
      )}
    </article>
  );
}

export function EmployeeListTable({ employees }) {
  return (
    <div className="emp-table-wrap">
      <table className="emp-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Reporting Manager</th>
            <th>Role</th>
            <th>Email</th>
            <th>Assigned Member</th>
            <th>Permissions</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((p) => (
            <tr key={p.employee_id}>
              <td className="emp-table__id">{formatEmployeeId(p)}</td>
              <td>
                <div className="emp-table__name-cell">
                  <span className="emp-table__avatar">{getEmployeeInitials(p)}</span>
                  <span className="font-medium">{getEmployeeDisplayName(p)}</span>
                </div>
              </td>
              <td>
                <span className={`emp-table__manager ${p.reporting_to === "No" ? "is-none" : ""}`}>
                  {p.reporting_to}
                </span>
              </td>
              <td>
                <span className="emp-table__role">{p.emp_job_title}</span>
              </td>
              <td>{p.email}</td>
              <td>{p.assigned_member || "—"}</td>
              <td>{p.role === 1 ? "Admin" : "Employee"}</td>
              <td>
                <span className={`emp-card__status ${p.employee_status === "Active" ? "is-active" : "is-inactive"}`}>
                  {p.employee_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
