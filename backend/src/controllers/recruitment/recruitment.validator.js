const Joi = require("joi");
const validate = require("../../middleware/validate");
const POSITION_TYPES = ["Contract", "Contract to Hire", "Direct Hire"];
const ASSIGNMENT_STATUSES = ["Open", "Closed", "Completed", "Hold"];
const JOB_STATUSES = ["Active", "On Hold", "Closed", "Find items"];
const INTERVIEW_LEVELS = ["Round 1", "Round 2", "Round 3", "HR", "Final"];
const INTERVIEW_TYPES = ["Video Call", "Phone", "In-Person", "Teams", "GoogleMeet", "Zoom"];
const OFFER_RESPONSES = ["Accepted", "Rejected"];
const CANDIDATE_STATUSES = [
  "Applied", "Work in Progress", "Screening", "Interview Scheduled", "Schedule Interview",
  "Shortlisted", "Selected", "Offer Released", "Offer Accepted", "Offer Rejected",
  "Joining Formalities", "Onboarded", "Rejected", "Not Selected"
];
const createJobSchema = Joi.object({
  title: Joi.string().max(200).required(),
  client: Joi.string().max(200).required(),
  companyDept: Joi.string().max(200).required(),
  billRate: Joi.number().positive().required(),
  billCurrency: Joi.string().max(10).default("$"),
  payRate: Joi.number().positive().required(),
  payCurrency: Joi.string().max(10).default("$"),
  positionType: Joi.string().valid(...POSITION_TYPES).required(),
  vacancies: Joi.number().integer().min(1).required(),
  city: Joi.string().max(100).allow("", null),
  country: Joi.string().max(100).required(),
  experienceLevel: Joi.string().max(50).required(),
  jobStatus: Joi.string().valid(...JOB_STATUSES).default("Active"),
  businessUnit: Joi.string().max(100).required(),
  assignmentStatus: Joi.string().valid(...ASSIGNMENT_STATUSES).default("Open"),
  opportunityPhone: Joi.string().max(50).allow("", null),
  skillSet: Joi.string().required(),
  description: Joi.string().required()
});
const updateJobSchema = createJobSchema.fork(
  ["title", "client", "companyDept", "billRate", "payRate", "positionType",
  "vacancies", "country", "experienceLevel", "businessUnit", "skillSet", "description"],
  (f) => f.optional()
);
const assignRecruitersSchema = Joi.object({
  recruiterIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});
const createCandidateSchema = Joi.object({
  jobReqId: Joi.number().integer().positive().allow(null).optional(),
  name: Joi.string().max(200).required(),
  email: Joi.string().email().max(200).required(),
  mobile: Joi.string().max(20).allow("", null),
  gender: Joi.string().valid("Male", "Female", "Other").allow(null),
  totalExperience: Joi.number().min(0).allow(null),
  relevantExperience: Joi.number().min(0).allow(null),
  currentCtc: Joi.number().min(0).allow(null),
  expectedCtc: Joi.number().min(0).allow(null),
  noticePeriodServing: Joi.boolean().default(false),
  lastWorkingDay: Joi.date().iso().allow(null),
  skillSet: Joi.string().allow("", null),
  source: Joi.string().max(100).allow("", null),
  pinCode: Joi.string().max(10).allow("", null),
  city: Joi.string().max(100).allow("", null),
  state: Joi.string().max(100).allow("", null),
  district: Joi.string().max(100).allow("", null),
  recruiterId: Joi.number().integer().positive().optional().allow(null)
});
const updateCandidateStatusSchema = Joi.object({
  status: Joi.string().valid(...CANDIDATE_STATUSES).required()
});
const scheduleInterviewSchema = Joi.object({
  candidateId: Joi.number().integer().positive().required(),
  jobReqId: Joi.number().integer().positive().allow(null).optional(),
  level: Joi.string().valid(...INTERVIEW_LEVELS).required(),
  interviewType: Joi.string().valid(...INTERVIEW_TYPES).required(),
  interviewDate: Joi.date().iso().required(),
  interviewTime: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null),
  durationMinutes: Joi.number().integer().valid(30, 45, 60, 90, 120).allow(null),
  interviewer: Joi.string().max(200).allow("", null),
  teamsSubject: Joi.string().max(500).allow("", null),
  teamsParticipants: Joi.string().allow("", null),
  teamsStart: Joi.date().iso().allow(null),
  candidateType: Joi.string().valid("Internal", "External").allow(null).optional(),
  toAddresses: Joi.string().allow("", null).optional(),
  notes: Joi.string().allow("", null).optional(),
  teamsEnd: Joi.date().iso().allow(null)
});
const feedbackSchema = Joi.object({
  feedbackStatus: Joi.string().valid("Shortlist", "Move to Next Round", "Reject / Drop", "Selected", "Not Selected").required(),
  feedbackComments: Joi.string().allow("", null),
  feedbackRating: Joi.number().integer().min(1).max(5).allow(null),
  shortlisted: Joi.boolean().default(false)
});
const createAvailabilitySchema = Joi.object({
  interviewerName: Joi.string().trim().min(1).max(200).required(),
  availableFrom: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).required(),
  availableTo: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).required()
}).custom((value, helpers) => {
  const isValidDateTime = (dateTime) => {
    if (typeof dateTime !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) return false;
    const [date, time] = dateTime.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day && hour <= 23 && minute <= 59;
  };
  if (!isValidDateTime(value.availableFrom) || !isValidDateTime(value.availableTo) ||
      value.availableTo <= value.availableFrom) {
    return helpers.error("any.invalid");
  }
  return value;
}).messages({ "any.invalid": "Availability must contain valid date-times and end after it starts" });
const createWeeklyAvailabilitySchema = Joi.object({
  interviewerName: Joi.string().trim().min(1).max(200).required(),
  weekday: Joi.number().integer().min(0).max(6).required(),
  availableFrom: Joi.string().pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/).required(),
  availableTo: Joi.string().pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/).required(),
  effectiveFrom: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  effectiveTo: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, "")
}).custom((value, helpers) => {
  const isValidDate = (date) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const [year, month, day] = date.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day;
  };
  if (!isValidDate(value.effectiveFrom) ||
      (value.effectiveTo && (!isValidDate(value.effectiveTo) || value.effectiveTo < value.effectiveFrom)) ||
      value.availableFrom >= value.availableTo) {
    return helpers.error("any.invalid");
  }
  return value;
}).messages({ "any.invalid": "Weekly availability must have valid dates and an end time after its start" });
const createFollowupSchema = Joi.object({
  assignedTo: Joi.number().integer().positive().optional(),
  dueAt: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).required(),
  note: Joi.string().trim().min(1).max(2000).required()
});
const updateFollowupSchema = Joi.object({
  status: Joi.string().valid("open", "completed", "cancelled").required()
});
const createOfferSchema = Joi.object({
  candidateId: Joi.number().integer().positive().required(),
  jobReqId: Joi.number().integer().positive().allow(null).optional(),
  designation: Joi.string().max(200).required(),
  dateOfJoining: Joi.date().iso().allow(null),
  basic: Joi.number().min(0).default(0),
  hra: Joi.number().min(0).default(0),
  telephoneAllowance: Joi.number().min(0).default(0),
  specialAllowance: Joi.number().default(0),
  grossSalary: Joi.number().min(0).default(0),
  pfContribution: Joi.number().min(0).default(0),
  statutoryBonus: Joi.number().min(0).default(0),
  gratuity: Joi.number().min(0).default(0),
  esi: Joi.number().min(0).default(0),
  ctc: Joi.number().positive().required(),
  ctcInWords: Joi.string().max(500).allow("", null)
});
const offerResponseSchema = Joi.object({
  response: Joi.string().valid(...OFFER_RESPONSES).required()
});
const createOnboardingSchema = Joi.object({
  candidateId: Joi.number().integer().positive().required(),
  offerId: Joi.number().integer().positive().required(),
  effectiveDate: Joi.date().iso().allow(null)
});
const updateTaskSchema = Joi.object({
  taskName: Joi.string().required(),
  taskValue: Joi.alternatives().try(Joi.string(), Joi.boolean()).required()
});
module.exports = {
  validateCreateJob: validate(createJobSchema),
  validateUpdateJob: validate(updateJobSchema),
  validateAssignRecruiters: validate(assignRecruitersSchema),
  validateCreateCandidate: validate(createCandidateSchema),
  validateUpdateCandidateStatus: validate(updateCandidateStatusSchema),
  validateScheduleInterview: validate(scheduleInterviewSchema),
  validateFeedback: validate(feedbackSchema),
  validateCreateAvailability: validate(createAvailabilitySchema),
  validateCreateWeeklyAvailability: validate(createWeeklyAvailabilitySchema),
  validateCreateFollowup: validate(createFollowupSchema),
  validateUpdateFollowup: validate(updateFollowupSchema),
  validateCreateOffer: validate(createOfferSchema),
  validateOfferResponse: validate(offerResponseSchema),
  validateCreateOnboarding: validate(createOnboardingSchema),
  validateUpdateTask: validate(updateTaskSchema)
};
