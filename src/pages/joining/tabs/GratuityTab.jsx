import React from "react";
import { Shield, User, Users, FileText, Info } from "lucide-react";
import SignatureUpload from "./SignatureUpload";

const inp = "w-full border border-amber-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] bg-white text-gray-800 placeholder-gray-400";
const inpRO = "w-full border border-amber-100 rounded-lg px-3 py-2 text-[13px] bg-amber-50 text-gray-700 cursor-not-allowed";
const tbl_inp = "w-full border border-amber-100 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#d97706] bg-white";

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);
const F = ({ label, required, full, children }) => (
  <div className={full ? "col-span-2" : ""}>
    {label && <Label required={required}>{label}</Label>}
    {children}
  </div>
);
const SectionCard = ({ icon: Icon, title, action, children }) => (
  <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#f18200] to-[#f18200]">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-white/20"><Icon size={15} className="text-white" /></div>
        <h3 className="text-[13px] font-bold text-white tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);
const TH = ({ children }) => (
  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-amber-800 uppercase tracking-wide bg-amber-50 border-b border-amber-100 whitespace-nowrap">{children}</th>
);
const AddBtn = ({ onClick }) => (
  <button onClick={onClick} type="button"
    className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30 transition-colors">
    + Add Nominee
  </button>
);
const AutoTag = () => (
  <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
    <Info size={9} /> Auto-filled
  </span>
);

const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const SEX = ["Male", "Female", "Other"];

export default function GratuityTab({ form, set, setForm }) {
  const nominees = form.gratuityNominees || [];
  const witnesses = form.gratuityWitnesses || [{ nameAndAddress: "" }, { nameAndAddress: "" }];
  const total = nominees.reduce((s, n) => s + (Number(n.sharePercentage) || 0), 0);

  const addNominee = () => setForm(p => ({
    ...p, gratuityNominees: [...(p.gratuityNominees || []), { fullNameAndAddress: "", relationship: "", age: "", sharePercentage: "" }]
  }));
  const rmNominee = (i) => setForm(p => ({ ...p, gratuityNominees: p.gratuityNominees.filter((_, x) => x !== i) }));
  const setN = (i, k, v) => setForm(p => { const a = [...p.gratuityNominees]; a[i] = { ...a[i], [k]: v }; return { ...p, gratuityNominees: a }; });
  const setW = (i, v) => setForm(p => { const w = [...(p.gratuityWitnesses || [])]; while (w.length < 2) w.push({ nameAndAddress: "" }); w[i] = { ...w[i], nameAndAddress: v }; return { ...p, gratuityWitnesses: w }; });

  return (
    <div className="space-y-4">
      {/* Employee Info — auto-populated */}
      <SectionCard icon={User} title="Employee Information — Gratuity Nomination (Form F)">
        <div className="grid grid-cols-2 gap-3">
          <F full label={<>Full Name &amp; Permanent Address <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.fullName || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
          <F label="Sex" required>
            <select className={inp + " font-sans"} name="gratuitySex" value={form.gratuitySex || ""} onChange={set}>
              <option value="">Select...</option>{SEX.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </F>
          <F label="Religion" required>
            <input className={inp} name="gratuityReligion" value={form.gratuityReligion || ""} onChange={set} placeholder="e.g. Hindu, Muslim, Christian..." />
          </F>
          <F label="Marital Status" required>
            <select className={inp + " font-sans"} name="gratuityMaritalStatus" value={form.gratuityMaritalStatus || ""} onChange={set}>
              <option value="">Select...</option>{MARITAL.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </F>
          {form.gratuityMaritalStatus === "Married" && (
            <F label="Spouse Name Exclusion Date">
              <input type="date" className={inp} name="gratuitySpouseExclusionDate" value={form.gratuitySpouseExclusionDate || ""} onChange={set} />
            </F>
          )}
          <F label="Dept / Branch / Section" required>
            <input className={inp} name="gratuityDepartmentBranchSection" value={form.gratuityDepartmentBranchSection || ""} onChange={set} placeholder="Department / Branch / Section" />
          </F>
          <F label={<>Date of Joining <AutoTag /></>}>
            <input type="date" readOnly className={inpRO} value={form.joiningDateText || form.gratuityDateOfJoining || ""} />
          </F>
          <F full label={<>Permanent Address <AutoTag /></>}>
            <textarea readOnly rows={2} className={inpRO + " resize-none"} value={form.permanentAddress || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
        </div>
      </SectionCard>

      {/* Nominees Table */}
      <SectionCard icon={Shield} title="Nominee Details" action={<AddBtn onClick={addNominee} />}>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-[12px]">
            <thead><tr>
              <TH>S.No</TH>
              <TH>Full Name &amp; Address</TH>
              <TH>Relationship</TH>
              <TH>Age</TH>
              <TH>Share %</TH>
              <TH></TH>
            </tr></thead>
            <tbody>
              {nominees.map((n, i) => (
                <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                  <td className="px-3 py-2 text-amber-700 font-bold text-center">{i + 1}</td>
                  <td className="px-2 py-2"><textarea value={n.fullNameAndAddress} onChange={e => setN(i, "fullNameAndAddress", e.target.value)} placeholder="Full name and address" rows={2} className={tbl_inp + " resize-none"} /></td>
                  <td className="px-2 py-2"><input value={n.relationship} onChange={e => setN(i, "relationship", e.target.value)} placeholder="e.g. Spouse" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input type="number" min="0" value={n.age} onChange={e => setN(i, "age", e.target.value)} placeholder="Age" className={"w-16 " + tbl_inp} /></td>
                  <td className="px-2 py-2"><input type="number" min="1" max="100" value={n.sharePercentage} onChange={e => setN(i, "sharePercentage", e.target.value)} placeholder="%" className={"w-16 " + tbl_inp} /></td>
                  <td className="px-2 py-2 text-center">
                    {nominees.length > 1 && <button onClick={() => rmNominee(i)} type="button" className="w-5 h-5 rounded-full font-bold text-[13px] flex items-center justify-center mx-auto text-white" style={{ backgroundColor: "#d97706" }}>&times;</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={"mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold " +
          (total === 100 ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-700")}>
          {total === 100 ? "✓" : "⚠"} Total Share: {total}% {total !== 100 ? "(must equal 100%)" : ""}
        </div>
      </SectionCard>

      {/* Witnesses */}
      <SectionCard icon={Users} title="Witnesses">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i}>
              <Label>Witness {i + 1} — Name &amp; Address</Label>
              <textarea className={inp + " resize-none"} rows={2} value={witnesses[i]?.nameAndAddress || ""} onChange={e => setW(i, e.target.value)} placeholder={`Witness ${i + 1} full name and address`} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Declaration */}
      <SectionCard icon={FileText} title="Declaration">
        <div className="grid grid-cols-2 gap-3">
          <F full label={<>Employee Name &amp; Address <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.fullName || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
          <F label="Place" required>
            <input className={inp} name="gratuityPlace" value={form.gratuityPlace || ""} onChange={set} placeholder="City / Place" />
          </F>
          <F label="Date" required>
            <input type="date" className={inp} name="gratuityDate" value={form.gratuityDate || ""} onChange={set} />
          </F>
          <F full>
            <SignatureUpload form={form} setForm={setForm} />
          </F>
        </div>
      </SectionCard>
    </div>
  );
}
