import React from "react";
import { Check, Mail, Phone } from "lucide-react";
import
{
  formatEmployeeId,
  getDepartmentName,
  getDeptBadgeClass,
  getEmployeeDisplayName,
  getEmployeeInitials,
} from "../../utils/employeeDisplay";
import { avatarDataUri } from "../../lib/placeholders";
import "./employee.css";

export default function EmployeeGridCard({ employee })
{
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

export function EmployeeListTable({ employees })
{
  return (
    <div className="emp-table-wrap overflow-x-auto">
      <table className="emp-table min-w-max">
        <thead>

          <tr>
            <th>Employee Number</th>
            <th>Employee Name</th>
            <th>Date Of Joining</th>
            <th>Aadhaar Number</th>
            <th>Name As Per Aadhaar</th>
            <th>Aadhaar Enrolment Number</th>
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
            <th>Birthday</th>
            <th>Date Of Birth</th>
            <th>Email</th>
            <th>Emergency Contact Name</th>
            <th>Emergency Contact Mobile</th>
            <th>ESI Number</th>
            <th>Father's Name</th>
            <th>Gender</th>
            <th>Manager Employee Number</th>
            <th>Marital Status</th>
            <th>PAN Number</th>
            <th>PF Join Date</th>
            <th>PF Number</th>
            <th>UAN Number</th>
            <th>Spouse Name</th>
            <th>Contact City</th>
            <th>Contact Country</th>
            <th>Contact Email</th>
            <th>Contact Mobile</th>
            <th>Contact Name</th>
            <th>Permanent Address Line 1</th>
            <th>Permanent Address Line 2</th>
            <th>Permanent Address Line 3</th>
            <th>Has Left The Organization</th>
            <th>Leaving Date</th>
          </tr>
        </thead>
        {/* <tbody>
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
        </tbody> */}
        <tbody>
          {employees.map((p) => (
            <tr key={p.employee_id}>
              <td>{p.employee_number}</td>
              <td>{`${p.first_name} ${p.lasst_name}`}</td>
              <td>{p.date_of_joining || p.emp_joining_date}</td>
              <td>{p.aadhaar_number}</td>
              <td>{p.name_as_per_aadhaar}</td>
              <td>{p.aadhaar_enrolment_no}</td>
              <td>{p.access_card_no}</td>
              <td>{p.from_date}</td>
              <td>{p.to_date}</td>
              <td>{p.bank_name}</td>
              <td>{p.bank_account_no}</td>
              <td>{p.bank_account_type}</td>
              <td>{p.bank_branch}</td>
              <td>{p.dd_payable_at}</td>
              <td>{p.ifsc_code}</td>
              <td>{p.name_as_per_bank}</td>
              <td>{p.payment_type}</td>
              <td>{p.birthday}</td>
              <td>{p.date_of_birth}</td>
              <td>{p.email}</td>
              <td>{p.emergency_contact_name}</td>
              <td>{p.emergency_contact_mobile}</td>
              <td>{p.esi_number}</td>
              <td>{p.fathers_name}</td>
              <td>{p.gender}</td>
              <td>{p.manager_employee_no}</td>
              <td>{p.marital_status}</td>
              <td>{p.pan_number}</td>
              <td>{p.pf_join_date}</td>
              <td>{p.pf_number}</td>
              <td>{p.uan_number}</td>
              <td>{p.spouse_name}</td>
              <td>{p.contact_city}</td>
              <td>{p.contact_country}</td>
              <td>{p.contact_email}</td>
              <td>{p.contact_mobile}</td>
              <td>{p.contact_name}</td>
              <td>{p.permanent_address_line1}</td>
              <td>{p.permanent_address_line2}</td>
              <td>{p.permanent_address_line3}</td>
              <td>{p.has_left_the_organization ? "Yes" : "No"}</td>
              <td>{p.leaving_date || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
