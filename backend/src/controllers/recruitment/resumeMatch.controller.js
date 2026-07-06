'use strict';

const asyncHandler = require("express-async-handler");
const multer = require("multer");
const resumeMatchSvc = require("../../services/recruitment/resumeMatch.service");
const resumeParserSvc = require("../../services/recruitment/resumeParser.service");
const ApiResponse = require("../../utils/ApiResponse");

// In-memory multer — no disk writes, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
  {
    const allowed = ['application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype) || /\.(pdf|doc|docx)$/i.test(file.originalname))
    {
      cb(null, true);
    } else
    {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
}).single('resume');

// Wrap multer in a promise so asyncHandler can catch errors
function uploadMiddleware(req, res)
{
  return new Promise((resolve, reject) =>
    upload(req, res, err => (err ? reject(err) : resolve()))
  );
}

/** GET /resume-match/candidate/:candidateId/job/:jobReqId  — fetch stored score */
const getMatch = asyncHandler(async (req, res) =>
{
  const candidateId = Number(req.params.candidateId);
  const jobReqId = Number(req.params.jobReqId);
  const data = await resumeMatchSvc.getMatch(candidateId, jobReqId);
  new ApiResponse(200, data || null, data ? "Match found" : "No match computed yet").send(res);
});

/** POST /resume-match/candidate/:candidateId/job/:jobReqId  — (re)compute score */
const computeMatch = asyncHandler(async (req, res) =>
{
  const candidateId = Number(req.params.candidateId);
  const jobReqId = Number(req.params.jobReqId);
  const data = await resumeMatchSvc.computeAndStore(candidateId, jobReqId);
  new ApiResponse(200, data, "Match computed").send(res);
});

/** GET /resume-match/job/:jobReqId  — rank all candidates for a job */
const listByJob = asyncHandler(async (req, res) =>
{
  const jobReqId = Number(req.params.jobReqId);
  const data = await resumeMatchSvc.listByJob(jobReqId);
  new ApiResponse(200, data, "Matches fetched").send(res);
});

/** POST /resume-match/quick  — instant score without storing */
const quickMatch = asyncHandler(async (req, res) =>
{
  const { jobReqId, candidateSkills, candidateExperience } = req.body;
  if (!jobReqId || !candidateSkills)
  {
    return res.status(400).json({ success: false, message: "jobReqId and candidateSkills are required" });
  }
  const data = await resumeMatchSvc.quickMatch({
    jobReqId: Number(jobReqId),
    candidateSkills: String(candidateSkills),
    candidateExperience: Number(candidateExperience) || 0,
  });
  new ApiResponse(200, data, "Quick match computed").send(res);
});

/**
 * POST /resume-match/upload
 * Body: multipart/form-data — field "resume" (PDF/DOCX) + field "jobReqId"
 * Parses the resume, extracts skills + experience, scores against the job.
 * Does NOT store anything — pure instant check.
 */
const uploadAndMatch = asyncHandler(async (req, res) =>
{
  await uploadMiddleware(req, res);

  if (!req.file)
  {
    return res.status(400).json({ success: false, message: "Please upload a PDF or DOCX resume file" });
  }
  const jobReqId = Number(req.body.jobReqId);
  if (!jobReqId)
  {
    return res.status(400).json({ success: false, message: "jobReqId is required" });
  }

  // 1. Parse resume
  const parsed = await resumeParserSvc.parseResume(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname,
  );

  // 2. Score against job
  const score = await resumeMatchSvc.quickMatch({
    jobReqId,
    candidateSkills: parsed.skills.join(", "),
    candidateExperience: parsed.experience,
  });

  new ApiResponse(200, { ...score, parsed }, "Resume parsed and matched").send(res);
});

module.exports = { getMatch, computeMatch, listByJob, quickMatch, uploadAndMatch };
