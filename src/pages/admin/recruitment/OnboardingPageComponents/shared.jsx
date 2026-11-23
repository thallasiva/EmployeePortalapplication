const FORMALITY_STEPS = [{
  key: "employee_info_submitted",
  label: "Employee Info Submitted",
  boolean: true
}, {
  key: "photo_uploaded",
  label: "Photo Uploaded",
  boolean: true
}, {
  key: "joining_formalities",
  label: "Joining Formalities",
  boolean: false
}, {
  key: "team_life_insurance",
  label: "Team Life Insurance",
  boolean: false
}, {
  key: "gratuity_nomination",
  label: "Gratuity Nomination",
  boolean: false
}, {
  key: "insurance_nomination",
  label: "Insurance Nomination",
  boolean: false
}, {
  key: "pf_declaration",
  label: "PF Declaration",
  boolean: false
}, {
  key: "hr_verified",
  label: "HR Verification",
  boolean: true
}];
const ENUM_OPTS = {
  joining_formalities: ["Pending", "In Progress", "Completed"],
  team_life_insurance: ["Pending", "Nominated", "Confirmed"],
  gratuity_nomination: ["Pending", "Submitted", "Approved"],
  insurance_nomination: ["Pending", "Submitted", "Confirmed"],
  pf_declaration: ["Pending", "Submitted", "Approved"]
};
const STEP_STATUS_CLS = {
  Pending: "bg-red-100 text-red-600",
  "In Progress": "bg-amber-100 text-amber-600",
  Completed: "bg-emerald-100 text-emerald-600",
  Nominated: "bg-blue-100 text-[#e87500]",
  Confirmed: "bg-emerald-100 text-emerald-600",
  Submitted: "bg-violet-100 text-violet-600",
  Approved: "bg-emerald-100 text-emerald-600"
};
function fmt(v) {
  if (!v && v !== 0) return "—";
  return "₹" + Number(v).toLocaleString("en-IN");
}
export { FORMALITY_STEPS, ENUM_OPTS, STEP_STATUS_CLS, fmt };
