import { BookOpen, FileText, User, Heart, Shield, CreditCard, Landmark, ClipboardList } from "lucide-react";

export const TABS = [
  { id: "handbook", label: "Employee Handbook", icon: BookOpen },
  { id: "hrpolicy", label: "HR Policy Manual", icon: FileText },
  { id: "personal", label: "Joining Formalities", icon: User },
  { id: "termlife", label: "Team Life Insurance Nomination", icon: Heart },
  { id: "gratuity", label: "Gratuity Nomination Form", icon: Shield },
  { id: "insurance", label: "Insurance Nomination Form", icon: ClipboardList },
  { id: "pf", label: "PF Declaration", icon: Shield },
  { id: "bank", label: "Bank Details", icon: Landmark },
  { id: "review", label: "Review & Submit", icon: CreditCard }
];

export const INITIAL_FORM = {
  handbookAcknowledged: false,
  hrPolicyAcknowledged: false,

  fullName: "", dob: "", actualDob: "", panNo: "", fatherName: "",
  maritalStatus: "", spouseName: "", photoFile: null, photoPreview: "",
  signatureFile: null, signaturePreview: "",
  presentAddress: "", permanentAddress: "",

  education: [{ qualification: "", institute: "", specialization: "", year: "" }],
  references: [{ name: "", occupation: "", relationship: "", contact: "" }],

  bankName: "ICICI Bank", accountHolderName: "", accountNumber: "", confirmAccountNumber: "",
  ifscCode: "", branchDetails: "", accountType: "",

  joiningDateText: "", designationText: "",

  tlEmployeeName: "", tlFatherOrHusbandName: "", tlDateOfBirth: "", tlSex: "", tlEmployeeId: "", tlAddress: "",
  termLifeNominees: [{ nomineeNameAndAddress: "", relationship: "", dateOfBirth: "", shareAmount: "100", guardianDetails: "" }],
  tlDeclarationEmployeeName: "", tlDeclarationDate: "", tlPlace: "", tlDate: "", tlSignature: "",

  gratuityEmployeeIntroName: "", gratuitySpouseExclusionDate: "", gratuitySex: "", gratuityReligion: "",
  gratuityMaritalStatus: "", gratuityDepartmentBranchSection: "", gratuityEmployeeId: "", gratuityDateOfJoining: "",
  gratuityPermanentAddress: "", gratuityPlace: "", gratuityDate: "", gratuityEmployeeSignature: "",
  gratuityEmployeeStatementNameAndAddress: "",
  gratuityNominees: [{ fullNameAndAddress: "", relationship: "", age: "", sharePercentage: "100" }],
  gratuityWitnesses: [{ nameAndAddress: "" }, { nameAndAddress: "" }],

  insEmployeeName: "", insFatherOrHusbandName: "", insDateOfBirth: "", insSex: "", insEmployeeId: "", insAddress: "",
  insNominees: [{ nomineeNameAndAddress: "", relationship: "", dateOfBirth: "", shareAmount: "100", guardianDetails: "" }],
  insDeclarationEmployeeName: "", insDeclarationDate: "", insPlace: "", insDate: "", insSignature: "",

  pfEmployeeName: "", pfDateOfBirth: "", pfFatherOrSpouseName: "", pfRelationType: "",
  pfGender: "", pfMaritalStatus: "", pfEmail: "", pfMobileNo: "",
  pfEpf1952: "", pfEps1995: "", pfUan: "", pfPreviousPf: "", pfExitPreviousEmployment: "",
  pfSchemeCertificateNo: "", pfPpo: "",
  pfInternationalWorker: "", pfCountryOrigin: "", pfPassportNo: "", pfPassportValidity: "",
  pfEducationalQualification: "", pfSpeciallyAbled: "", pfDisabilityCategory: "",
  pfBankAccNo: "", pfIfscCode: "", pfAadharNo: "", pfDoHavePan: "", pfPan: "",
  pfPlace: "", pfDeclarationAccepted: false, pfEmployeeSignature: ""
};
