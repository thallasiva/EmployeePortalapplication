const Joi = require("joi");
const validate = require("../../middleware/validate");

const POSITION_TYPES     = ["Contract", "Contract to Hire", "Direct Hire"];
const ASSIGNMENT_STATUSES = ["Open", "Closed", "Completed", "Hold"];
const JOB_STATUSES       = ["Active", "On Hold", "Closed", "Find items"];
const INTERVIEW_LEVELS   = ["Round 1", "Round 2", "Round 3", "HR", "Final"];
const INTERVIEW_TYPES    = ["Video Call", "Phone", "In-Person", "Teams"];
const OFFER_RESPONSES    = ["Accepted", "Rejected"];

// ── Job Requests ─────────────────────────────────────────────────────
const createJobSchema = Joi.object({
  title:            Joi.string().max(200).required(),
  client:           Joi.string().max(200).required(),
  companyDept:      Joi.string().max(200).required(),
  billRate:         Joi.number().positive().required(),
  billCurrency:     Joi.string().max(10).default("$"),
  payRate:          Joi.number().positive().required(),
  payCurrency:      Joi.string().max(10).default("$"),
  positionType:     Joi.string().valid(...POSITION_TYPES).required(),
  vacancies:        Joi.number().integer().min(1).required(),
  city:             Joi.string().max(100).allow("", null),
  country:          Joi.string().max(100).required(),
  experienceLevel:  Joi.string().max(50).required(),
  jobStatus:        Joi.string().valid(...JOB_STATUSES).default("Active"),
  businessUnit:     Joi.string().max(100).required(),
  assignmentStatus: Joi.string().valid(...ASSIGNMENT_STATUSES).default("Open"),
  opportunityPhone: Joi.string().max(50).allow("", null),
  skillSet:         Joi.string().required(),
  description:      Joi.string().required(),
});

const updateJobSchema = createJobSchema.fork(
  ["title","client","companyDept","billRate","payRate","positionType",
   "vacancies","country","experienceLevel","businessUnit","skillSet","description"],
  f => f.optional()
);

const assignRecruitersSchema = Joi.object({
  recruiterIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

// ── Candidates ───────────────────────────────────────────────────────
const createCandidateSchema = Joi.object({
  jobReqId:           Joi.number().integer().positive().required(),
  name:               Joi.string().max(200).required(),
  email:              Joi.string().email().max(200).required(),
  mobile:             Joi.string().max(20).allow("", null),
  gender:             Joi.string().valid("Male","Female","Other").allow(null),
  totalExperience:    Joi.number().min(0).allow(null),
  relevantExperience: Joi.number().min(0).allow(null),
  currentCtc:         Joi.number().min(0).allow(null),
  expectedCtc:        Joi.number().min(0).allow(null),
  noticePeriodServing: Joi.boolean().default(false),
  lastWorkingDay:     Joi.date().iso().allow(null),
  skillSet:           Joi.string().allow("", null),
  source:             Joi.string().max(100).allow("", null),
  pinCode:            Joi.string().max(10).allow("", null),
  city:               Joi.string().max(100).allow("", null),
  state:              Joi.string().max(100).allow("", null),
  district:           Joi.string().max(100).allow("", null),
  recruiterId:        Joi.number().integer().positive().required(),
});

const updateCandidateStatusSchema = Joi.object({
  status: Joi.string().required(),
});

// ── Interviews ───────────────────────────────────────────────────────
const scheduleInterviewSchema = Joi.object({
  candidateId:      Joi.number().integer().positive().required(),
  jobReqId:         Joi.number().integer().positive().required(),
  level:            Joi.string().valid(...INTERVIEW_LEVELS).required(),
  interviewType:    Joi.string().valid(...INTERVIEW_TYPES).required(),
  interviewDate:    Joi.date().iso().required(),
  interviewTime:    Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null),
  interviewer:      Joi.string().max(200).allow("", null),
  teamsSubject:     Joi.string().max(500).allow("", null),
  teamsParticipants: Joi.string().allow("", null),
  teamsStart:       Joi.date().iso().allow(null),
  teamsEnd:         Joi.date().iso().allow(null),
});

const feedbackSchema = Joi.object({
  feedbackStatus:   Joi.string().valid("Strong Yes","Yes","Maybe","No","Strong No").required(),
  feedbackComments: Joi.string().allow("", null),
  shortlisted:      Joi.boolean().default(false),
});

// ── Offers ───────────────────────────────────────────────────────────
const createOfferSchema = Joi.object({
  candidateId:        Joi.number().integer().positive().required(),
  jobReqId:           Joi.number().integer().positive().required(),
  designation:        Joi.string().max(200).required(),
  dateOfJoining:      Joi.date().iso().allow(null),
  basic:              Joi.number().min(0).default(0),
  hra:                Joi.number().min(0).default(0),
  telephoneAllowance: Joi.number().min(0).default(0),
  specialAllowance:   Joi.number().min(0).default(0),
  grossSalary:        Joi.number().min(0).default(0),
  pfContribution:     Joi.number().min(0).default(0),
  statutoryBonus:     Joi.number().min(0).default(0),
  gratuity:           Joi.number().min(0).default(0),
  esi:                Joi.number().min(0).default(0),
  ctc:                Joi.number().positive().required(),
  ctcInWords:         Joi.string().max(500).allow("", null),
});

const offerResponseSchema = Joi.object({
  response: Joi.string().valid(...OFFER_RESPONSES).required(),
});

// ── Onboarding ───────────────────────────────────────────────────────
const createOnboardingSchema = Joi.object({
  candidateId:   Joi.number().integer().positive().required(),
  offerId:       Joi.number().integer().positive().required(),
  effectiveDate: Joi.date().iso().allow(null),
});

const updateTaskSchema = Joi.object({
  taskName:  Joi.string().required(),
  taskValue: Joi.alternatives().try(Joi.string(), Joi.boolean()).required(),
});

module.exports = {
  validateCreateJob:           validate(createJobSchema),
  validateUpdateJob:           validate(updateJobSchema),
  validateAssignRecruiters:    validate(assignRecruitersSchema),
  validateCreateCandidate:     validate(createCandidateSchema),
  validateUpdateCandidateStatus: validate(updateCandidateStatusSchema),
  validateScheduleInterview:   validate(scheduleInterviewSchema),
  validateFeedback:            validate(feedbackSchema),
  validateCreateOffer:         validate(createOfferSchema),
  validateOfferResponse:       validate(offerResponseSchema),
  validateCreateOnboarding:    validate(createOnboardingSchema),
  validateUpdateTask:          validate(updateTaskSchema),
};
