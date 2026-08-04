export function hydrateFormFromSaved(saved, invName, invEmail, invMobile, p) {
  return {
    ...p,
    fullName: saved.full_name || invName || p.fullName,
    dob: saved.dob || p.dob,
    actualDob: saved.actual_dob || p.actualDob,
    panNo: saved.pan_no || p.panNo,
    fatherName: saved.father_name || p.fatherName,
    maritalStatus: saved.marital_status || p.maritalStatus,
    spouseName: saved.spouse_name || p.spouseName,
    presentAddress: saved.present_address || p.presentAddress,
    permanentAddress: saved.permanent_address || p.permanentAddress,
    photoPreview: saved.photo_url || p.photoPreview,
    signaturePreview: saved.signature_url || p.signaturePreview,
    joiningDateText: saved.joining_date_text || p.joiningDateText,
    designationText: saved.designation_text || p.designationText,
    handbookAcknowledged: !!saved.handbook_acknowledged,
    hrPolicyAcknowledged: !!saved.privacy_policy_accepted,
    education: tryParse(saved.education_json, p.education),
    references: tryParse(saved.references_json, p.references),
    termLifeNominees: tryParse(saved.term_life_nominees_json, p.termLifeNominees),
    gratuityNominees: tryParse(saved.gratuity_nominees_json, p.gratuityNominees),
    gratuityWitnesses: tryParse(saved.gratuity_witnesses_json, p.gratuityWitnesses),
    insNominees: tryParse(saved.ins_nominees_json, p.insNominees),
    bankName: saved.bank_name || p.bankName,
    accountHolderName: saved.account_holder_name || p.accountHolderName,
    accountNumber: saved.account_number || p.accountNumber,
    confirmAccountNumber: saved.account_number || p.confirmAccountNumber,
    ifscCode: saved.ifsc_code || p.ifscCode,
    branchDetails: saved.branch_details || p.branchDetails,
    tlEmployeeName: saved.tl_employee_name || invName || p.tlEmployeeName,
    tlFatherOrHusbandName: saved.tl_father_or_husband_name || p.tlFatherOrHusbandName,
    tlDateOfBirth: saved.tl_date_of_birth || p.tlDateOfBirth,
    tlSex: saved.tl_sex || p.tlSex,
    tlEmployeeId: saved.tl_employee_id || p.tlEmployeeId,
    tlAddress: saved.tl_address || p.tlAddress,
    tlDeclarationEmployeeName: saved.tl_declaration_employee_name || invName || p.tlDeclarationEmployeeName,
    tlDeclarationDate: saved.tl_declaration_date || p.tlDeclarationDate,
    tlPlace: saved.tl_place || p.tlPlace,
    gratuityEmployeeIntroName: saved.gratuity_employee_intro_name || invName || p.gratuityEmployeeIntroName,
    gratuitySex: saved.gratuity_sex || p.gratuitySex,
    gratuityReligion: saved.gratuity_religion || p.gratuityReligion,
    gratuityMaritalStatus: saved.gratuity_marital_status || p.gratuityMaritalStatus,
    gratuityDepartmentBranchSection: saved.gratuity_department_branch_section || p.gratuityDepartmentBranchSection,
    gratuityEmployeeId: saved.gratuity_employee_id || p.gratuityEmployeeId,
    gratuityDateOfJoining: saved.gratuity_date_of_joining || p.gratuityDateOfJoining,
    gratuityPermanentAddress: saved.gratuity_permanent_address || p.gratuityPermanentAddress,
    gratuityPlace: saved.gratuity_place || p.gratuityPlace,
    gratuityDate: saved.gratuity_date || p.gratuityDate,
    insEmployeeName: saved.ins_employee_name || invName || p.insEmployeeName,
    insFatherOrHusbandName: saved.ins_father_or_husband_name || p.insFatherOrHusbandName,
    insDateOfBirth: saved.ins_date_of_birth || p.insDateOfBirth,
    insSex: saved.ins_sex || p.insSex,
    insEmployeeId: saved.ins_employee_id || p.insEmployeeId,
    insAddress: saved.ins_address || p.insAddress,
    insDeclarationEmployeeName: saved.ins_declaration_employee_name || invName || p.insDeclarationEmployeeName,
    insDeclarationDate: saved.ins_declaration_date || p.insDeclarationDate,
    pfEmployeeName: saved.pf_employee_name || invName || p.pfEmployeeName,
    pfDateOfBirth: saved.pf_date_of_birth || p.pfDateOfBirth,
    pfFatherOrSpouseName: saved.pf_father_or_spouse_name || p.pfFatherOrSpouseName,
    pfRelationType: saved.pf_relation_type || p.pfRelationType,
    pfGender: saved.pf_gender || p.pfGender,
    pfMaritalStatus: saved.pf_marital_status || p.pfMaritalStatus,
    pfEmail: saved.pf_email || invEmail || p.pfEmail,
    pfMobileNo: saved.pf_mobile_no || invMobile || p.pfMobileNo,
    pfEpf1952: saved.pf_epf_1952 || p.pfEpf1952,
    pfEps1995: saved.pf_eps_1995 || p.pfEps1995,
    pfUan: saved.pf_uan || p.pfUan,
    pfPreviousPf: saved.pf_previous_pf || p.pfPreviousPf,
    pfInternationalWorker: saved.pf_international_worker || p.pfInternationalWorker,
    pfEducationalQualification: saved.pf_educational_qualification || p.pfEducationalQualification,
    pfSpeciallyAbled: saved.pf_specially_abled || p.pfSpeciallyAbled,
    pfDisabilityCategory: saved.pf_disability_category || p.pfDisabilityCategory,
    pfBankAccNo: saved.pf_bank_acc_no || p.pfBankAccNo,
    pfIfscCode: saved.pf_ifsc_code || p.pfIfscCode,
    pfAadharNo: saved.pf_aadhar_no || p.pfAadharNo,
    pfDoHavePan: saved.pf_do_have_pan || p.pfDoHavePan,
    pfPan: saved.pf_pan || p.pfPan,
    pfPlace: saved.pf_place || p.pfPlace,
    pfDeclarationAccepted: !!saved.pf_declaration_accepted
  };
}

export function tryParse(v, fallback) {
  try {
    const r = JSON.parse(v);
    return Array.isArray(r) && r.length ? r : fallback;
  } catch {
    return fallback;
  }
}

export function validateTab(tab, form) {
  const errs = [];
  if (tab === 0 && !form.handbookAcknowledged) errs.push("Please read and acknowledge the Employee Handbook.");
  if (tab === 1 && !form.hrPolicyAcknowledged) errs.push("Please read and acknowledge the HR Policy Manual.");
  if (tab === 2) {
    if (!form.fullName) errs.push("Full Name is required.");
    if (!form.dob) errs.push("Date of Birth is required.");
    if (!form.fatherName) errs.push("Father Name is required.");
    if (!form.maritalStatus) errs.push("Marital Status is required.");
    if (!form.accountNumber) errs.push("Bank Account Number is required.");
    if (!form.ifscCode) errs.push("IFSC Code is required.");
    if (!form.accountHolderName) errs.push("Account Holder Name is required.");
    if (form.accountNumber && form.confirmAccountNumber && form.accountNumber !== form.confirmAccountNumber)
      errs.push("Bank account numbers do not match.");
    if (!form.signaturePreview) errs.push("Signature image upload is required.");
  }
  if (tab === 3) {
    if (!form.fullName) errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName) errs.push("Father's/Husband's Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob) errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Address is required — please fill in the Joining Formalities tab first.");
    if (!form.tlSex) errs.push("Sex is required.");
    const nominees = form.termLifeNominees || [];
    if (nominees.length === 0) errs.push("At least one nominee is required.");
    nominees.forEach((n, i) => {
      if (!n.nomineeNameAndAddress) errs.push("Nominee " + (i + 1) + " Name & Address is required.");
      if (!n.relationship) errs.push("Nominee " + (i + 1) + " Relationship is required.");
      if (!n.dateOfBirth) errs.push("Nominee " + (i + 1) + " Date of Birth is required.");
      if (!n.shareAmount) errs.push("Nominee " + (i + 1) + " Share % is required.");
    });
    const total = nominees.reduce((s, n) => s + (Number(n.shareAmount) || 0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Term Life nominee share total must equal 100%.");
    if (!form.tlDeclarationDate) errs.push("Declaration Date is required.");
    if (!form.signaturePreview) errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 4) {
    if (!form.fullName) errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Permanent Address is required — please fill in the Joining Formalities tab first.");
    if (!form.gratuitySex) errs.push("Sex is required.");
    if (!form.gratuityReligion) errs.push("Religion is required.");
    if (!form.gratuityMaritalStatus) errs.push("Marital Status is required.");
    if (!form.gratuityDepartmentBranchSection) errs.push("Department/Branch/Section is required.");
    const nominees = form.gratuityNominees || [];
    if (nominees.length === 0) errs.push("At least one gratuity nominee is required.");
    nominees.forEach((n, i) => {
      if (!n.fullNameAndAddress) errs.push("Gratuity nominee " + (i + 1) + " Name & Address is required.");
      if (!n.relationship) errs.push("Gratuity nominee " + (i + 1) + " Relationship is required.");
      if (!n.age) errs.push("Gratuity nominee " + (i + 1) + " Age is required.");
      if (!n.sharePercentage) errs.push("Gratuity nominee " + (i + 1) + " Share % is required.");
    });
    const total = nominees.reduce((s, n) => s + (Number(n.sharePercentage) || 0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Gratuity nominee share total must equal 100%.");
    if (!form.gratuityPlace) errs.push("Place is required.");
    if (!form.gratuityDate) errs.push("Date is required.");
    if (!form.signaturePreview) errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 5) {
    if (!form.fullName) errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName) errs.push("Father's/Husband's Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob) errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.permanentAddress) errs.push("Address is required — please fill in the Joining Formalities tab first.");
    if (!form.insSex) errs.push("Sex is required.");
    const nominees = form.insNominees || [];
    if (nominees.length === 0) errs.push("At least one insurance nominee is required.");
    nominees.forEach((n, i) => {
      if (!n.nomineeNameAndAddress) errs.push("Insurance nominee " + (i + 1) + " Name & Address is required.");
      if (!n.relationship) errs.push("Insurance nominee " + (i + 1) + " Relationship is required.");
      if (!n.dateOfBirth) errs.push("Insurance nominee " + (i + 1) + " Date of Birth is required.");
      if (!n.shareAmount) errs.push("Insurance nominee " + (i + 1) + " Share % is required.");
    });
    const total = nominees.reduce((s, n) => s + (Number(n.shareAmount) || 0), 0);
    if (nominees.length > 0 && total !== 100) errs.push("Insurance nominee share total must equal 100%.");
    if (!form.insDeclarationDate) errs.push("Declaration Date is required.");
    if (!form.signaturePreview) errs.push("Signature image is required — please upload in the Declaration section.");
  }
  if (tab === 6) {
    if (!form.fullName) errs.push("Employee Name is required — please fill in the Joining Formalities tab first.");
    if (!form.dob) errs.push("Date of Birth is required — please fill in the Joining Formalities tab first.");
    if (!form.fatherName) errs.push("Father/Spouse Name is required — please fill in the Joining Formalities tab first.");
    if (!form.pfRelationType) errs.push("Relation Type (Father/Spouse) is required.");
    if (!form.pfGender) errs.push("Gender is required.");
    if (!form.pfMaritalStatus) errs.push("Marital Status is required.");
    if (!form.pfEpf1952) errs.push("Earlier EPF 1952 membership is required.");
    if (!form.pfEps1995) errs.push("Earlier EPS 1995 membership is required.");
    if (!form.pfInternationalWorker) errs.push("International Worker status is required.");
    if (!form.pfEducationalQualification) errs.push("Educational Qualification is required.");
    if (!form.pfSpeciallyAbled) errs.push("Specially Abled status is required.");
    if (!form.pfDeclarationAccepted) errs.push("Please accept the PF declaration.");
    if (!form.pfPlace) errs.push("Place is required.");
    if (!form.signaturePreview) errs.push("Signature image is required — please upload in the Declaration section.");
  }
  return errs;
}

/** Convert a base64 data-URL to a Blob so it can be sent as a file upload
 *  instead of a large text field (avoids Multer fieldSize limit errors). */
function dataURLtoBlob(dataURL) {
  const [header, b64] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function buildPayload(form, token, submitFlag) {
  const { photoFile, photoPreview, signatureFile, signaturePreview,
    aadharDocFile, aadharDocName, panDocFile, panDocName, ...rest } = form;

  const hasFiles = !!(aadharDocFile || panDocFile || photoPreview || signaturePreview);

  if (hasFiles) {
    const fd = new FormData();
    fd.append("token", token);
    fd.append("submit", submitFlag ? "1" : "0");

    // Send photo & signature as file uploads (not base64 text fields)
    // to avoid Multer fieldSize limit errors.
    if (photoPreview && photoPreview.startsWith("data:")) {
      fd.append("photo", dataURLtoBlob(photoPreview), "photo.jpg");
    } else if (photoPreview) {
      fd.append("photo_url", photoPreview);
    }

    if (signaturePreview && signaturePreview.startsWith("data:")) {
      fd.append("signature", dataURLtoBlob(signaturePreview), "signature.jpg");
    } else if (signaturePreview) {
      fd.append("signature_url", signaturePreview);
    }

    Object.entries(rest).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    });
    if (aadharDocFile) fd.append("aadhar_doc", aadharDocFile);
    if (panDocFile) fd.append("pan_doc", panDocFile);
    return fd;
  }

  return {
    token,
    submit: submitFlag,
    photo_url: photoPreview || null,
    signature_url: signaturePreview || null,
    ...rest
  };
}
