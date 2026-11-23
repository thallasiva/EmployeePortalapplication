import React from "react";
import { User, Heart, FileText, Check, AlertTriangle } from "lucide-react";
import SignatureUpload from ".././SignatureUpload";
import { inp, inpRO, tbl_inp } from "./shared";
import { F } from "./F";
import { SectionCard } from "./SectionCard";
import { TH } from "./TH";
import { AddBtn } from "./AddBtn";
import { AutoTag } from "./AutoTag";
function InsuranceTab({
  form,
  set,
  setForm
}) {
  const nominees = form.insNominees || [];
  const total = nominees.reduce((s, n) => s + (Number(n.shareAmount) || 0), 0);
  const addNominee = () => setForm(p => ({
    ...p,
    insNominees: [...(p.insNominees || []), {
      nomineeNameAndAddress: "",
      relationship: "",
      dateOfBirth: "",
      shareAmount: "",
      guardianDetails: ""
    }]
  }));
  const rmNominee = i => setForm(p => ({
    ...p,
    insNominees: p.insNominees.filter((_, x) => x !== i)
  }));
  const setN = (i, k, v) => setForm(p => {
    const a = [...p.insNominees];
    a[i] = {
      ...a[i],
      [k]: v
    };
    return {
      ...p,
      insNominees: a
    };
  });
  return <div className="space-y-4">
      {}
      <SectionCard icon={User} title="Employee Details — Group Personal Accidental Insurance Nomination">
        <div className="grid grid-cols-2 gap-3">
          <F full label={<>1. Employee Name <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.fullName || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
          <F label={<>2. Father's / Husband's Name <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.fatherName || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
          <F label={<>3. Date of Birth <AutoTag /></>}>
            <input type="date" readOnly className={inpRO} value={form.dob || ""} />
          </F>
          <F label="4. Sex" required>
            <select className={inp + " font-sans"} name="insSex" value={form.insSex || ""} onChange={set}>
              <option value="">Select...</option>
              {["Male", "Female", "Other"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </F>
          <F full label={<>5. Address <AutoTag /></>}>
            <textarea readOnly rows={2} className={inpRO + " resize-none"} value={form.permanentAddress || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
        </div>
      </SectionCard>
      {}
      <SectionCard icon={Heart} title="Nominee Details" action={<AddBtn onClick={addNominee} />}>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-[12px]">
            <thead><tr>
              <TH>Name &amp; Address of Nominee</TH>
              <TH>Relationship</TH>
              <TH>Date of Birth</TH>
              <TH>Share %</TH>
              <TH>Guardian Details (if minor)</TH>
              <TH></TH>
            </tr></thead>
            <tbody>
              {nominees.map((n, i) => <tr key={i} className={"border-b border-amber-50 " + (i % 2 === 0 ? "bg-white" : "bg-amber-50/30")}>
                  <td className="px-2 py-2"><textarea value={n.nomineeNameAndAddress} onChange={e => setN(i, "nomineeNameAndAddress", e.target.value)} placeholder="Name and full address" rows={2} className={tbl_inp + " resize-none"} /></td>
                  <td className="px-2 py-2"><input value={n.relationship} onChange={e => setN(i, "relationship", e.target.value)} placeholder="e.g. Spouse" className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input type="date" value={n.dateOfBirth} onChange={e => setN(i, "dateOfBirth", e.target.value)} className={tbl_inp} /></td>
                  <td className="px-2 py-2"><input type="number" min="1" max="100" value={n.shareAmount} onChange={e => setN(i, "shareAmount", e.target.value)} placeholder="%" className={"w-16 " + tbl_inp} /></td>
                  <td className="px-2 py-2"><input value={n.guardianDetails} onChange={e => setN(i, "guardianDetails", e.target.value)} placeholder="Guardian name (if minor)" className={tbl_inp} /></td>
                  <td className="px-2 py-2 text-center">
                    {nominees.length > 1 && <button onClick={() => rmNominee(i)} type="button" className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[13px] font-bold text-white">&times;</button>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <div className={"mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold " + (total === 100 ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-700")}>
          {total === 100 ? <Check size={13} className="inline -mt-0.5" /> : <AlertTriangle size={13} className="inline -mt-0.5" />} Total Share: {total}% {total !== 100 ? "(must equal 100%)" : ""}
        </div>
      </SectionCard>
      {}
      <SectionCard icon={FileText} title="Declaration">
        <div className="grid grid-cols-2 gap-3">
          <F full label={<>Employee Name <AutoTag /></>}>
            <input readOnly className={inpRO} value={form.fullName || ""} placeholder="Fill in Joining Formalities tab" />
          </F>
          <F label="Place">
            <input className={inp} name="insPlace" value={form.insPlace || ""} onChange={set} placeholder="City / Place" />
          </F>
          <F label="Date" required>
            <input type="date" className={inp} name="insDeclarationDate" value={form.insDeclarationDate || ""} onChange={set} />
          </F>
          <F full>
            <SignatureUpload form={form} setForm={setForm} />
          </F>
        </div>
      </SectionCard>
    </div>;
}
export { InsuranceTab };
