const express  = require("express");
const router   = express.Router();

const { authenticate, authorizeRoles } = require("../../middleware/auth");

// Controllers
const jobCtrl        = require("./jobRequest.controller");
const candidateCtrl  = require("./candidate.controller");
const interviewCtrl  = require("./interview.controller");
const offerCtrl      = require("./offer.controller");
const onboardingCtrl = require("./onboarding.controller");
const dashboardCtrl  = require("./dashboard.controller");

// Validators
const V = require("./recruitment.validator");

// All routes require authentication
router.use(authenticate);

// Allowed roles
const ADMIN_TL     = authorizeRoles("Admin", "Recruiter Team Lead");
const ALL_REC      = authorizeRoles("Admin", "Recruiter Team Lead", "Recruiter");
const ADMIN_ONLY   = authorizeRoles("Admin");

// ── Dashboard ───────────────────────────────────────────────────────
router.get("/dashboard",
  ALL_REC,
  (req, res, next) => {
    // Route to correct dashboard based on role
    if (req.user.role_id === 5) return dashboardCtrl.recruiterDashboard(req, res, next);
    return dashboardCtrl.adminDashboard(req, res, next);
  }
);
router.get("/dashboard/report", ADMIN_TL, dashboardCtrl.pipelineReport);

// ── Job Requests ────────────────────────────────────────────────────
router.route("/jobs")
  .get(ALL_REC,   jobCtrl.list)
  .post(ADMIN_TL, V.validateCreateJob, jobCtrl.create);

router.route("/jobs/:id")
  .get(ALL_REC,   jobCtrl.getOne)
  .put(ADMIN_TL,  V.validateUpdateJob, jobCtrl.update)
  .delete(ADMIN_TL, jobCtrl.remove);

router.put("/jobs/:id/assign-recruiters",
  ADMIN_TL,
  V.validateAssignRecruiters,
  jobCtrl.assignRecruiters
);

// ── Candidates ───────────────────────────────────────────────────────
router.route("/candidates")
  .get(ALL_REC,  candidateCtrl.list)
  .post(ALL_REC, V.validateCreateCandidate, candidateCtrl.create);

router.route("/candidates/:id")
  .get(ALL_REC, candidateCtrl.getOne);

router.put("/candidates/:id/status",
  ALL_REC,
  V.validateUpdateCandidateStatus,
  candidateCtrl.updateStatus
);

// ── Interviews ───────────────────────────────────────────────────────
router.route("/interviews")
  .get(ALL_REC,  interviewCtrl.list)
  .post(ALL_REC, V.validateScheduleInterview, interviewCtrl.schedule);

router.route("/interviews/:id")
  .get(ALL_REC, interviewCtrl.getOne);

router.put("/interviews/:id/feedback",
  ALL_REC,
  V.validateFeedback,
  interviewCtrl.submitFeedback
);

router.put("/interviews/:id/cancel",
  ALL_REC,
  interviewCtrl.cancel
);

// ── Offers ───────────────────────────────────────────────────────────
router.route("/offers")
  .get(ADMIN_TL,  offerCtrl.list)
  .post(ADMIN_TL, V.validateCreateOffer, offerCtrl.create);

router.route("/offers/:id")
  .get(ADMIN_TL, offerCtrl.getOne);

router.put("/offers/:id/release",  ADMIN_TL, offerCtrl.release);
router.put("/offers/:id/respond",  ADMIN_TL, V.validateOfferResponse, offerCtrl.respond);

// ── Onboarding ───────────────────────────────────────────────────────
router.route("/onboarding")
  .get(ADMIN_TL,  onboardingCtrl.list)
  .post(ADMIN_TL, V.validateCreateOnboarding, onboardingCtrl.create);

router.route("/onboarding/:id")
  .get(ADMIN_TL, onboardingCtrl.getOne);

router.put("/onboarding/:id/task",
  ADMIN_TL,
  V.validateUpdateTask,
  onboardingCtrl.updateTask
);
router.put("/onboarding/:id/finalize", ADMIN_ONLY, onboardingCtrl.finalize);

module.exports = router;
