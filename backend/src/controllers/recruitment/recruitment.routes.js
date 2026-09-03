const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../../middleware/auth");


const jobCtrl = require("./jobRequest.controller");
const candidateCtrl = require("./candidate.controller");
const interviewCtrl = require("./interview.controller");
const offerCtrl = require("./offer.controller");
const onboardingCtrl = require("./onboarding.controller");
const dashboardCtrl = require("./dashboard.controller");
const resumeMatchCtrl = require("./resumeMatch.controller");
const aiInterviewCtrl = require("./aiInterview.controller");


const V = require("./recruitment.validator");

const { callProcedure } = require("../../config/db");


// ── PUBLIC routes (no auth required) ─────────────────────────────────────────
router.get("/public/ai-interview/:token",         aiInterviewCtrl.getSession);
router.post("/public/ai-interview/:token/start",   aiInterviewCtrl.start);
router.post("/public/ai-interview/:token/answer",  aiInterviewCtrl.answer);
router.post("/public/ai-interview/:token/submit",  aiInterviewCtrl.submit);
router.post("/public/ai-interview/:token/complete",    aiInterviewCtrl.submit);
router.post("/public/ai-interview/:token/proctoring", aiInterviewCtrl.logProctoring);
router.post("/public/ai-interview/:token/draft",      aiInterviewCtrl.saveDraft);

router.use(authenticate);



const ADMIN_TL = authorizeRoles("Admin", "Recruiter Team Lead", "HR Manager");
const ALL_REC = authorizeRoles("Admin", "Recruiter Team Lead", "HR Manager", "Recruiter");
const REC_TEAM = ALL_REC;
const ADMIN_ONLY = authorizeRoles("Admin");


router.get("/recruiters", ADMIN_TL, async (req, res, next) => {
  try {
    const results = await callProcedure("sp_rec_list_active_recruiters()");
    const rows = results[0] ?? [];
    res.json({ success: true, data: rows });
  } catch (err) {next(err);}
});


router.get("/dashboard",
ALL_REC,
(req, res, next) =>
{

  if (req.user.roleId === 5) return dashboardCtrl.recruiterDashboard(req, res, next);
  return dashboardCtrl.adminDashboard(req, res, next);
}
);
router.get("/dashboard/report", ADMIN_TL, dashboardCtrl.pipelineReport);


router.route("/jobs").
get(ALL_REC, jobCtrl.list).
post(ADMIN_TL, V.validateCreateJob, jobCtrl.create);

router.route("/jobs/:id").
get(ALL_REC, jobCtrl.getOne).
put(ADMIN_TL, V.validateUpdateJob, jobCtrl.update).
delete(ADMIN_TL, jobCtrl.remove);

router.put("/jobs/:id/assign-recruiters",
ADMIN_TL,
V.validateAssignRecruiters,
jobCtrl.assignRecruiters
);


router.route("/candidates").
get(ALL_REC, candidateCtrl.list).
post(REC_TEAM, V.validateCreateCandidate, candidateCtrl.create);

router.route("/candidates/:id").
get(ALL_REC, candidateCtrl.getOne);

router.put("/candidates/:id/status",
REC_TEAM,
V.validateUpdateCandidateStatus,
candidateCtrl.updateStatus
);


router.get("/candidates/:id/skills", ALL_REC, candidateCtrl.getSkills);
router.get("/candidates/:id/education", ALL_REC, candidateCtrl.getEducation);
router.get("/candidates/:id/experience", ALL_REC, candidateCtrl.getExperience);


router.get("/parser-logs", ADMIN_TL, candidateCtrl.getParserLogs);


router.route("/interviews").
get(ALL_REC, interviewCtrl.list).
post(REC_TEAM, V.validateScheduleInterview, interviewCtrl.schedule);

router.route("/interviews/:id").
get(ALL_REC, interviewCtrl.getOne);

router.put("/interviews/:id/feedback",
ADMIN_TL,
V.validateFeedback,
interviewCtrl.submitFeedback
);

router.put("/interviews/:id/recruiter-feedback",
ALL_REC,
interviewCtrl.submitRecruiterFeedback
);

router.put("/interviews/:id/cancel",
REC_TEAM,
interviewCtrl.cancel
);


router.route("/offers").
get(ADMIN_ONLY, offerCtrl.list).
post(ADMIN_ONLY, V.validateCreateOffer, offerCtrl.create);

router.route("/offers/:id").
get(ADMIN_ONLY, offerCtrl.getOne);

router.put("/offers/:id/release", ADMIN_ONLY, offerCtrl.release);
router.put("/offers/:id/respond", ADMIN_ONLY, V.validateOfferResponse, offerCtrl.respond);
router.get("/offers/:id/download-docx", ADMIN_ONLY, offerCtrl.downloadDocx);


router.route("/onboarding").
get(ADMIN_ONLY, onboardingCtrl.list).
post(ADMIN_ONLY, V.validateCreateOnboarding, onboardingCtrl.create);

router.route("/onboarding/:id").
get(ADMIN_ONLY, onboardingCtrl.getOne);

router.put("/onboarding/:id/task",
ADMIN_ONLY,
V.validateUpdateTask,
onboardingCtrl.updateTask
);
router.put("/onboarding/:id/finalize", ADMIN_ONLY, onboardingCtrl.finalize);


router.post("/resume-match/parse", ALL_REC, resumeMatchCtrl.parseOnly);
router.post("/resume-match/quick", ALL_REC, resumeMatchCtrl.quickMatch);
router.post("/resume-match/upload", ALL_REC, resumeMatchCtrl.uploadAndMatch);
router.get("/resume-match/candidate/:candidateId/job/:jobReqId", ALL_REC, resumeMatchCtrl.getMatch);
router.post("/resume-match/candidate/:candidateId/job/:jobReqId", ALL_REC, resumeMatchCtrl.computeMatch);
router.get("/resume-match/job/:jobReqId", ALL_REC, resumeMatchCtrl.listByJob);

// ── AI Interview routes (protected) ──────────────────────────────────────────
router.post("/ai-interviews",             REC_TEAM, aiInterviewCtrl.create);
router.get("/ai-interviews",              ALL_REC,  aiInterviewCtrl.list);
router.get("/ai-interviews/report/:id",   ALL_REC,  aiInterviewCtrl.getReport);

module.exports = router;
