const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../../middleware/auth");

// Controllers
const jobCtrl         = require("./jobRequest.controller");
const candidateCtrl   = require("./candidate.controller");
const interviewCtrl   = require("./interview.controller");
const offerCtrl       = require("./offer.controller");
const onboardingCtrl  = require("./onboarding.controller");
const dashboardCtrl   = require("./dashboard.controller");
const resumeMatchCtrl = require("./resumeMatch.controller");

// Validators
const V = require("./recruitment.validator");

const { callProcedure } = require("../../config/db");

// All routes require authentication
router.use(authenticate);

// Allowed roles
// "HR Manager" (role_id 4) = same as "Recruiter Team Lead" — different DB naming, same permissions
const ADMIN_TL   = authorizeRoles("Admin", "Recruiter Team Lead", "HR Manager");
const ALL_REC    = authorizeRoles("Admin", "Recruiter Team Lead", "HR Manager", "Recruiter");
const REC_TEAM   = ALL_REC;   // HR Manager has full recruitment access same as Recruiter Team Lead
const ADMIN_ONLY = authorizeRoles("Admin");

// ── Recruiters lookup (for dropdowns) ───────────────────────────────
router.get("/recruiters", ADMIN_TL, async (req, res, next) => {
  try {
    const results = await callProcedure("sp_rec_list_active_recruiters()");
    const rows = results[0] ?? [];
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ── Dashboard ───────────────────────────────────────────────────────
router.get("/dashboard",
  ALL_REC,
  (req, res, next) =>
  {
    // Route to correct dashboard based on role (JWT payload uses camelCase roleId)
    if (req.user.roleId === 5) return dashboardCtrl.recruiterDashboard(req, res, next);
    return dashboardCtrl.adminDashboard(req, res, next);
  }
);
router.get("/dashboard/report", ADMIN_TL, dashboardCtrl.pipelineReport);

// ── Job Requests ────────────────────────────────────────────────────
router.route("/jobs")
  .get(ALL_REC, jobCtrl.list)
  .post(ADMIN_TL, V.validateCreateJob, jobCtrl.create);

router.route("/jobs/:id")
  .get(ALL_REC, jobCtrl.getOne)
  .put(ADMIN_TL, V.validateUpdateJob, jobCtrl.update)
  .delete(ADMIN_TL, jobCtrl.remove);

router.put("/jobs/:id/assign-recruiters",
  ADMIN_TL,
  V.validateAssignRecruiters,
  jobCtrl.assignRecruiters
);

// ── Candidates ───────────────────────────────────────────────────────
router.route("/candidates")
  .get(ALL_REC, candidateCtrl.list)
  .post(REC_TEAM, V.validateCreateCandidate, candidateCtrl.create);  // Recruiters add candidates

router.route("/candidates/:id")
  .get(ALL_REC, candidateCtrl.getOne);

router.put("/candidates/:id/status",
  REC_TEAM,                                                           // Recruiters update status
  V.validateUpdateCandidateStatus,
  candidateCtrl.updateStatus
);

// ── Interviews ───────────────────────────────────────────────────────
router.route("/interviews")
  .get(ALL_REC, interviewCtrl.list)
  .post(REC_TEAM, V.validateScheduleInterview, interviewCtrl.schedule); // Recruiters schedule

router.route("/interviews/:id")
  .get(ALL_REC, interviewCtrl.getOne);

router.put("/interviews/:id/feedback",
  ADMIN_TL,                                                             // HR Manager / TL submits feedback
  V.validateFeedback,
  interviewCtrl.submitFeedback
);

router.put("/interviews/:id/cancel",
  REC_TEAM,                                                             // Recruiters cancel
  interviewCtrl.cancel
);

// ── Offers ───────────────────────────────────────────────────────────
router.route("/offers")
  .get(ADMIN_ONLY, offerCtrl.list)
  .post(ADMIN_ONLY, V.validateCreateOffer, offerCtrl.create);

router.route("/offers/:id")
  .get(ADMIN_ONLY, offerCtrl.getOne);

router.put("/offers/:id/release", ADMIN_ONLY, offerCtrl.release);
router.put("/offers/:id/respond", ADMIN_ONLY, V.validateOfferResponse, offerCtrl.respond);
router.get("/offers/:id/download-docx", ADMIN_ONLY, offerCtrl.downloadDocx);

// ── Onboarding ───────────────────────────────────────────────────────
router.route("/onboarding")
  .get(ADMIN_ONLY, onboardingCtrl.list)
  .post(ADMIN_ONLY, V.validateCreateOnboarding, onboardingCtrl.create);

router.route("/onboarding/:id")
  .get(ADMIN_ONLY, onboardingCtrl.getOne);

router.put("/onboarding/:id/task",
  ADMIN_ONLY,
  V.validateUpdateTask,
  onboardingCtrl.updateTask
);
router.put("/onboarding/:id/finalize", ADMIN_ONLY, onboardingCtrl.finalize);

// ── Resume Match ─────────────────────────────────────────────────────────────
router.post("/resume-match/parse",                              ALL_REC, resumeMatchCtrl.parseOnly);
router.post("/resume-match/quick",                              ALL_REC, resumeMatchCtrl.quickMatch);
router.post("/resume-match/upload",                             ALL_REC, resumeMatchCtrl.uploadAndMatch);
router.get( "/resume-match/candidate/:candidateId/job/:jobReqId", ALL_REC, resumeMatchCtrl.getMatch);
router.post("/resume-match/candidate/:candidateId/job/:jobReqId", ALL_REC, resumeMatchCtrl.computeMatch);
router.get( "/resume-match/job/:jobReqId",                     ALL_REC, resumeMatchCtrl.listByJob);

module.exports = router;
