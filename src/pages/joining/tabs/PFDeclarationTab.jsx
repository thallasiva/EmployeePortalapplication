import React, { useEffect } from "react";
import { Shield, Info, Upload, CheckCircle, FileText } from "lucide-react";
import SignatureUpload from "./SignatureUpload";

const inp = "w-full border border-amber-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] bg-white";
const inpRO = "w-full border border-amber-100 rounded-lg px-3 py-2 text-[13px] bg-amber-50 text-gray-700 cursor-not-allowed";

const F = ({ label, required, full, children }) => (
  <div className={full ? "col-span-2" : ""}>
    <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);
const Inp = (p) => <input {...p} className={inp} />;
const Sel = ({ options, ...p }) => (
  <select {...p} className={inp + " font-sans"}>
    <option value="">Select...</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);
const Radio = ({ name, value, checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] text-gray-700">
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="accent-[#d97706] w-3.5 h-3.5" />
    {label}
  </label>
);
const AutoTag = () => (
  <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
    <Info size={9} /> Auto-filled
  </span>
);
const Sect = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-gradient-to-r from-[#f18200] to-[#f18200]">
      <h3 className="text-[13px] font-bold text-white tracking-wide uppercase">{title}</h3>
    </div>
    <div className="p-5 grid grid-cols-2 gap-3">{children}</div>
  </div>
);

const YN_OPTIONS = ["Yes", "No"];
const GENDER = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const EDU_QUAL = ["Below 10th", "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Other"];
const DISABILITY = ["Blindness", "Low Vision", "Leprosy", "Hearing Impairment", "Loco Motor Disability", "Mental Retardation", "Mental Illness", "Other"];

export default function PFDeclarationTab({ form, set, setForm }) {
  const aadharRef = React.useRef(null);
  const panDocRef = React.useRef(null);

  // Auto-populate bank + PAN from other tabs
  useEffect(() => {
    const updates = {};
    if (form.accountNumber && form.pfBankAccNo !== form.accountNumber) updates.pfBankAccNo = form.accountNumber;
    if (form.ifscCode && form.pfIfscCode !== form.ifscCode) updates.pfIfscCode = form.ifscCode;
    if (form.panNo && form.pfPan !== form.panNo) {
      updates.pfPan = form.panNo;
      updates.pfDoHavePan = "Yes";
    }
    if (Object.keys(updates).length) setForm(p => ({ ...p, ...updates }));
  }, [form.accountNumber, form.ifscCode, form.panNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = (file, nameKey, fileKey) => {
    if (!file) return;
    setForm(p => ({ ...p, [nameKey]: file.name, [fileKey]: file }));
  };

  const DocUploadCard = ({ label, nameKey, fileKey, inputRef }) => {
    const uploaded = form[nameKey];
    return (
      <div
        className={`border-2 border-dashed rounded-xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
          uploaded ? "border-green-400 bg-green-50" : "border-amber-300 bg-amber-50 hover:border-[#d97706]"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          ref={inputRef}
          className="hidden"
          onChange={e => handleFileUpload(e.target.files[0], nameKey, fileKey)}
        />
        <div className="flex items-center gap-2 min-w-0">
          {uploaded ? (
            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
          ) : (
            <Upload size={16} className="text-amber-500 flex-shrink-0" />
          )}
          <span className={`text-[12px] truncate ${uploaded ? "text-green-700 font-medium" : "text-amber-700"}`}>
            {uploaded || `Upload ${label} (.pdf / .jpg / .png)`}
          </span>
        </div>
        {uploaded ? (
          <button
            type="button"
            className="text-[11px] text-amber-600 underline flex-shrink-0"
            onClick={e => { e.stopPropagation(); setForm(p => ({ ...p, [nameKey]: "", [fileKey]: null })); }}
          >
            Remove
          </button>
        ) : (
          <span className="text-[11px] text-amber-500 bg-amber-100 px-2 py-0.5 rounded flex-shrink-0">Browse</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800">
        <p className="font-bold mb-1">PF Declaration — Form 11 (EPF &amp; MP Act, 1952)</p>
        <p>Please provide your Provident Fund details. Fields marked * are mandatory as per EPFO requirements.</p>
      </div>

      {/* Personal Details — auto-populated where possible */}
      <Sect title="Personal Details">
        <F label={<>Employee Name <AutoTag /></>} full>
          <input readOnly className={inpRO} value={form.fullName || ""} placeholder="Fill in Joining Formalities tab" />
        </F>
        <F label={<>Date of Birth <AutoTag /></>} required>
          <input type="date" readOnly className={inpRO} value={form.dob || ""} />
        </F>
        <F label={<>Father / Spouse Name <AutoTag /></>} required>
          <input readOnly className={inpRO} value={form.fatherName || ""} placeholder="Fill in Joining Formalities tab" />
        </F>
        <F label="Relation Type" required>
          <div className="flex gap-6 pt-2">
            <Radio name="pfRelationType" value="Father" checked={form.pfRelationType === "Father"} onChange={set} label="Father" />
            <Radio name="pfRelationType" value="Spouse" checked={form.pfRelationType === "Spouse"} onChange={set} label="Spouse" />
          </div>
        </F>
        <F label="Gender" required>
          <Sel name="pfGender" value={form.pfGender || ""} onChange={set} options={GENDER} required />
        </F>
        <F label="Marital Status" required>
          <Sel name="pfMaritalStatus" value={form.pfMaritalStatus || ""} onChange={set} options={MARITAL} required />
        </F>
        <F label="Email">
          <Inp type="email" name="pfEmail" value={form.pfEmail || ""} onChange={set} placeholder="email@example.com" />
        </F>
        <F label="Mobile">
          <Inp name="pfMobileNo" value={form.pfMobileNo || ""} onChange={set} placeholder="10-digit mobile" />
        </F>
      </Sect>

      {/* PF Details */}
      <Sect title="PF / EPS Membership">
        <F label="Earlier Member of EPF 1952?" required>
          <Sel name="pfEpf1952" value={form.pfEpf1952 || ""} onChange={set} options={YN_OPTIONS} required />
        </F>
        <F label="Earlier Member of EPS 1995?" required>
          <Sel name="pfEps1995" value={form.pfEps1995 || ""} onChange={set} options={YN_OPTIONS} required />
        </F>
        {(form.pfEpf1952 === "Yes" || form.pfEps1995 === "Yes") && <>
          <F label="UAN Number">
            <Inp name="pfUan" value={form.pfUan || ""} onChange={set} placeholder="12-digit UAN" />
          </F>
          <F label="Previous PF Account Number">
            <Inp name="pfPreviousPf" value={form.pfPreviousPf || ""} onChange={set} placeholder="Previous PF No." />
          </F>
          <F label="Date of Exit from Previous Employment">
            <Inp type="date" name="pfExitPreviousEmployment" value={form.pfExitPreviousEmployment || ""} onChange={set} />
          </F>
          <F label="Scheme Certificate No.">
            <Inp name="pfSchemeCertificateNo" value={form.pfSchemeCertificateNo || ""} onChange={set} />
          </F>
          <F label="PPO No. (if EPS member)">
            <Inp name="pfPpo" value={form.pfPpo || ""} onChange={set} />
          </F>
        </>}
      </Sect>

      {/* International Worker */}
      <Sect title="International Worker">
        <F label="International Worker?" required>
          <Sel name="pfInternationalWorker" value={form.pfInternationalWorker || ""} onChange={set} options={YN_OPTIONS} required />
        </F>
        {form.pfInternationalWorker === "Yes" && <>
          <F label="Country of Origin">
            <Inp name="pfCountryOrigin" value={form.pfCountryOrigin || ""} onChange={set} />
          </F>
          <F label="Passport No.">
            <Inp name="pfPassportNo" value={form.pfPassportNo || ""} onChange={set} />
          </F>
          <F label="Passport Validity">
            <Inp type="date" name="pfPassportValidity" value={form.pfPassportValidity || ""} onChange={set} />
          </F>
        </>}
      </Sect>

      {/* Other Details */}
      <Sect title="Other Details">
        <F label="Educational Qualification" required>
          <Sel name="pfEducationalQualification" value={form.pfEducationalQualification || ""} onChange={set} options={EDU_QUAL} required />
        </F>
        <F label="Specially Abled?" required>
          <Sel name="pfSpeciallyAbled" value={form.pfSpeciallyAbled || ""} onChange={set} options={YN_OPTIONS} required />
        </F>
        {form.pfSpeciallyAbled === "Yes" && (
          <F label="Disability Category">
            <Sel name="pfDisabilityCategory" value={form.pfDisabilityCategory || ""} onChange={set} options={DISABILITY} />
          </F>
        )}
        <F label="Aadhaar Card Upload" full>
          <DocUploadCard label="Aadhaar Card" nameKey="aadharDocName" fileKey="aadharDocFile" inputRef={aadharRef} />
          <p className="text-[11px] text-gray-400 mt-1 ml-1">
            {form.aadharDocName ? "Uploaded in Personal Info tab — also used here" : "Upload here or in the Personal Info tab"}
          </p>
        </F>
        <F label={<>PAN Card Upload <AutoTag /></>} full>
          <DocUploadCard label="PAN Card" nameKey="panDocName" fileKey="panDocFile" inputRef={panDocRef} />
          <p className="text-[11px] text-gray-400 mt-1 ml-1">
            {form.panDocName ? "Uploaded in Personal Info tab — also used here" : "Upload here or in the Personal Info tab"}
          </p>
        </F>
        {(form.pfPan || form.panNo) && (
          <F label={<>PAN Number <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.pfPan || form.panNo || ""} />
          </F>
        )}
      </Sect>

      {/* Bank Details — auto-filled from Joining Formalities */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-[#f18200] to-[#f18200]">
          <h3 className="text-[13px] font-bold text-white tracking-wide uppercase">Bank Details</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <Info size={13} className="flex-shrink-0" />
              Bank details auto-filled from your Joining Formalities entry. To change, update in the Bank Details tab.
            </div>
          </div>
          <F label={<>Bank Account Number <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.pfBankAccNo || form.accountNumber || ""} placeholder="Enter in Joining Formalities" />
          </F>
          <F label={<>IFSC Code <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.pfIfscCode || form.ifscCode || ""} placeholder="Enter in Joining Formalities" />
          </F>
          {(form.bankName) && (
            <F label={<>Bank Name <AutoTag /></>}>
              <input readOnly className={inpRO} value={form.bankName || ""} />
            </F>
          )}
          {(form.branchDetails) && (
            <F label={<>Branch <AutoTag /></>}>
              <input readOnly className={inpRO} value={form.branchDetails || ""} />
            </F>
          )}
        </div>
      </div>

      {/* Declaration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-700 mb-4">Declaration</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="flex items-start gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <input type="checkbox" name="pfDeclarationAccepted" checked={form.pfDeclarationAccepted || false} onChange={set} className="mt-0.5 w-4 h-4 accent-[#d97706] rounded flex-shrink-0" />
              <span className="text-[12px] text-gray-700 leading-relaxed">
                I hereby declare that the particulars furnished above are true, complete and correct to the best of my knowledge and belief.
                I understand that in the event of any false or incorrect information, I will be liable for action under the EPF &amp; MP Act, 1952.
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
          </div>
          <F label="Place" required>
            <Inp name="pfPlace" value={form.pfPlace || ""} onChange={set} placeholder="City / Town" required />
          </F>
          <F label="" full>
            <SignatureUpload form={form} setForm={setForm} />
          </F>
        </div>
      </div>
    </div>
  );
}
