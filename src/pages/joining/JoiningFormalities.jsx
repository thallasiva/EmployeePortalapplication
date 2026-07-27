import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyJoiningToken, getJoiningForm, saveJoiningFormalities } from "../../api/joining.api";
import {
  CheckCircle, XCircle, BookOpen, FileText, User, Heart,
  Shield, CreditCard, Landmark, ClipboardList, ChevronRight, ChevronLeft
} from "lucide-react";

import HandbookTab      from "./tabs/HandbookTab";
import HRPolicyTab      from "./tabs/HRPolicyTab";
import PersonalInfoTab  from "./tabs/PersonalInfoTab";
import TermLifeTab      from "./tabs/TermLifeTab";
import GratuityTab      from "./tabs/GratuityTab";
import InsuranceTab     from "./tabs/InsuranceTab";
import PFDeclarationTab from "./tabs/PFDeclarationTab";
import BankDetailsTab   from "./tabs/BankDetailsTab";
import ReviewSubmitTab  from "./tabs/ReviewSubmitTab";

const TABS = [
  { id: "handbook",  label: "Employee Handbook",              icon: BookOpen      },
  { id: "hrpolicy",  label: "HR Policy Manual",               icon: FileText      },
  { id: "personal",  label: "Joining Formalities",            icon: User          },
  { id: "termlife",  label: "Team Life Insurance Nomination", icon: Heart         },
  { id: "gratuity",  label: "Gratuity Nomination Form",       icon: Shield        },
  { id: "insurance", label: "Insurance Nomination Form",      icon: ClipboardList },
  { id: "pf",        label: "PF Declaration",                 icon: Shield        },
  { id: "bank",      label: "Bank Details",                   icon: Landmark      },
  { id: "review",    label: "Review & Submit",                icon: CreditCard    },
];

/* Per-tab required field validation */
function validateTab(tab, form) {
  const errs = [];
  if (tab === 0 && !form.handbookAcknowledged)    errs.push("Please read and acknowledge the Employee Handbook.");
  if (tab === 1 && !form.hrPolicyAcknowledged)    errs.push("Please read and acknowledge the HR Policy Manual.");
  if (tab === 2) {
    if (!form.fullName)        errs.push("Full Name is required.");
    if (!form.dob)             errs.push("Date of Birth is required.");
    if (!form.fatherName)      errs.push("Father Name is required.");
    if (!form.maritalStatus)   errs.push("Marital Status is required.");
    if (!form.accountNumber)   errs.push("Bank Account Number is required.");
    if (!form.ifscCode)        errs.push("IFSC Code is required.");
    if (!form.accountHolderName) errs.push("Account Holder Name is required.");
    if (form.accountNumber && form.confirmAccountNumber && form.accountNumber !== form.confirmAccountNumber)
      errs.push("Bank account numbers do not match.");
    if (!form.signaturePreview) errs.push("Signature image upload is required.");
  }
  if (tab === 3) {
    // Auto-populated from Personal Info — validate shared fields
    if (!form.fullName)        errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName)      errs.push("Father's/Husband's Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob)             errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Address is required — please fill in the Joining Formalities tab first.");
    if (!form.tlSex)           errs.push("Sex is required.");
    const nominees = form.termLifeNominees || [];
    if (nominees.length === 0) errs.push("At least one nominee is required.");
    nominees.forEach((n,i) => {
      if (!n.nomineeNameAndAddress) errs.push("Nominee " + (i+1) + " Name & Address is required.");
      if (!n.relationship)          errs.push("Nominee " + (i+1) + " Relationship is required.");
      if (!n.dateOfBirth)           errs.push("Nominee " + (i+1) + " Date of Birth is required.");
      if (!n.shareAmount)           errs.push("Nominee " + (i+1) + " Share % is required.");
    });
    const total = nominees.reduce((s,n) => s + (Number(n.shareAmount)||0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Term Life nominee share total must equal 100%.");
    if (!form.tlDeclarationDate)  errs.push("Declaration Date is required.");
    if (!form.signaturePreview)   errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 4) {
    // Auto-populated from Personal Info
    if (!form.fullName)        errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Permanent Address is required — please fill in the Joining Formalities tab first.");
    if (!form.gratuitySex)                  errs.push("Sex is required.");
    if (!form.gratuityReligion)             errs.push("Religion is required.");
    if (!form.gratuityMaritalStatus)        errs.push("Marital Status is required.");
    if (!form.gratuityDepartmentBranchSection) errs.push("Department/Branch/Section is required.");
    const nominees = form.gratuityNominees || [];
    if (nominees.length === 0) errs.push("At least one gratuity nominee is required.");
    nominees.forEach((n,i) => {
      if (!n.fullNameAndAddress) errs.push("Gratuity nominee " + (i+1) + " Name & Address is required.");
      if (!n.relationship)       errs.push("Gratuity nominee " + (i+1) + " Relationship is required.");
      if (!n.age)                errs.push("Gratuity nominee " + (i+1) + " Age is required.");
      if (!n.sharePercentage)    errs.push("Gratuity nominee " + (i+1) + " Share % is required.");
    });
    const total = nominees.reduce((s,n) => s + (Number(n.sharePercentage)||0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Gratuity nominee share total must equal 100%.");
    if (!form.gratuityPlace)    errs.push("Place is required.");
    if (!form.gratuityDate)     errs.push("Date is required.");
    if (!form.signaturePreview) errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 5) {
    // Auto-populated from Personal Info
    if (!form.fullName)        errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName)      errs.push("Father's/Husband's Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob)             errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Address is required — please fill in the Joining Formalities tab first.");
    if (!form.insSex)          errs.push("Sex is required.");
    const nominees = form.insNominees || [];
    if (nominees.length === 0) errs.push("At least one insurance nominee is required.");
    nominees.forEach((n,i) => {
      if (!n.nomineeNameAndAddress) errs.push("Insurance nominee " + (i+1) + " Name & Address is required.");
      if (!n.relationship)          errs.push("Insurance nominee " + (i+1) + " Relationship is required.");
      if (!n.dateOfBirth)           errs.push("Insurance nominee " + (i+1) + " Date of Birth is required.");
      if (!n.shareAmount)           errs.push("Insurance nominee " + (i+1) + " Share % is required.");
    });
    const total = nominees.reduce((s,n) => s + (Number(n.shareAmount)||0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Insurance nominee share total must equal 100%.");
    if (!form.insDeclarationDate)  errs.push("Declaration Date is required.");
    if (!form.signaturePreview)    errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 6) {
    // Auto-populated from Personal Info
    if (!form.fullName)        errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob)             errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName)      errs.push("Father/Spouse Name is required — please fill in the Joining Formalities tab first.");
    if (!form.pfRelationType)          errs.push("Relation Type (Father/Spouse) is required.");
    if (!form.pfGender)                errs.push("Gender is required.");
    if (!form.pfMaritalStatus)         errs.push("Marital Status is required.");
    if (!form.pfEpf1952)               errs.push("Earlier EPF 1952 membership is required.");
    if (!form.pfEps1995)               errs.push("Earlier EPS 1995 membership is required.");
    if (!form.pfInternationalWorker)   errs.push("International Worker status is required.");
    if (!form.pfEducationalQualification) errs.push("Educational Qualification is required.");
    if (!form.pfSpeciallyAbled)        errs.push("Specially Abled status is required.");
    if (!form.pfDeclarationAccepted)   errs.push("Please accept the PF declaration.");
    if (!form.pfPlace)                 errs.push("Place is required.");
    if (!form.signaturePreview)        errs.push("Signature image is required — please upload in the Declaration section.");
  }
  return errs;
}

export default function JoiningFormalities() {
  const { token } = useParams();
  const [inv,       setInv]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [tab,       setTab]       = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [visited,   setVisited]   = useState(new Set([0]));
  const [validErrs, setValidErrs] = useState([]);

  const [form, setForm] = useState({
    /* Handbook / HR Policy */
    handbookAcknowledged: false,
    hrPolicyAcknowledged: false,

    /* Joining Formalities — Personal */
    fullName: "", dob: "", actualDob: "", panNo: "", fatherName: "",
    maritalStatus: "", spouseName: "", photoFile: null, photoPreview: "",
    signatureFile: null, signaturePreview: "",
    presentAddress: "", permanentAddress: "",
    /* Education rows */
    education: [{ qualification: "", institute: "", specialization: "", year: "" }],
    /* Reference rows */
    references: [{ name: "", occupation: "", relationship: "", contact: "" }],
    /* Bank */
    bankName: "ICICI Bank", accountHolderName: "", accountNumber: "", confirmAccountNumber: "",
    ifscCode: "", branchDetails: "", accountType: "",
    /* Joining Letter */
    joiningDateText: "", designationText: "",

    /* Term Life Insurance */
    tlEmployeeName: "", tlFatherOrHusbandName: "", tlDateOfBirth: "", tlSex: "", tlEmployeeId: "", tlAddress: "",
    termLifeNominees: [{ nomineeNameAndAddress: "", relationship: "", dateOfBirth: "", shareAmount: "100", guardianDetails: "" }],
    tlDeclarationEmployeeName: "", tlDeclarationDate: "", tlPlace: "", tlDate: "", tlSignature: "",

    /* Gratuity */
    gratuityEmployeeIntroName: "", gratuitySpouseExclusionDate: "", gratuitySex: "", gratuityReligion: "",
    gratuityMaritalStatus: "", gratuityDepartmentBranchSection: "", gratuityEmployeeId: "", gratuityDateOfJoining: "",
    gratuityPermanentAddress: "", gratuityPlace: "", gratuityDate: "", gratuityEmployeeSignature: "",
    gratuityEmployeeStatementNameAndAddress: "",
    gratuityNominees: [{ fullNameAndAddress: "", relationship: "", age: "", sharePercentage: "100" }],
    gratuityWitnesses: [{ nameAndAddress: "" }, { nameAndAddress: "" }],

    /* Insurance */
    insEmployeeName: "", insFatherOrHusbandName: "", insDateOfBirth: "", insSex: "", insEmployeeId: "", insAddress: "",
    insNominees: [{ nomineeNameAndAddress: "", relationship: "", dateOfBirth: "", shareAmount: "100", guardianDetails: "" }],
    insDeclarationEmployeeName: "", insDeclarationDate: "", insPlace: "", insDate: "", insSignature: "",

    /* PF Declaration */
    pfEmployeeName: "", pfDateOfBirth: "", pfFatherOrSpouseName: "", pfRelationType: "",
    pfGender: "", pfMaritalStatus: "", pfEmail: "", pfMobileNo: "",
    pfEpf1952: "", pfEps1995: "", pfUan: "", pfPreviousPf: "", pfExitPreviousEmployment: "",
    pfSchemeCertificateNo: "", pfPpo: "",
    pfInternationalWorker: "", pfCountryOrigin: "", pfPassportNo: "", pfPassportValidity: "",
    pfEducationalQualification: "", pfSpeciallyAbled: "", pfDisabilityCategory: "",
    pfBankAccNo: "", pfIfscCode: "", pfAadharNo: "", pfDoHavePan: "", pfPan: "",
    pfPlace: "", pfDeclarationAccepted: false, pfEmployeeSignature: "",
  });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const tryParse = (v, fallback) => {
    try { const r = JSON.parse(v); return Array.isArray(r) && r.length ? r : fallback; } catch { return fallback; }
  };

  useEffect(() => {
    if (!token) { setError("No invitation token found in URL."); setLoading(false); return; }
    verifyJoiningToken(token)
      .then(async data => {
        setInv(data);
        // Show "submitted" screen for terminal states; "changes_requested" reopens the form
        if (["submitted","pending_verification","approved"].includes(data.formality_status)) {
          setSubmitted(true);
          setLoading(false);
          return;
        }

        // ── Pre-populate from invitation data (name, email, mobile from candidate record)
        const invName   = data.candidate_name   || "";
        const invEmail  = data.candidate_email  || "";
        const invMobile = data.candidate_mobile || "";

        // If first time (no saved draft yet), seed the form with candidate details
        if (!data.formality_id) {
          setForm(p => ({
            ...p,
            fullName:    invName,
            pfEmail:     invEmail,
            pfMobileNo:  invMobile,
            // Also pre-fill repeated name fields used in nomination tabs
            tlEmployeeName:            invName,
            tlDeclarationEmployeeName: invName,
            gratuityEmployeeIntroName: invName,
            gratuityEmployeeStatementNameAndAddress: invName,
            insEmployeeName:            invName,
            insDeclarationEmployeeName: invName,
            pfEmployeeName:             invName,
          }));
          setLoading(false);
          return;
        }

        // If there are previously-saved fields (draft or changes_requested), load them all
        if (data.formality_id) {
          try {
            const saved = await getJoiningForm(token);
            if (saved) {
              setForm(p => ({
                ...p,
                // Personal — use saved value, fall back to invitation data, then existing state
                fullName:             saved.full_name          || invName   || p.fullName,
                dob:                  saved.dob                || p.dob,
                actualDob:            saved.actual_dob         || p.actualDob,
                panNo:                saved.pan_no             || p.panNo,
                fatherName:           saved.father_name        || p.fatherName,
                maritalStatus:        saved.marital_status     || p.maritalStatus,
                spouseName:           saved.spouse_name        || p.spouseName,
                presentAddress:       saved.present_address    || p.presentAddress,
                permanentAddress:     saved.permanent_address  || p.permanentAddress,
                photoPreview:         saved.photo_url          || p.photoPreview,
                signaturePreview:     saved.signature_url      || p.signaturePreview,
                joiningDateText:      saved.joining_date_text  || p.joiningDateText,
                designationText:      saved.designation_text   || p.designationText,
                // Acknowledgements
                handbookAcknowledged: !!saved.handbook_acknowledged,
                hrPolicyAcknowledged: !!saved.privacy_policy_accepted,
                // Arrays
                education:            tryParse(saved.education_json,    p.education),
                references:           tryParse(saved.references_json,   p.references),
                termLifeNominees:     tryParse(saved.term_life_nominees_json, p.termLifeNominees),
                gratuityNominees:     tryParse(saved.gratuity_nominees_json,  p.gratuityNominees),
                gratuityWitnesses:    tryParse(saved.gratuity_witnesses_json, p.gratuityWitnesses),
                insNominees:          tryParse(saved.ins_nominees_json,  p.insNominees),
                // Bank
                bankName:             saved.bank_name           || p.bankName,
                accountHolderName:    saved.account_holder_name || p.accountHolderName,
                accountNumber:        saved.account_number      || p.accountNumber,
                confirmAccountNumber: saved.account_number      || p.confirmAccountNumber,
                ifscCode:             saved.ifsc_code           || p.ifscCode,
                branchDetails:        saved.branch_details      || p.branchDetails,
                // TL fields
                tlEmployeeName:             saved.tl_employee_name             || invName || p.tlEmployeeName,
                tlFatherOrHusbandName:      saved.tl_father_or_husband_name    || p.tlFatherOrHusbandName,
                tlDateOfBirth:              saved.tl_date_of_birth             || p.tlDateOfBirth,
                tlSex:                      saved.tl_sex                       || p.tlSex,
                tlEmployeeId:               saved.tl_employee_id               || p.tlEmployeeId,
                tlAddress:                  saved.tl_address                   || p.tlAddress,
                tlDeclarationEmployeeName:  saved.tl_declaration_employee_name || invName || p.tlDeclarationEmployeeName,
                tlDeclarationDate:          saved.tl_declaration_date          || p.tlDeclarationDate,
                tlPlace:                    saved.tl_place                     || p.tlPlace,
                // Gratuity fields
                gratuityEmployeeIntroName:        saved.gratuity_employee_intro_name          || invName || p.gratuityEmployeeIntroName,
                gratuitySex:                      saved.gratuity_sex                          || p.gratuitySex,
                gratuityReligion:                 saved.gratuity_religion                     || p.gratuityReligion,
                gratuityMaritalStatus:            saved.gratuity_marital_status               || p.gratuityMaritalStatus,
                gratuityDepartmentBranchSection:  saved.gratuity_department_branch_section    || p.gratuityDepartmentBranchSection,
                gratuityEmployeeId:               saved.gratuity_employee_id                  || p.gratuityEmployeeId,
                gratuityDateOfJoining:            saved.gratuity_date_of_joining              || p.gratuityDateOfJoining,
                gratuityPermanentAddress:         saved.gratuity_permanent_address            || p.gratuityPermanentAddress,
                gratuityPlace:                    saved.gratuity_place                        || p.gratuityPlace,
                gratuityDate:                     saved.gratuity_date                         || p.gratuityDate,
                // Insurance fields
                insEmployeeName:            saved.ins_employee_name            || invName || p.insEmployeeName,
                insFatherOrHusbandName:     saved.ins_father_or_husband_name   || p.insFatherOrHusbandName,
                insDateOfBirth:             saved.ins_date_of_birth            || p.insDateOfBirth,
                insSex:                     saved.ins_sex                      || p.insSex,
                insEmployeeId:              saved.ins_employee_id              || p.insEmployeeId,
                insAddress:                 saved.ins_address                  || p.insAddress,
                insDeclarationEmployeeName: saved.ins_declaration_employee_name || invName || p.insDeclarationEmployeeName,
                insDeclarationDate:         saved.ins_declaration_date         || p.insDeclarationDate,
                // PF fields
                pfEmployeeName:           saved.pf_employee_name           || invName || p.pfEmployeeName,
                pfDateOfBirth:            saved.pf_date_of_birth           || p.pfDateOfBirth,
                pfFatherOrSpouseName:     saved.pf_father_or_spouse_name   || p.pfFatherOrSpouseName,
                pfRelationType:           saved.pf_relation_type           || p.pfRelationType,
                pfGender:                 saved.pf_gender                  || p.pfGender,
                pfMaritalStatus:          saved.pf_marital_status          || p.pfMaritalStatus,
                pfEmail:                  saved.pf_email                   || invEmail  || p.pfEmail,
                pfMobileNo:               saved.pf_mobile_no               || invMobile || p.pfMobileNo,
                pfEpf1952:                saved.pf_epf_1952                || p.pfEpf1952,
                pfEps1995:                saved.pf_eps_1995                || p.pfEps1995,
                pfUan:                    saved.pf_uan                     || p.pfUan,
                pfPreviousPf:             saved.pf_previous_pf             || p.pfPreviousPf,
                pfInternationalWorker:    saved.pf_international_worker    || p.pfInternationalWorker,
                pfEducationalQualification: saved.pf_educational_qualification || p.pfEducationalQualification,
                pfSpeciallyAbled:         saved.pf_specially_abled         || p.pfSpeciallyAbled,
                pfDisabilityCategory:     saved.pf_disability_category     || p.pfDisabilityCategory,
                pfBankAccNo:              saved.pf_bank_acc_no             || p.pfBankAccNo,
                pfIfscCode:               saved.pf_ifsc_code               || p.pfIfscCode,
                pfAadharNo:               saved.pf_aadhar_no               || p.pfAadharNo,
                pfDoHavePan:              saved.pf_do_have_pan             || p.pfDoHavePan,
                pfPan:                    saved.pf_pan                     || p.pfPan,
                pfPlace:                  saved.pf_place                   || p.pfPlace,
                pfDeclarationAccepted:    !!saved.pf_declaration_accepted,
              }));
            }
          } catch { /* ignore — form stays at defaults */ }
        }
      })
      .catch(err => setError(err?.response?.data?.message || "This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  /** Build payload as FormData (to support file uploads) or plain JSON */
  const buildPayload = (submitFlag) => {
    const { photoFile, photoPreview, signatureFile, signaturePreview,
            aadharDocFile, aadharDocName, panDocFile, panDocName, ...rest } = form;

    const hasFiles = !!(aadharDocFile || panDocFile);

    if (hasFiles) {
      const fd = new FormData();
      fd.append('token', token);
      fd.append('submit', submitFlag ? '1' : '0');
      fd.append('photo_url',     photoPreview     || '');
      fd.append('signature_url', signaturePreview || '');
      Object.entries(rest).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      });
      if (aadharDocFile) fd.append('aadhar_doc', aadharDocFile);
      if (panDocFile)    fd.append('pan_doc',    panDocFile);
      return fd;
    }

    return {
      token,
      submit:        submitFlag,
      photo_url:     photoPreview     || null,
      signature_url: signaturePreview || null,
      ...rest,
    };
  };

  const saveDraft = async () => {
    try { await saveJoiningFormalities(buildPayload(false)); } catch {}
  };

  const goTo = async (idx) => {
    /* Validate current tab before moving forward */
    if (idx > tab) {
      const errs = validateTab(tab, form);
      if (errs.length > 0) { setValidErrs(errs); window.scrollTo(0, 0); return; }
    }
    setValidErrs([]);
    await saveDraft();
    setTab(idx);
    setVisited(v => new Set([...v, idx]));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    const allErrs = [6,5,4,3,2,1,0].flatMap(t => validateTab(t, form));
    if (!form.handbookAcknowledged) allErrs.unshift("Please acknowledge the Employee Handbook.");
    if (!form.hrPolicyAcknowledged) allErrs.unshift("Please acknowledge the HR Policy Manual.");
    if (allErrs.length > 0) { setValidErrs(allErrs); window.scrollTo(0,0); return; }
    setSaving(true);
    try {
      await saveJoiningFormalities(buildPayload(true));
      setSubmitted(true);
    } catch (err) {
      setValidErrs([err?.response?.data?.message || "Submission failed. Please try again."]);
    } finally { setSaving(false); }
  };

  /* ── Loading / Error / Submitted screens ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Verifying your invitation...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <XCircle size={52} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h1>
        <p className="text-gray-500 text-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-4">Please contact HR for a new invitation link.</p>
      </div>
    </div>
  );
  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Formalities Submitted!</h1>
        <p className="text-gray-500 text-sm">
          Thank you, <strong>{inv?.candidate_name || "Candidate"}</strong>! Your joining
          formalities have been submitted and are pending HR verification.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold" style={{backgroundColor:"#d97706"}}>
          <CheckCircle size={14} /> Submitted Successfully
        </div>
      </div>
    </div>
  );

  const TAB_COMPONENTS = [
    <HandbookTab      form={form} set={set} setForm={setForm} />,
    <HRPolicyTab      form={form} set={set} setForm={setForm} />,
    <PersonalInfoTab  form={form} set={set} setForm={setForm} />,
    <TermLifeTab      form={form} set={set} setForm={setForm} />,
    <GratuityTab      form={form} set={set} setForm={setForm} />,
    <InsuranceTab     form={form} set={set} setForm={setForm} />,
    <PFDeclarationTab form={form} set={set} setForm={setForm} />,
    <BankDetailsTab   form={form} set={set} />,
    <ReviewSubmitTab  form={form} />,
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#1e3a5f] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">Joining Formalities</h1>
            <p className="text-[13px] text-amber-200 mt-0.5">
              Welcome, <strong className="text-white">{inv?.candidate_name}</strong>
              {inv?.job_title ? <> &mdash; {inv.job_title}</> : ""}
            </p>
          </div>
          <div className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white border border-white/30" style={{backgroundColor:"#d97706"}}>
            {inv?.formality_status === "submitted"         ? "Submitted"
              : inv?.formality_status === "pending_verification" ? "Under Review"
              : inv?.formality_status === "changes_requested"    ? "⚠ Changes Requested"
              : "In Progress"}
          </div>
        </div>
      </div>

      {/* Changes Requested Banner */}
      {inv?.formality_status === "changes_requested" && (
        <div className="max-w-5xl mx-auto mt-4 px-4">
          <div className="flex items-start gap-3 rounded-xl border-2 px-4 py-3.5" style={{borderColor:"#d97706", backgroundColor:"#fef9ee"}}>
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="text-[13px] font-bold text-amber-900">HR has requested changes to your submission</p>
              {inv?.hr_remarks
                ? <p className="text-[12px] text-amber-800 mt-1 leading-relaxed">{inv.hr_remarks}</p>
                : <p className="text-[12px] text-amber-700 mt-1">Please review your information, make the required corrections, and re-submit.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-[#f18200] px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2">
          {TABS.map((t, i) => {
            const isActive = i === tab;
            const isDone   = visited.has(i) && i < tab;
            return (
              <button key={t.id} onClick={() => goTo(i)}
                style={isActive
                  ? { backgroundColor: "#ffffff", color: "#d97706" }
                  : { backgroundColor: "#fbcd97", color: "#92400e" }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap shadow-sm hover:opacity-90">
                {isDone
                  ? <CheckCircle size={12} style={{color: isActive ? "#d97706" : "#86efac"}} />
                  : <t.icon size={12} />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Validation errors */}
        {validErrs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[13px] font-semibold text-red-700 mb-2">Please fix the following before continuing:</p>
            <ul className="list-disc list-inside space-y-1">
              {validErrs.map((e,i) => <li key={i} className="text-[12px] text-red-600">{e}</li>)}
            </ul>
          </div>
        )}

        {/* Active tab content */}
        {TAB_COMPONENTS[tab]}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => goTo(tab - 1)} disabled={tab === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-[#d97706] bg-white border border-[#d97706] hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
            <ChevronLeft size={15} /> Previous
          </button>
          {tab < TABS.length - 1 ? (
            <button onClick={() => goTo(tab + 1)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium text-white shadow-sm" style={{backgroundColor:"#d97706"}}>
              Save &amp; Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-sm" style={{backgroundColor:"#d97706"}}>
              {saving ? "Submitting..." : "Submit Formalities"}
              <CheckCircle size={15} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
