import React from "react";

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-[13px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-200 pb-1 mb-3">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <span className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</span>
    <p className="text-[13px] text-gray-800 font-medium mt-0.5">{value || <span className="text-gray-300 italic">—</span>}</p>
  </div>
);

const TableSection = ({ title, rows, cols }) => rows && rows.length > 0 && (
  <div className="mb-6">
    <h3 className="text-[13px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-200 pb-1 mb-3">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-amber-50">
            {cols.map(c => <th key={c.key} className="text-left px-3 py-2 font-semibold text-amber-800 border border-amber-100">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              {cols.map(c => <td key={c.key} className="px-3 py-2 text-gray-700 border border-gray-100">{row[c.key] || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default function ReviewSubmitTab({ form }) {
  const tlTotal = (form.termLifeNominees || []).reduce((s,n) => s + (Number(n.shareAmount)||0), 0);
  const gTotal  = (form.gratuityNominees  || []).reduce((s,n) => s + (Number(n.sharePercentage)||0), 0);
  const iTotal  = (form.insNominees       || []).reduce((s,n) => s + (Number(n.shareAmount)||0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-[16px] font-bold text-gray-800 mb-1">Review & Submit</h2>
      <p className="text-[12px] text-gray-400 mb-6">Please review all your information before submitting.</p>

      {/* 1. Employment Details */}
      <Section title="Employment Details">
        <Field label="Employee ID"    value={form.employeeId} />
        <Field label="Designation"    value={form.designation} />
        <Field label="Reporting To"   value={form.reportingTo} />
        <Field label="Department"     value={form.department} />
      </Section>

      {/* 2. Personal Information */}
      <Section title="Personal Information">
        <Field label="Full Name"       value={form.fullName} />
        <Field label="Date of Birth"   value={form.dob} />
        <Field label="Actual DOB"      value={form.actualDob} />
        <Field label="PAN No"          value={form.panNo} />
        <Field label="Father Name"     value={form.fatherName} />
        <Field label="Marital Status"  value={form.maritalStatus} />
        <Field label="Spouse Name"     value={form.spouseName} />
        <Field label="Present Address" value={form.presentAddress} />
        <Field label="Permanent Address" value={form.permanentAddress} />
      </Section>

      {/* 3. Education */}
      <TableSection title="Education Details" rows={form.education}
        cols={[
          { key: "qualification", label: "Qualification" },
          { key: "institute",     label: "Institute" },
          { key: "specialization",label: "Specialization" },
          { key: "year",          label: "Year" },
        ]} />

      {/* 4. References */}
      <TableSection title="References" rows={form.references}
        cols={[
          { key: "name",         label: "Name" },
          { key: "occupation",   label: "Occupation" },
          { key: "relationship", label: "Relationship" },
          { key: "contact",      label: "Contact" },
        ]} />

      {/* 5. Bank Details */}
      <Section title="Bank Details">
        <Field label="Bank Name"           value={form.bankName} />
        <Field label="Account Holder Name" value={form.accountHolderName} />
        <Field label="Account Number"      value={form.accountNumber ? "*".repeat(form.accountNumber.length - 4) + form.accountNumber.slice(-4) : ""} />
        <Field label="IFSC Code"           value={form.ifscCode} />
        <Field label="Branch Details"      value={form.branchDetails} />
      </Section>

      {/* 6. Term Life Insurance */}
      <Section title="Term Life Insurance — Employee Details">
        <Field label="Employee Name"           value={form.tlEmployeeName} />
        <Field label="Father's/Husband's Name" value={form.tlFatherOrHusbandName} />
        <Field label="Date of Birth"           value={form.tlDateOfBirth} />
        <Field label="Sex"                     value={form.tlSex} />
        <Field label="EMP ID"                  value={form.tlEmployeeId} />
        <Field label="Address"                 value={form.tlAddress} />
      </Section>
      <TableSection title="Term Life — Nominees" rows={form.termLifeNominees}
        cols={[
          { key: "nomineeNameAndAddress", label: "Name & Address" },
          { key: "relationship",          label: "Relationship" },
          { key: "dateOfBirth",           label: "DOB" },
          { key: "shareAmount",           label: "Share %" },
          { key: "guardianDetails",       label: "Guardian Details" },
        ]} />
      {(form.termLifeNominees||[]).length > 0 && (
        <p className={"text-[12px] font-semibold mb-4 " + (tlTotal === 100 ? "text-emerald-600" : "text-amber-600")}>
          Total Share: {tlTotal}% {tlTotal === 100 ? "✓" : "(must equal 100%)"}
        </p>
      )}

      {/* 7. Gratuity */}
      <Section title="Gratuity — Employee Details">
        <Field label="Full Name & Permanent Address" value={form.gratuityEmployeeIntroName} />
        <Field label="Sex"                     value={form.gratuitySex} />
        <Field label="Religion"                value={form.gratuityReligion} />
        <Field label="Marital Status"          value={form.gratuityMaritalStatus} />
        <Field label="Dept/Branch/Section"     value={form.gratuityDepartmentBranchSection} />
        <Field label="EMP ID"                  value={form.gratuityEmployeeId} />
        <Field label="Date of Joining"         value={form.gratuityDateOfJoining} />
        <Field label="Permanent Address"       value={form.gratuityPermanentAddress} />
      </Section>
      <TableSection title="Gratuity — Nominees" rows={form.gratuityNominees}
        cols={[
          { key: "fullNameAndAddress", label: "Full Name & Address" },
          { key: "relationship",       label: "Relationship" },
          { key: "age",                label: "Age" },
          { key: "sharePercentage",    label: "Share %" },
        ]} />
      {(form.gratuityNominees||[]).length > 0 && (
        <p className={"text-[12px] font-semibold mb-4 " + (gTotal === 100 ? "text-emerald-600" : "text-amber-600")}>
          Total Share: {gTotal}% {gTotal === 100 ? "✓" : "(must equal 100%)"}
        </p>
      )}
      <div className="mb-6">
        <h3 className="text-[13px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-200 pb-1 mb-3">Gratuity — Witnesses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {(form.gratuityWitnesses||[]).map((w,i) => (
            <Field key={i} label={"Witness " + (i+1) + " Name & Address"} value={w.nameAndAddress} />
          ))}
        </div>
      </div>

      {/* 8. Insurance */}
      <Section title="Group Personal Accidental Insurance — Employee Details">
        <Field label="Employee Name"           value={form.insEmployeeName} />
        <Field label="Father's/Husband's Name" value={form.insFatherOrHusbandName} />
        <Field label="Date of Birth"           value={form.insDateOfBirth} />
        <Field label="Sex"                     value={form.insSex} />
        <Field label="EMP ID"                  value={form.insEmployeeId} />
        <Field label="Address"                 value={form.insAddress} />
      </Section>
      <TableSection title="Insurance — Nominees" rows={form.insNominees}
        cols={[
          { key: "nomineeNameAndAddress", label: "Name & Address" },
          { key: "relationship",          label: "Relationship" },
          { key: "dateOfBirth",           label: "DOB" },
          { key: "shareAmount",           label: "Share %" },
          { key: "guardianDetails",       label: "Guardian Details" },
        ]} />
      {(form.insNominees||[]).length > 0 && (
        <p className={"text-[12px] font-semibold mb-4 " + (iTotal === 100 ? "text-emerald-600" : "text-amber-600")}>
          Total Share: {iTotal}% {iTotal === 100 ? "✓" : "(must equal 100%)"}
        </p>
      )}

      {/* 9. PF Declaration */}
      <Section title="PF Declaration (Form 11) — Personal Details">
        <Field label="Employee Name"        value={form.pfEmployeeName} />
        <Field label="Date of Birth"        value={form.pfDateOfBirth} />
        <Field label="Father/Spouse Name"   value={form.pfFatherOrSpouseName} />
        <Field label="Relation"             value={form.pfRelationType} />
        <Field label="Gender"               value={form.pfGender} />
        <Field label="Marital Status"       value={form.pfMaritalStatus} />
        <Field label="Email"                value={form.pfEmail} />
        <Field label="Mobile No"            value={form.pfMobileNo} />
        <Field label="EPF 1952 Member"      value={form.pfEpf1952} />
        <Field label="EPS 1995 Member"      value={form.pfEps1995} />
        {form.pfEpf1952 === "Yes" && <Field label="UAN"                  value={form.pfUan} />}
        {form.pfEpf1952 === "Yes" && <Field label="Previous PF No"       value={form.pfPreviousPf} />}
        {form.pfEpf1952 === "Yes" && <Field label="Exit Date (Prev Emp)" value={form.pfExitPreviousEmployment} />}
        {form.pfEps1995 === "Yes" && <Field label="Scheme Certificate No" value={form.pfSchemeCertificateNo} />}
        {form.pfEps1995 === "Yes" && <Field label="PPO No"               value={form.pfPpo} />}
        <Field label="International Worker" value={form.pfInternationalWorker} />
        {form.pfInternationalWorker === "Yes" && <Field label="Country of Origin" value={form.pfCountryOrigin} />}
        {form.pfInternationalWorker === "Yes" && <Field label="Passport No"       value={form.pfPassportNo} />}
        {form.pfInternationalWorker === "Yes" && <Field label="Passport Validity"  value={form.pfPassportValidity} />}
        <Field label="Educational Qualification" value={form.pfEducationalQualification} />
        <Field label="Specially Abled"      value={form.pfSpeciallyAbled} />
        {form.pfSpeciallyAbled === "Yes" && <Field label="Disability Category" value={form.pfDisabilityCategory} />}
        <Field label="Bank Account No"      value={form.pfBankAccNo} />
        <Field label="IFSC Code"            value={form.pfIfscCode} />
        <Field label="Aadhaar No"           value={form.pfAadharNo} />
        <Field label="Has PAN"              value={form.pfDoHavePan} />
        {form.pfDoHavePan === "Yes" && <Field label="PAN No" value={form.pfPan} />}
      </Section>

      {/* Acknowledgements */}
      <Section title="Acknowledgements">
        <Field label="Employee Handbook"  value={form.handbookAcknowledged ? "Acknowledged ✓" : "Not yet acknowledged"} />
        <Field label="HR Policy Manual"   value={form.hrPolicyAcknowledged ? "Acknowledged ✓" : "Not yet acknowledged"} />
        <Field label="PF Declaration"     value={form.pfDeclarationAccepted ? "Accepted ✓" : "Not yet accepted"} />
      </Section>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
        <p className="text-[12px] text-amber-700 font-medium">
          ✓ By clicking <strong>Submit Formalities</strong>, you confirm that all information provided is true and accurate to the best of your knowledge.
        </p>
      </div>
    </div>
  );
}
