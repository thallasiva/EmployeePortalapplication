export { INTERVIEW_LEVELS, INTERVIEW_TYPES, FEEDBACK_STATUSES } from "../mockData";

export const BLANK_INT = {
  candidateId: "",
  jobReqId: "",
  level: "Round 1",
  interviewType: "Video Call",
  interviewDate: "",
  interviewTime: "",
  durationMinutes: 60,
  interviewer: "",
  candidateType: "External",
  toAddresses: "",
  teamsSubject: "",
  teamsParticipants: "",
  teamsStart: "",
  teamsEnd: "",
  notes: "",
};

export const BLANK_FB = { feedbackStatus: "", feedbackComments: "", shortlisted: false };

export const LEVEL_ORDER = ["Round 1", "Round 2", "Round 3", "HR", "Final"];

export const STATUS_CLS = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-[#fff7ed] text-[#f18200]",
  Cancelled: "bg-red-100 text-red-600",
};

export const FB_CLS = {
  Selected: "bg-[#fff7ed] text-[#f18200]",
  "Not Selected": "bg-red-100 text-red-600",
  Hold: "bg-amber-100 text-amber-600",
};
