import React from "react";
import { Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmployeeStatusBadge } from "../../utils/employeeStatus";
import {

  formatEmployeeId,
  getDepartmentName,
  getDeptBadgeClass,
  getEmployeeDisplayName,
  getEmployeeInitials } from
"../../utils/employeeDisplay";
import { avatarDataUri } from "../../lib/placeholders";
import "./employee.css";import { cssClass, joinClasses } from "../../utils/classStyles";

export default function EmployeeGridCard({ employee })
{
  const navigate = useNavigate();
  const name = getEmployeeDisplayName(employee);
  const department = getDepartmentName(employee);

  return (
    <article
      className={joinClasses("emp-card", cssClass(

        { cursor: "pointer" }))} onClick={() => navigate(`/dashboard/employee/${employee.employee_id}`)}>

      <img
        className="emp-card__avatar"
        src={avatarDataUri(employee.employee_id, 72)}
        alt={name} />

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
      {employee.assigned_member &&
      <p className="emp-card__assigned">
          Assigned to: <strong>{employee.assigned_member}</strong>
        </p>
      }
    </article>);

}

export function EmployeeListTable({ employees })
{
  const navigate = useNavigate();

  return (
    <div className="emp-table-wrap overflow-x-auto">
      <table className="emp-table min-w-max">
        <thead>
          <tr>
            <th className="emp-table__id">Employee Number</th>
            <th className="emp-table__sticky-col">Employee Name</th>
            <th>Department</th>
            <th>Role</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Date Of Joining</th>
            <th>Gender</th>
            <th>Date Of Birth</th>
            <th>Marital Status</th>
            <th>Father's Name</th>
            <th>Spouse Name</th>
            <th>Manager Employee Number</th>
            <th>Aadhaar Number</th>
            <th>Name As Per Aadhaar</th>
            <th>Aadhaar Enrolment Number</th>
            <th>PAN Number</th>
            <th>UAN Number</th>
            <th>PF Number</th>
            <th>PF Join Date</th>
            <th>ESI Number</th>
            <th>Access Card Number</th>
            <th>From Date</th>
            <th>To Date</th>
            <th>Bank Name</th>
            <th>Bank Account Number</th>
            <th>Bank Account Type</th>
            <th>Bank Branch</th>
            <th>DD Payable At</th>
            <th>IFSC Code</th>
            <th>Name As Per Bank</th>
            <th>Payment Type</th>
            <th>Contact Name</th>
            <th>Contact Email</th>
            <th>Contact Mobile</th>
            <th>Contact City</th>
            <th>Contact Country</th>
            <th>Emergency Contact Name</th>
            <th>Emergency Contact Mobile</th>
            <th>Permanent Address Line 1</th>
            <th>Permanent Address Line 2</th>
            <th>Permanent Address Line 3</th>
            <th>Has Left The Organization</th>
            <th>Leaving Date</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((p) =>
          <tr
            key={p.employee_id}
            onClick={() => navigate(`/dashboard/employee/${p.employee_id}`)} className={cssClass(
              { cursor: "pointer" })}>

              <td className="emp-table__id">{formatEmployeeId(p)}</td>
              <td className="emp-table__sticky-col">
                <div className="emp-table__name-cell">
                  <span className="emp-table__avatar">{getEmployeeInitials(p)}</span>
                  <span className="font-medium">{getEmployeeDisplayName(p)}</span>
                </div>
              </td>
              <td>{p.department_name || "—"}</td>
              <td><span className="emp-table__role">{p.emp_job_title}</span></td>
              <td>{p.email}</td>
              <td>{p.mobile}</td>
              <td><EmployeeStatusBadge employee={p} className={cssClass({ fontSize: 10, padding: "2px 8px" })} /></td>
              <td>{p.emp_joining_date || "—"}</td>
              <td>{p.gender || "—"}</td>
              <td>{p.dob || "—"}</td>
              <td>{p.marital_status || "—"}</td>
              <td>{p.father_name || "—"}</td>
              <td>{p.spouse_name || "—"}</td>
              <td>{p.reporting_to_code || "—"}</td>
              <td>{p.aadhaar_number || "—"}</td>
              <td>{p.aadhaar_name || "—"}</td>
              <td>{p.aadhaar_enrolment_number || "—"}</td>
              <td>{p.pan_number || "—"}</td>
              <td>{p.uan_number || "—"}</td>
              <td>{p.pf_number || "—"}</td>
              <td>{p.pf_join_date || "—"}</td>
              <td>{p.esi_number || "—"}</td>
              <td>{p.access_card_number || "—"}</td>
              <td>{p.access_card_from_date || "—"}</td>
              <td>{p.access_card_to_date || "—"}</td>
              <td>{p.bank_name || "—"}</td>
              <td>{p.account_number || "—"}</td>
              <td>{p.account_type || "—"}</td>
              <td>{p.bank_branch || "—"}</td>
              <td>{p.dd_payable_at || "—"}</td>
              <td>{p.ifsc_code || "—"}</td>
              <td>{p.account_holder_name || "—"}</td>
              <td>{p.payment_type || "—"}</td>
              <td>{p.contact_name || "—"}</td>
              <td>{p.personal_email || "—"}</td>
              <td>{p.alternate_mobile || "—"}</td>
              <td>{p.contact_city || "—"}</td>
              <td>{p.contact_country || "—"}</td>
              <td>{p.emergency_contact_name || "—"}</td>
              <td>{p.emergency_contact_phone || "—"}</td>
              <td>{p.permanent_address_line1 || "—"}</td>
              <td>{p.permanent_address_line2 || "—"}</td>
              <td>{p.permanent_address_line3 || "—"}</td>
              <td>{p.has_left_organization ? "Yes" : "No"}</td>
              <td>{p.emp_exit_date || "—"}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}
