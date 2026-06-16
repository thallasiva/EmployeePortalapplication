import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Mail, Phone } from "lucide-react";
import { getEmployee } from "../../api/employee.api";
import { getErrorMessage } from "../../api/client";
import { errorToast } from "../../utils/ToastControllers";
import { avatarDataUri } from "../../lib/placeholders";
import "../../component/employee/employee.css";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Row({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || value === 0 ? value : "—"}</dd>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getEmployee(id)
      .then((data) => {
        if (active) setEmployee(data);
      })
      .catch((err) => errorToast(getErrorMessage(err, "Failed to load employee")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="emp-wizard"><p>Loading employee…</p></div>;
  }

  if (!employee) {
    return (
      <div className="emp-wizard">
        <p>Employee not found.</p>
        <button type="button" className="emp-wizard__btn emp-wizard__btn--prev" onClick={() => navigate("/dashboard/employee")}>
          <ArrowLeft size={16} /> Back to Employees
        </button>
      </div>
    );
  }

  const { contactInfo, bankDetails } = employee;
  const isActive = employee.employee_status === "Active";

  return (
    <div className="emp-wizard">
      <button
        type="button"
        className="emp-wizard__btn emp-wizard__btn--prev"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/dashboard/employee")}
      >
        <ArrowLeft size={16} /> Back to Employees
      </button>

      <div className="emp-wizard__card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <img
            className="emp-card__avatar"
            src={avatarDataUri(employee.employee_id, 72)}
            alt={`${employee.first_name} ${employee.last_name || ""}`}
          />
          <div>
            <h2 style={{ margin: 0 }}>{employee.first_name} {employee.last_name}</h2>
            <p style={{ margin: "0.25rem 0 0", color: "#64748b" }}>
              {employee.emp_job_title || "—"} · {employee.department_name || "General"}
            </p>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className={`emp-card__status ${isActive ? "is-active" : "is-inactive"}`}>
                {isActive && <Check size={12} />}
                {employee.employee_status}
              </span>
              <span className="emp-table__id" style={{ alignSelf: "center" }}>{employee.emp_code || `EMP${String(employee.employee_id).padStart(3, "0")}`}</span>
            </div>
          </div>
        </div>
        <div className="emp-card__contact" style={{ marginTop: "1rem", flexDirection: "row", gap: "1.5rem" }}>
          <span><Mail size={14} /> {employee.email}</span>
          <span><Phone size={14} /> {employee.mobile || "—"}</span>
        </div>
      </div>

      <div className="emp-wizard__card">
        <div className="emp-review-section">
          <h3>Personal Information</h3>
          <dl className="emp-review-grid">
            <Row label="Gender" value={employee.gender} />
            <Row label="Date of Birth" value={formatDate(employee.dob)} />
            <Row label="Marital Status" value={employee.marital_status} />
            <Row label="Father's Name" value={employee.father_name} />
            <Row label="Spouse Name" value={employee.spouse_name} />
            <Row label="Blood Group" value={employee.blood_group} />
          </dl>
        </div>

        <div className="emp-review-section">
          <h3>Employment Details</h3>
          <dl className="emp-review-grid">
            <Row label="Department" value={employee.department_name} />
            <Row label="Designation" value={employee.designation_name} />
            <Row label="Job Title" value={employee.emp_job_title} />
            <Row label="Reporting Manager" value={employee.reporting_to_name?.trim()} />
            <Row label="Date of Joining" value={formatDate(employee.emp_joining_date)} />
            <Row label="Employee Type" value={employee.employee_type} />
            <Row label="Employee Status" value={employee.employee_status} />
            <Row label="Has Left Organization" value={employee.has_left_organization ? "Yes" : "No"} />
            <Row label="Leaving Date" value={formatDate(employee.emp_exit_date)} />
            <Row label="Location" value={employee.location} />
            <Row label="Assigned Member" value={employee.assigned_member} />
          </dl>
        </div>

        <div className="emp-review-section">
          <h3>Compensation</h3>
          <dl className="emp-review-grid">
            <Row label="CTC" value={employee.ctc} />
            <Row label="Base Salary" value={employee.base_salary} />
            <Row label="Benefits Plan" value={employee.benefits_plan} />
          </dl>
        </div>

        <div className="emp-review-section">
          <h3>Statutory & Identity</h3>
          <dl className="emp-review-grid">
            <Row label="Aadhaar Number" value={employee.aadhaar_number} />
            <Row label="Name As Per Aadhaar" value={employee.aadhaar_name} />
            <Row label="Aadhaar Enrolment Number" value={employee.aadhaar_enrolment_number} />
            <Row label="PF Number" value={employee.pf_number} />
            <Row label="PF Join Date" value={formatDate(employee.pf_join_date)} />
            <Row label="ESI Number" value={employee.esi_number} />
            <Row label="Access Card Number" value={employee.access_card_number} />
            <Row label="Access Card From Date" value={formatDate(employee.access_card_from_date)} />
            <Row label="Access Card To Date" value={formatDate(employee.access_card_to_date)} />
          </dl>
        </div>

        <div className="emp-review-section">
          <h3>Bank Details</h3>
          <dl className="emp-review-grid">
            <Row label="Bank Name" value={bankDetails?.bank_name} />
            <Row label="Account Number" value={bankDetails?.account_number} />
            <Row label="Account Type" value={bankDetails?.account_type} />
            <Row label="Bank Branch" value={bankDetails?.bank_branch} />
            <Row label="IFSC Code" value={bankDetails?.ifsc_code} />
            <Row label="DD Payable At" value={bankDetails?.dd_payable_at} />
            <Row label="Name As Per Bank" value={bankDetails?.account_holder_name} />
            <Row label="Payment Type" value={bankDetails?.payment_type} />
            <Row label="PAN Number" value={bankDetails?.pan_number} />
            <Row label="UAN Number" value={bankDetails?.uan_number} />
          </dl>
        </div>

        <div className="emp-review-section">
          <h3>Contact & Address</h3>
          <dl className="emp-review-grid">
            <Row label="Contact Name" value={contactInfo?.contact_name} />
            <Row label="Contact Email" value={contactInfo?.personal_email} />
            <Row label="Contact Mobile" value={contactInfo?.alternate_mobile} />
            <Row label="Contact City" value={contactInfo?.contact_city} />
            <Row label="Contact Country" value={contactInfo?.contact_country} />
            <Row label="Emergency Contact Name" value={contactInfo?.emergency_contact_name} />
            <Row label="Emergency Contact Mobile" value={contactInfo?.emergency_contact_phone} />
            <Row label="Permanent Address Line 1" value={contactInfo?.permanent_address_line1} />
            <Row label="Permanent Address Line 2" value={contactInfo?.permanent_address_line2} />
            <Row label="Permanent Address Line 3" value={contactInfo?.permanent_address_line3} />
          </dl>
        </div>
      </div>
    </div>
  );
}
