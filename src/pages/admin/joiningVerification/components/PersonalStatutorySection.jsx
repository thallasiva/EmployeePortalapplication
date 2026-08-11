import React from "react";
import {
  User, Landmark, PenLine, FileText, FileCheck, Shield,
} from "lucide-react";
import { Row, Sec, TblHead } from "./SharedUI";
import { fmt, parse } from "../utils";

const API_BASE =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "https://backend.natsoft.io";

/** Resolve a URL that may be a base64 data-URL or a relative server path */
function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const PersonalStatutorySection = React.memo(function PersonalStatutorySection({ detail }) {
  return (
    <>
      {detail.photo_url && (
        <Sec icon={User} title="Profile Photo">
          <img
            src={resolveUrl(detail.photo_url)}
            alt="Profile"
            className="w-28 h-32 object-cover rounded-xl border-2 border-amber-200 shadow"
          />
        </Sec>
      )}

      <Sec icon={User} title="Personal Information">
        <Row label="Full Name" value={detail.full_name} />
        <Row label="Date of Birth" value={fmt(detail.dob)} />
        <Row label="Actual DOB" value={fmt(detail.actual_dob)} />
        <Row label="PAN Number" value={detail.pan_no} />
        <Row label="Father Name" value={detail.father_name} />
        <Row label="Marital Status" value={detail.marital_status} />
        <Row label="Spouse Name" value={detail.spouse_name} />
        <Row label="Present Address" value={detail.present_address} />
        <Row label="Permanent Address" value={detail.permanent_address} />
        <Row label="Joining Date" value={fmt(detail.joining_date_text)} />
        <Row label="Designation (letter)" value={detail.designation_text} />
      </Sec>

      {parse(detail.education_json).length > 0 && (
        <Sec icon={FileCheck} title="Education Details">
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="w-full text-[12px]">
              <TblHead cols={["Qualification", "Institute", "Specialization", "Year"]} />
              <tbody>
                {parse(detail.education_json).map((e, i) => (
                  <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                    <td className="px-3 py-2">{e.qualification || "—"}</td>
                    <td className="px-3 py-2">{e.institute || "—"}</td>
                    <td className="px-3 py-2">{e.specialization || "—"}</td>
                    <td className="px-3 py-2">{e.year || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      {parse(detail.references_json).length > 0 && (
        <Sec icon={User} title="References">
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="w-full text-[12px]">
              <TblHead cols={["Name", "Occupation", "Relationship", "Contact"]} />
              <tbody>
                {parse(detail.references_json).map((r, i) => (
                  <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                    <td className="px-3 py-2">{r.name || "—"}</td>
                    <td className="px-3 py-2">{r.occupation || "—"}</td>
                    <td className="px-3 py-2">{r.relationship || "—"}</td>
                    <td className="px-3 py-2">{r.contact || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      <Sec icon={Shield} title="PF Declaration (Form 11)">
        <Row label="Employee Name" value={detail.pf_employee_name} />
        <Row label="Date of Birth" value={fmt(detail.pf_date_of_birth)} />
        <Row label="Father/Spouse Name" value={detail.pf_father_or_spouse_name} />
        <Row label="Relation" value={detail.pf_relation_type} />
        <Row label="Gender" value={detail.pf_gender} />
        <Row label="Marital Status" value={detail.pf_marital_status} />
        <Row label="Email" value={detail.pf_email} />
        <Row label="Mobile" value={detail.pf_mobile_no} />
        <Row label="EPF 1952 Member" value={detail.pf_epf_1952} />
        <Row label="EPS 1995 Member" value={detail.pf_eps_1995} />
        {detail.pf_epf_1952 === "Yes" && <Row label="UAN" value={detail.pf_uan} />}
        {detail.pf_epf_1952 === "Yes" && <Row label="Previous PF No" value={detail.pf_previous_pf} />}
        <Row label="International Worker" value={detail.pf_international_worker} />
        <Row label="Aadhaar No" value={detail.pf_aadhar_no} />
        <Row label="PAN" value={detail.pf_pan} />
        <Row label="Bank Account No" value={detail.pf_bank_acc_no} />
        <Row label="IFSC Code" value={detail.pf_ifsc_code} />
        <Row label="Educational Qual." value={detail.pf_educational_qualification} />
        <Row label="Specially Abled" value={detail.pf_specially_abled} />
      </Sec>

      <Sec icon={Landmark} title="Bank Details">
        <Row label="Bank Name" value={detail.bank_name} />
        <Row label="Account Holder" value={detail.account_holder_name} />
        <Row
          label="Account No."
          value={detail.account_number ? "xxxx" + detail.account_number.slice(-4) : "—"}
        />
        <Row label="IFSC Code" value={detail.ifsc_code} />
        <Row label="Branch" value={detail.branch_details} />
      </Sec>

      {detail.signature_url && (
        <Sec icon={PenLine} title="Employee Signature">
          <img
            src={resolveUrl(detail.signature_url)}
            alt="Signature"
            className="h-16 object-contain border border-amber-200 rounded-lg bg-white px-3 py-2"
          />
        </Sec>
      )}
    </>
  );
});

export default PersonalStatutorySection;
