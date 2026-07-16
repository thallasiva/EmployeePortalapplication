import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyJoiningToken, saveJoiningFormalities } from "../../api/joining.api";
import {
  CheckCircle, XCircle, ChevronRight, ChevronLeft,
  BookOpen, Shield, User, Heart, Building2, CreditCard, FileText
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────── */
const Input = ({ label, name, value, onChange, type = "text", required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

const Select = ({ label, name, value, onChange, options, required }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, name, value, onChange }) => (
  <div className="flex flex-col gap-1 col-span-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <textarea
      name={name}
      value={value || ""}
      onChange={onChange}
      rows={3}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    />
  </div>
);

const SectionCard = ({ icon: Icon, title, color, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 rounded-xl ${color}`}><Icon size={20} className="text-white" /></div>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

/* ─── STEPS config ─────────────────────────────────────────────────── */
const STEPS = [
  { id: "policies",    label: "Policies",           icon: BookOpen   },
  { id: "personal",    label: "Personal Details",    icon: User       },
  { id: "nominees",    label: "Nominee Forms",       icon: Heart      },
  { id: "pf",          label: "PF Declaration",      icon: Shield     },
  { id: "bank",        label: "Bank Details",        icon: CreditCard },
  { id: "review",      label: "Review & Submit",     icon: FileText   },
];

/* ─── main component ──────────────────────────────────────────────── */
const JoiningFormalities = () => {
  const { token } = useParams();
  const [inv,        setInv]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [step,       setStep]       = useState(0);
  const [saving,     setSaving]     = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const [form, setForm] = useState({
    handbookAcknowledged:   false,
    privacyPolicyAccepted:  false,
    fullName: "", dob: "", gender: "", bloodGroup: "",
    personalEmail: "", mobile: "",
    emergencyContactName: "", emergencyContactPhone: "",
    permanentAddress: "", currentAddress: "",
    termLifeNomineeName: "", termLifeNomineeRelation: "", termLifeNomineeDob: "", termLifeNomineeShare: "",
    gratuityNomineeName: "", gratuityNomineeRelation: "", gratuityNomineeDob: "", gratuityNomineeAddress: "",
    insuranceNomineeName: "", insuranceNomineeRelation: "", insuranceNomineeDob: "", insuranceNomineeShare: "",
    pfAccountNumber: "", uanNumber: "", pfExistingMember: false,
    pfNomineeName: "", pfNomineeRelation: "", pfNomineeDob: "", pfNomineeShare: "",
    bankName: "", accountNumber: "", ifscCode: "", accountHolderName: "",
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  useEffect(() => {
    if (!token) { setError("No invitation token found in URL."); setLoading(false); return; }
    verifyJoiningToken(token)
      .then((data) => {
        setInv(data);
        if (data.formality_status === "submitted" || data.formality_status === "pending_verification") {
          setSubmitted(true);
        }
        if (data.full_name) setForm((p) => ({ ...p, fullName: data.full_name }));
        if (data.handbook_acknowledged) setForm((p) => ({ ...p, handbookAcknowledged: true }));
      })
      .catch((err) => setError(err?.response?.data?.message || "This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const saveDraft = async () => {
    setSaving(true);
    try { await saveJoiningFormalities({ token, submit: false, ...form }); }
    catch {}
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!form.handbookAcknowledged || !form.privacyPolicyAccepted) {
      alert("Please acknowledge the Employee Handbook and Privacy Policy before submitting.");
      return;
    }
    setSaving(true);
    try {
      await saveJoiningFormalities({ token, submit: true, ...form });
      setSubmitted(true);
    } catch (err) {
      alert(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally { setSaving(false); }
  };

  /* ── Loading / Error / Submitted states ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Verifying your invitation...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h1>
        <p className="text-gray-500 text-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-4">Please contact HR for a new invitation link.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Formalities Submitted!</h1>
        <p className="text-gray-500 text-sm">
          Thank you, <strong>{inv?.candidate_name || "Candidate"}</strong>! Your joining formalities have been submitted and are pending HR verification.
        </p>
        <p className="text-gray-400 text-xs mt-4">You will receive an email once HR has reviewed your submission.</p>
      </div>
    </div>
  );

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 text-center">
        <h1 className="text-xl font-bold text-gray-800">Joining Formalities</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome, <strong>{inv?.candidate_name}</strong> &mdash; {inv?.job_title}
        </p>
      </div>

      {/* Step bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 overflow-x-auto">
        <div className="flex gap-1 min-w-max mx-auto max-w-3xl">
          {STEPS.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <button
                key={s.id}
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" :
                  done   ? "bg-emerald-50 text-emerald-700 cursor-pointer" :
                           "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <s.icon size={13} />
                {s.label}
                {done && <CheckCircle size={12} className="text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Step 0: Policies */}
        {step === 0 && (
          <div className="space-y-4">
            <SectionCard icon={BookOpen} title="Employee Handbook" color="bg-blue-500">
              <div className="col-span-2">
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 max-h-48 overflow-y-auto border border-gray-200 mb-3">
                  <p className="font-semibold mb-2">Employee Handbook Summary</p>
                  <p>This handbook outlines company policies, code of conduct, leave policies, working hours, performance expectations, disciplinary procedures, and employee benefits. By acknowledging this document you confirm you have read and understood all company policies.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="handbookAcknowledged" checked={form.handbookAcknowledged} onChange={set} className="mt-0.5 w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-gray-700">I have read and understood the Employee Handbook and agree to abide by all company policies. <span className="text-red-500">*</span></span>
                </label>
              </div>
            </SectionCard>

            <SectionCard icon={Shield} title="Privacy Policy" color="bg-purple-500">
              <div className="col-span-2">
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 max-h-48 overflow-y-auto border border-gray-200 mb-3">
                  <p className="font-semibold mb-2">Data Privacy Policy</p>
                  <p>We collect and process your personal data for employment purposes including payroll, attendance, performance management, and statutory compliance. Your data will be handled in accordance with applicable data protection laws and will not be shared with third parties without your consent, except as required by law.</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="privacyPolicyAccepted" checked={form.privacyPolicyAccepted} onChange={set} className="mt-0.5 w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-gray-700">I accept the Privacy Policy and consent to the processing of my personal data for employment purposes. <span className="text-red-500">*</span></span>
                </label>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4">
            <SectionCard icon={User} title="Personal Information" color="bg-blue-500">
              <Input label="Full Name" name="fullName" value={form.fullName} onChange={set} required />
              <Input label="Date of Birth" name="dob" value={form.dob} onChange={set} type="date" required />
              <Select label="Gender" name="gender" value={form.gender} onChange={set} options={["Male","Female","Other"]} required />
              <Select label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={set} options={["A+","A-","B+","B-","AB+","AB-","O+","O-"]} />
              <Input label="Personal Email" name="personalEmail" value={form.personalEmail} onChange={set} type="email" />
              <Input label="Mobile Number" name="mobile" value={form.mobile} onChange={set} required />
            </SectionCard>

            <SectionCard icon={Heart} title="Emergency Contact" color="bg-rose-500">
              <Input label="Contact Name" name="emergencyContactName" value={form.emergencyContactName} onChange={set} required />
              <Input label="Contact Phone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={set} required />
            </SectionCard>

            <SectionCard icon={Building2} title="Address" color="bg-amber-500">
              <Textarea label="Permanent Address" name="permanentAddress" value={form.permanentAddress} onChange={set} />
              <Textarea label="Current Address" name="currentAddress" value={form.currentAddress} onChange={set} />
            </SectionCard>
          </div>
        )}

        {/* Step 2: Nominee Forms */}
        {step === 2 && (
          <div className="space-y-4">
            <SectionCard icon={Heart} title="Term Life Insurance Nomination Form" color="bg-red-500">
              <Input label="Nominee Name" name="termLifeNomineeName" value={form.termLifeNomineeName} onChange={set} required />
              <Select label="Relationship" name="termLifeNomineeRelation" value={form.termLifeNomineeRelation} onChange={set} options={["Spouse","Father","Mother","Son","Daughter","Brother","Sister","Other"]} required />
              <Input label="Nominee Date of Birth" name="termLifeNomineeDob" value={form.termLifeNomineeDob} onChange={set} type="date" />
              <Input label="Share (%)" name="termLifeNomineeShare" value={form.termLifeNomineeShare} onChange={set} type="number" />
            </SectionCard>

            <SectionCard icon={Heart} title="Gratuity Nomination Form" color="bg-orange-500">
              <Input label="Nominee Name" name="gratuityNomineeName" value={form.gratuityNomineeName} onChange={set} required />
              <Select label="Relationship" name="gratuityNomineeRelation" value={form.gratuityNomineeRelation} onChange={set} options={["Spouse","Father","Mother","Son","Daughter","Brother","Sister","Other"]} required />
              <Input label="Nominee Date of Birth" name="gratuityNomineeDob" value={form.gratuityNomineeDob} onChange={set} type="date" />
              <Textarea label="Nominee Address" name="gratuityNomineeAddress" value={form.gratuityNomineeAddress} onChange={set} />
            </SectionCard>

            <SectionCard icon={Heart} title="Group Insurance Nomination Form" color="bg-pink-500">
              <Input label="Nominee Name" name="insuranceNomineeName" value={form.insuranceNomineeName} onChange={set} required />
              <Select label="Relationship" name="insuranceNomineeRelation" value={form.insuranceNomineeRelation} onChange={set} options={["Spouse","Father","Mother","Son","Daughter","Brother","Sister","Other"]} required />
              <Input label="Nominee Date of Birth" name="insuranceNomineeDob" value={form.insuranceNomineeDob} onChange={set} type="date" />
              <Input label="Share (%)" name="insuranceNomineeShare" value={form.insuranceNomineeShare} onChange={set} type="number" />
            </SectionCard>
          </div>
        )}

        {/* Step 3: PF Declaration */}
        {step === 3 && (
          <SectionCard icon={Shield} title="PF Declaration" color="bg-green-600">
            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" name="pfExistingMember" checked={form.pfExistingMember} onChange={set} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm text-gray-700">I am an existing PF member (have a UAN number)</span>
              </label>
            </div>
            <Input label="PF Account Number" name="pfAccountNumber" value={form.pfAccountNumber} onChange={set} />
            <Input label="UAN Number" name="uanNumber" value={form.uanNumber} onChange={set} />
            <Input label="Nominee Name" name="pfNomineeName" value={form.pfNomineeName} onChange={set} required />
            <Select label="Relationship" name="pfNomineeRelation" value={form.pfNomineeRelation} onChange={set} options={["Spouse","Father","Mother","Son","Daughter","Brother","Sister","Other"]} required />
            <Input label="Nominee Date of Birth" name="pfNomineeDob" value={form.pfNomineeDob} onChange={set} type="date" />
            <Input label="Share (%)" name="pfNomineeShare" value={form.pfNomineeShare} onChange={set} type="number" />
          </SectionCard>
        )}

        {/* Step 4: Bank Details */}
        {step === 4 && (
          <SectionCard icon={CreditCard} title="Bank Account Details" color="bg-blue-600">
            <Input label="Bank Name" name="bankName" value={form.bankName} onChange={set} required />
            <Input label="Account Number" name="accountNumber" value={form.accountNumber} onChange={set} required />
            <Input label="IFSC Code" name="ifscCode" value={form.ifscCode} onChange={set} required />
            <Input label="Account Holder Name" name="accountHolderName" value={form.accountHolderName} onChange={set} required />
          </SectionCard>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-600"><FileText size={20} className="text-white" /></div>
              <h2 className="text-base font-semibold text-gray-800">Review & Submit</h2>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["Handbook Acknowledged", form.handbookAcknowledged ? "Yes" : "No"],
                ["Privacy Policy Accepted", form.privacyPolicyAccepted ? "Yes" : "No"],
                ["Full Name", form.fullName],
                ["Date of Birth", form.dob],
                ["Gender", form.gender],
                ["Mobile", form.mobile],
                ["Emergency Contact", form.emergencyContactName],
                ["Term Life Nominee", form.termLifeNomineeName],
                ["Gratuity Nominee", form.gratuityNomineeName],
                ["Insurance Nominee", form.insuranceNomineeName],
                ["PF Nominee", form.pfNomineeName],
                ["Bank Name", form.bankName],
                ["Account Number", form.accountNumber],
                ["IFSC Code", form.ifscCode],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-800">{v || "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">By submitting, you confirm that all information provided is accurate and complete. This submission cannot be undone.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => { saveDraft(); setStep((s) => s - 1); }}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => { saveDraft(); setStep((s) => s + 1); }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save & Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Submitting..." : "Submit Formalities"}
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoiningFormalities;
