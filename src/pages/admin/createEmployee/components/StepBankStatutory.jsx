import React from "react";
import Field from "./Field";

const StepBankStatutory = React.memo(function StepBankStatutory({ values, setField }) {
  return (
    <>
      <h2>Personal &amp; Statutory Details</h2>
      <div className="emp-wizard__grid">
        <Field label="Gender">
          <select value={values.gender} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Date of Birth (As Per Records)">
          <input type="date" value={values.dob} onChange={(e) => setField("dob", e.target.value)} />
        </Field>
        <Field label="Actual Date of Birth">
          <input type="date" value={values.actual_dob} onChange={(e) => setField("actual_dob", e.target.value)} />
        </Field>
        <Field label="Marital Status">
          <select value={values.marital_status} onChange={(e) => setField("marital_status", e.target.value)}>
            <option value="">Select status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Father's Name">
          <input value={values.father_name} onChange={(e) => setField("father_name", e.target.value)} />
        </Field>
        <Field label="Spouse Name">
          <input value={values.spouse_name} onChange={(e) => setField("spouse_name", e.target.value)} />
        </Field>
        <Field label="Educational Qualification">
          <input
            value={values.educational_qualification}
            onChange={(e) => setField("educational_qualification", e.target.value)}
            placeholder="e.g. B.Tech, MBA"
          />
        </Field>
        <Field label="Aadhaar Number">
          <input value={values.aadhaar_number} onChange={(e) => setField("aadhaar_number", e.target.value)} />
        </Field>
        <Field label="Name As Per Aadhaar">
          <input value={values.aadhaar_name} onChange={(e) => setField("aadhaar_name", e.target.value)} />
        </Field>
        <Field label="Aadhaar Enrolment Number">
          <input value={values.aadhaar_enrolment_number} onChange={(e) => setField("aadhaar_enrolment_number", e.target.value)} />
        </Field>
        <Field label="PAN Number">
          <input value={values.pan_number} onChange={(e) => setField("pan_number", e.target.value)} />
        </Field>
        <Field label="UAN Number">
          <input value={values.uan_number} onChange={(e) => setField("uan_number", e.target.value)} />
        </Field>
        <Field label="PF Number">
          <input value={values.pf_number} onChange={(e) => setField("pf_number", e.target.value)} />
        </Field>
        <Field label="PF Join Date">
          <input type="date" value={values.pf_join_date} onChange={(e) => setField("pf_join_date", e.target.value)} />
        </Field>
        <Field label="ESI Number">
          <input value={values.esi_number} onChange={(e) => setField("esi_number", e.target.value)} />
        </Field>
        <Field label="Access Card Number">
          <input value={values.access_card_number} onChange={(e) => setField("access_card_number", e.target.value)} />
        </Field>
        <Field label="Access Card From Date">
          <input type="date" value={values.access_card_from_date} onChange={(e) => setField("access_card_from_date", e.target.value)} />
        </Field>
        <Field label="Access Card To Date">
          <input type="date" value={values.access_card_to_date} onChange={(e) => setField("access_card_to_date", e.target.value)} />
        </Field>
      </div>

      <h2>Bank Details</h2>
      <div className="emp-wizard__grid">
        <Field label="Bank Name">
          <input value={values.bank_name} onChange={(e) => setField("bank_name", e.target.value)} />
        </Field>
        <Field label="Bank Account Number">
          <input value={values.account_number} onChange={(e) => setField("account_number", e.target.value)} />
        </Field>
        <Field label="Bank Account Type">
          <select value={values.account_type} onChange={(e) => setField("account_type", e.target.value)}>
            <option value="">Select type</option>
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        </Field>
        <Field label="Bank Branch">
          <input value={values.bank_branch} onChange={(e) => setField("bank_branch", e.target.value)} />
        </Field>
        <Field label="IFSC Code">
          <input value={values.ifsc_code} onChange={(e) => setField("ifsc_code", e.target.value)} />
        </Field>
        <Field label="DD Payable At">
          <input value={values.dd_payable_at} onChange={(e) => setField("dd_payable_at", e.target.value)} />
        </Field>
        <Field label="Name As Per Bank">
          <input value={values.account_holder_name} onChange={(e) => setField("account_holder_name", e.target.value)} />
        </Field>
        <Field label="Payment Type">
          <select value={values.payment_type} onChange={(e) => setField("payment_type", e.target.value)}>
            <option value="">Select type</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
          </select>
        </Field>
      </div>

      <h2>Contact &amp; Address</h2>
      <div className="emp-wizard__grid">
        <Field label="Contact Name">
          <input value={values.contact_name} onChange={(e) => setField("contact_name", e.target.value)} />
        </Field>
        <Field label="Contact Email">
          <input type="email" value={values.personal_email} onChange={(e) => setField("personal_email", e.target.value)} />
        </Field>
        <Field label="Contact Mobile">
          <input value={values.alternate_mobile} onChange={(e) => setField("alternate_mobile", e.target.value)} />
        </Field>
        <Field label="Contact City">
          <input value={values.contact_city} onChange={(e) => setField("contact_city", e.target.value)} />
        </Field>
        <Field label="Contact Country">
          <input value={values.contact_country} onChange={(e) => setField("contact_country", e.target.value)} />
        </Field>
        <Field label="Emergency Contact Name">
          <input value={values.emergency_contact_name} onChange={(e) => setField("emergency_contact_name", e.target.value)} />
        </Field>
        <Field label="Emergency Contact Mobile">
          <input value={values.emergency_contact_phone} onChange={(e) => setField("emergency_contact_phone", e.target.value)} />
        </Field>
        <Field label="Permanent Address Line 1">
          <input value={values.permanent_address_line1} onChange={(e) => setField("permanent_address_line1", e.target.value)} />
        </Field>
        <Field label="Permanent Address Line 2">
          <input value={values.permanent_address_line2} onChange={(e) => setField("permanent_address_line2", e.target.value)} />
        </Field>
        <Field label="Permanent Address Line 3">
          <input value={values.permanent_address_line3} onChange={(e) => setField("permanent_address_line3", e.target.value)} />
        </Field>
      </div>
    </>
  );
});

export default StepBankStatutory;
