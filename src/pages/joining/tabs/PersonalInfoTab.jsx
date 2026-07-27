import React, { useRef } from "react";
import { Heart, User, GraduationCap, Users, Landmark, Camera, Upload, PenLine, Info } from "lucide-react";

const inp = "w-full border border-amber-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] bg-white text-gray-800 placeholder-gray-400";
const tbl_inp = "w-full border border-amber-100 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#d97706] bg-white";
const tbl_sel = tbl_inp + " font-sans";

const Label = ({ children, required }) =>
<label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>;

const F = ({ label, required, full, children }) =>
<div className={full ? "col-span-2" : ""}>
    {label && <Label required={required}>{label}</Label>}
    {children}
  </div>;

const SectionCard = ({ icon: Icon, title, action, children }) =>
<div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6B5133] to-[#8B7355]">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-white/20"><Icon size={15} className="text-white" /></div>
        <h3 className="text-[13px] font-bold text-white tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>;

const TH = ({ children }) =>
<th className="px-3 py-2.5 text-left text-[11px] font-bold text-amber-800 uppercase tracking-wide bg-amber-50 border-b border-amber-100 whitespace-nowrap">{children}</th>;

const AddBtn = ({ onClick }) =>
<button onClick={onClick} type="button"
className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30 transition-colors">
    + Add Row
  </button>;


const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const QUAL = ["10th", "12th", "Diploma", "B.E/B.Tech", "B.Sc", "B.Com", "B.A", "M.E/M.Tech", "M.Sc", "MBA", "MCA", "PhD", "Other"];
const BANKS = ["ICICI Bank", "State Bank of India", "HDFC Bank", "Axis Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India", "Kotak Mahindra Bank", "Other"];

export default function PersonalInfoTab({ form, set, setForm }) {
  const photoRef = useRef();
  const sigRef = useRef();
  const aadharRef = useRef();
  const panDocRef = useRef();

  const handleAadharDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({ ...p, aadharDocFile: file, aadharDocName: file.name }));
  };
  const handlePanDoc = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({ ...p, panDocFile: file, panDocName: file.name }));
  };

  const addEdu = () => setForm((p) => ({ ...p, education: [...(p.education || []), { qualification: "", institute: "", specialization: "", year: "" }] }));
  const rmEdu = (i) => setForm((p) => ({ ...p, education: p.education.filter((_, x) => x !== i) }));
  const setEdu = (i, k, v) => setForm((p) => {const e = [...(p.education || [])];e[i] = { ...e[i], [k]: v };return { ...p, education: e };});

  const addRef = () => setForm((p) => ({ ...p, references: [...(p.references || []), { name: "", occupation: "", relationship: "", contact: "" }] }));
  const rmRef = (i) => setForm((p) => ({ ...p, references: p.references.filter((_, x) => x !== i) }));
  const setRef = (i, k, v) => setForm((p) => {const r = [...(p.references || [])];r[i] = { ...r[i], [k]: v };return { ...p, references: r };});

  const edu = form.education || [{ qualification: "", institute: "", specialization: "", year: "" }];
  const refs = form.references || [{ name: "", occupation: "", relationship: "", contact: "" }];

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, photoFile: file, photoPreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSignature = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, signatureFile: file, signaturePreview: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const inpRO = "w-full border border-amber-100 rounded-lg px-3 py-2 text-[13px] bg-amber-50 text-gray-700 cursor-not-allowed";
  const AutoTag = () =>
  <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
      <Info size={9} /> Auto-filled
    </span>;


  return (
    <div className="space-y-4">

      {}
      {(form.pfEmail || form.pfMobileNo) &&
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800">
          <Info size={15} className="flex-shrink-0 mt-0.5 text-[#d97706]" />
          <span>
            Your details have been pre-filled from the invitation.
            {form.pfEmail && <> Email: <strong>{form.pfEmail}</strong>.</>}
            {form.pfMobileNo && <> Mobile: <strong>{form.pfMobileNo}</strong>.</>}
            {" "}You can update any field before submitting.
          </span>
        </div>
      }

      {}
      <SectionCard icon={User} title="Personal Information">
        <div className="flex gap-5">
          {}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <F label="Full Name" required full>
              <input className={inp} name="fullName" value={form.fullName || ""} onChange={set} placeholder="As per Aadhaar" />
            </F>
            <F label={<>Email Address <AutoTag /></>}>
              <input className={form.pfEmail ? inpRO : inp} name="pfEmail" value={form.pfEmail || ""} onChange={set}
              readOnly={!!form.pfEmail} placeholder="your@email.com" />
            </F>
            <F label={<>Mobile Number <AutoTag /></>}>
              <input className={form.pfMobileNo ? inpRO : inp} name="pfMobileNo" value={form.pfMobileNo || ""} onChange={set}
              readOnly={!!form.pfMobileNo} placeholder="10-digit mobile" />
            </F>
            <F label="Date of Birth" required>
              <input type="date" className={inp} name="dob" value={form.dob || ""} onChange={set} />
            </F>
            <F label="Actual Date of Birth">
              <input type="date" className={inp} name="actualDob" value={form.actualDob || ""} onChange={set} />
            </F>
            <F label="PAN Number">
              <input className={`${inp} uppercase`} name="panNo" value={form.panNo || ""} onChange={set} placeholder="ABCDE1234F" />
            </F>
            {}
            <F label="Aadhaar Card (Upload)">
              <div
                onClick={() => aadharRef.current?.click()}
                className="flex items-center gap-2 border border-dashed border-amber-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-[12px]">

                <Upload size={14} className="text-amber-600" />
                <span className={`truncate ${form.aadharDocName ? "text-neutral-700" : "text-neutral-400"}`}>
                  {form.aadharDocName || "Click to upload Aadhaar (PDF/JPG/PNG)"}
                </span>
                {form.aadharDocName &&
                <button type="button" onClick={(e) => {e.stopPropagation();setForm((p) => ({ ...p, aadharDocFile: null, aadharDocName: "" }));}}
                className="ml-auto text-red-400 hover:text-red-600 text-[11px]">✕</button>
                }
              </div>
              <input ref={aadharRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleAadharDoc} />
            </F>
            {}
            <F label="PAN Card (Upload)">
              <div
                onClick={() => panDocRef.current?.click()}
                className="flex items-center gap-2 border border-dashed border-amber-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-50 text-[12px]">

                <Upload size={14} className="text-amber-600" />
                <span className={`truncate ${form.panDocName ? "text-neutral-700" : "text-neutral-400"}`}>
                  {form.panDocName || "Click to upload PAN Card (PDF/JPG/PNG)"}
                </span>
                {form.panDocName &&
                <button type="button" onClick={(e) => {e.stopPropagation();setForm((p) => ({ ...p, panDocFile: null, panDocName: "" }));}}
                className="ml-auto text-red-400 hover:text-red-600 text-[11px]">✕</button>
                }
              </div>
              <input ref={panDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handlePanDoc} />
            </F>
            <F label="Father Name" required>
              <input className={inp} name="fatherName" value={form.fatherName || ""} onChange={set} placeholder="Father's full name" />
            </F>
            <F label="Marital Status" required>
              <select className={inp + " font-sans"} name="maritalStatus" value={form.maritalStatus || ""} onChange={set}>
                <option value="">Select...</option>
                {MARITAL.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </F>
            {form.maritalStatus === "Married" &&
            <F label="Spouse Name" full>
                <input className={inp} name="spouseName" value={form.spouseName || ""} onChange={set} placeholder="Spouse full name" />
              </F>
            }
            <F label="Present Address" full>
              <textarea className={inp + " resize-none"} rows={2} name="presentAddress" value={form.presentAddress || ""} onChange={set} placeholder="Current / present address" />
            </F>
            <F label="Permanent Address" full>
              <textarea className={inp + " resize-none"} rows={2} name="permanentAddress" value={form.permanentAddress || ""} onChange={set} placeholder="Permanent address" />
            </F>
          </div>

          {}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Photo</span>
            <button type="button" onClick={() => photoRef.current?.click()}
            className="group relative flex h-36 w-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-amber-600 bg-amber-50 transition-colors">
              {form.photoPreview ?
              <img src={form.photoPreview} alt="preview" className="w-full h-full object-cover" /> :

              <>
                  <div className="rounded-full bg-amber-200 p-3 transition-colors">
                    <Camera size={22} className="text-amber-600" />
                  </div>
                  <span className="px-2 text-center text-[10px] font-semibold leading-tight text-amber-600">Click to upload photo</span>
                </>
              }
              {form.photoPreview &&
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload size={20} className="text-white" />
                </div>
              }
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <span className="text-[9px] text-gray-400 text-center leading-tight">JPG/PNG<br />Passport size</span>
          </div>
        </div>
      </SectionCard>

      {}
      <SectionCard icon={GraduationCap} title="Education Details" action={<AddBtn onClick={addEdu} />}>
        <div className="overflow-x-auto rounded-lg border border-amber-100">
          <table className="w-full text-[12px]">
            <thead><tr><TH>Qualification</TH><TH>Institute</TH><TH>Specialization</TH><TH>Year</TH><TH></TH></tr></thead>
            <tbody>
              {edu.map((row, i) =>
              <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/40")}>
                  <td className="px-2 py-2">
                    <select value={row.qualification} onChange={(e) => setEdu(i, "qualification", e.target.value)} className={tbl_sel}>
                      <option value="">Select</option>
                      {QUAL.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2"><input value={row.institute} onChange={(e) => setEdu(i, "institute", e.target.value)} placeholder="Institute name" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={row.specialization} onChange={(e) => setEdu(i, "specialization", e.target.value)} placeholder="e.g. Computer Science" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={row.year} onChange={(e) => setEdu(i, "year", e.target.value)} placeholder="2022" className={"w-20 " + tbl_inp} /></td>
                  <td className="px-2 py-2 text-center">
                    {edu.length > 1 && <button onClick={() => rmEdu(i)} type="button" className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[13px] font-bold text-white">&times;</button>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {}
      <SectionCard icon={Users} title="References" action={<AddBtn onClick={addRef} />}>
        <div className="overflow-x-auto rounded-lg border border-amber-100">
          <table className="w-full text-[12px]">
            <thead><tr><TH>Name</TH><TH>Occupation</TH><TH>Relationship</TH><TH>Contact No &amp; Address</TH><TH></TH></tr></thead>
            <tbody>
              {refs.map((row, i) =>
              <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/40")}>
                  <td className="px-2 py-2"><input value={row.name} onChange={(e) => setRef(i, "name", e.target.value)} placeholder="Full name" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={row.occupation} onChange={(e) => setRef(i, "occupation", e.target.value)} placeholder="Occupation" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={row.relationship} onChange={(e) => setRef(i, "relationship", e.target.value)} placeholder="Relationship" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={row.contact} onChange={(e) => setRef(i, "contact", e.target.value)} placeholder="Phone / Address" className={tbl_inp} /></td>
                  <td className="px-2 py-2 text-center">
                    {refs.length > 1 && <button onClick={() => rmRef(i)} type="button" className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[13px] font-bold text-white">&times;</button>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {}
      <SectionCard icon={Landmark} title="Bank Account Details">
        <div className="grid grid-cols-2 gap-3">
          <F label="Bank Name" required>
            <select className={inp + " font-sans"} name="bankName" value={form.bankName || "ICICI Bank"} onChange={set}>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </F>
          <F label="Name as per Bank Records" required>
            <input className={inp} name="accountHolderName" value={form.accountHolderName || ""} onChange={set} placeholder="Full name on bank account" />
          </F>
          <F label="Account No" required>
            <input className={inp} name="accountNumber" value={form.accountNumber || ""} onChange={set} placeholder="Account number" />
          </F>
          <F label="Confirm Account No" required>
            <input className={inp} name="confirmAccountNumber" value={form.confirmAccountNumber || ""} onChange={set} placeholder="Re-enter account number" />
          </F>
          <F label="IFSC Code" required>
            <input className={`${inp} uppercase`} name="ifscCode" value={form.ifscCode || ""} onChange={set} placeholder="e.g. ICIC0001234" />
          </F>
          <F label="Branch Details">
            <input className={inp} name="branchDetails" value={form.branchDetails || ""} onChange={set} placeholder="Branch name & city" />
          </F>
          {form.accountNumber && form.confirmAccountNumber && form.accountNumber !== form.confirmAccountNumber &&
          <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-600 font-medium">
              ⚠ Account numbers do not match
            </div>
          }
          {form.accountNumber && form.confirmAccountNumber && form.accountNumber === form.confirmAccountNumber &&
          <div className="col-span-2 flex items-center gap-2 rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
              ✓ Account numbers match
            </div>
          }
        </div>
      </SectionCard>

      {}
      <SectionCard icon={PenLine} title="Joining Letter / Declaration">
        <div className="grid grid-cols-2 gap-3">
          <F label="Joining Date">
            <input type="date" className={inp} name="joiningDateText" value={form.joiningDateText || ""} onChange={set} />
          </F>
          <F label="Designation (as in letter)">
            <input className={inp} name="designationText" value={form.designationText || ""} onChange={set} placeholder="Designation as mentioned in letter" />
          </F>

          {}
          <F label="Signature (Upload Image)" required full>
            <div className="flex items-start gap-4">
              <button type="button" onClick={() => sigRef.current?.click()}
              className="flex h-20 w-48 flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-amber-600 bg-amber-50 transition-opacity hover:opacity-80">
                {form.signaturePreview ?
                <img src={form.signaturePreview} alt="Signature" className="w-full h-full object-contain p-1" /> :

                <>
                  <PenLine size={20} className="text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-600">Click to upload signature</span>
                  </>
                }
              </button>
              <input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={handleSignature} />
              <div className="text-[11px] text-gray-400 leading-relaxed mt-1">
                Upload a clear image of your handwritten signature.<br />
                Accepted formats: JPG, PNG<br />
                White background preferred.
                {form.signaturePreview &&
                <button type="button" onClick={() => setForm((p) => ({ ...p, signatureFile: null, signaturePreview: "" }))}
                className="mt-2 block text-[11px] font-semibold text-amber-600 underline">
                    Remove &amp; re-upload
                  </button>
                }
              </div>
            </div>
          </F>
        </div>
      </SectionCard>

    </div>);

}
