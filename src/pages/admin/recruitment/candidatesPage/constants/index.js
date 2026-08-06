export const BLANK = {
  jobReqId: "", name: "", email: "", mobile: "", recruiterId: "",
  totalExperience: "", relevantExperience: "", currentCtc: "", expectedCtc: "",
  noticePeriodServing: false, lastWorkingDay: "", skillSet: "", gender: "",
  pinCode: "", city: "", state: "", district: "", source: ""
};

export const BLANK_INT = {
  level: "Round 1", interviewType: "Video Call", interviewDate: "", interviewTime: "",
  durationMinutes: 60, interviewer: "", teamsSubject: "", teamsParticipants: "", teamsStart: "", teamsEnd: ""
};

export const STATUS_OPTS = [
  "Work in Progress", "Shortlisted", "Offer Released",
  "Offer Accepted", "Offer Rejected", "Joining Formalities", "Onboarded"
];

export const LEVEL_ORDER = ["Round 1", "Round 2", "Round 3", "HR", "Final"];

export const STEPS = [
  { id: 1, label: "Upload Resume" },
  { id: 2, label: "Review & Edit" },
  { id: 3, label: "Submit" }
];

export const REC_CLASS = {
  "Highly Suitable": "bg-amber-50 text-[#f18200]",
  "Suitable": "bg-blue-100 text-blue-800",
  "Partially Suitable": "bg-yellow-100 text-amber-800",
  "Not Suitable": "bg-red-100 text-red-800"
};

export const NO_NEXT_STATUSES = [
  "Shortlisted", "Offer Released", "Offer Accepted", "Offer Rejected",
  "Rejected", "Joining Formalities", "Onboarded"
];

export const REQUIRED_FIELDS = [
  "jobReqId", "name", "email", "totalExperience", "relevantExperience", "currentCtc", "expectedCtc"
];

export const STATUS_STRIPS_CONFIG = [
  { label: "Total", val: "", cls: "text-gray-500 bg-gray-100", activeBorder: "border-gray-500", defaultBorder: "border-gray-200" },
  { label: "Shortlisted", val: "Shortlisted", cls: "text-blue-700 bg-blue-50", activeBorder: "border-blue-700", defaultBorder: "border-blue-200" },
  { label: "Offer Released", val: "Offer Released", cls: "text-amber-700 bg-amber-50", activeBorder: "border-amber-700", defaultBorder: "border-amber-200" },
  { label: "Offer Accepted", val: "Offer Accepted", cls: "text-[#f18200] bg-orange-50", activeBorder: "border-[#f18200]", defaultBorder: "border-orange-200" },
  { label: "Onboarded", val: "Onboarded", cls: "text-green-800 bg-green-100", activeBorder: "border-green-800", defaultBorder: "border-green-300" }
];
