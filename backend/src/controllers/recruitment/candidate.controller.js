const asyncHandler = require("express-async-handler");
const candidateSvc = require("../../services/recruitment/candidate.service");
const resumeMatchSvc = require("../../services/recruitment/resumeMatch.service");
const resumeParserSvc = require("../../services/recruitment/resumeParser.service");
const { callProcedure } = require("../../config/db");
const { getPagination, buildMeta } = require("../../utils/pagination");
const ApiResponse = require("../../utils/ApiResponse");

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const user = req.user;
  const { rows, total } = await candidateSvc.list({
    jobReqId: req.query.jobReqId ? Number(req.query.jobReqId) : undefined,
    status: req.query.status,
    recruiterId: req.query.recruiterId ? Number(req.query.recruiterId) : undefined,
    search: req.query.search,
    roleId: user.roleId,
    recEmpId: user.employeeId,
    limit,
    offset
  });
  new ApiResponse(200, rows, "Candidates fetched", buildMeta({ page, limit, total })).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await candidateSvc.getById(Number(req.params.id));
  new ApiResponse(200, data, "Candidate fetched").send(res);
});

const create = asyncHandler(async (req, res) => {
  const body = { ...req.body };


  if (!body.recruiterId) body.recruiterId = req.user.employeeId;




  const parsedSkills = Array.isArray(body.parsed_skills) ? body.parsed_skills : null;
  const parsedEducation = Array.isArray(body.parsed_education) ? body.parsed_education : null;
  const parsedWorkExp = Array.isArray(body.parsed_work_experience) ? body.parsed_work_experience : null;
  const resumeHash = body.resume_hash || null;
  const linkedinUrl = body.linkedin_url || null;
  const githubUrl = body.github_url || null;
  const noticePeriodDays = body.notice_period_days != null ? Number(body.notice_period_days) : null;
  const companies = Array.isArray(body.companies) ? body.companies : null;
  const currentDesignation = body.current_designation || null;


  delete body.parsed_skills;
  delete body.parsed_education;
  delete body.parsed_work_experience;
  delete body.resume_hash;
  delete body.linkedin_url;
  delete body.github_url;
  delete body.notice_period_days;
  delete body.companies;
  delete body.current_designation;


  let duplicates = [];
  if (body.email || resumeHash) {
    duplicates = await resumeParserSvc.checkDuplicate(body.email, resumeHash);
  }


  const data = await candidateSvc.create(body, req.user.userId, req.ip);

  const candidateId = data?.candidate_id;
  const jobReqId = data?.job_req_id;


  setImmediate(async () => {
    try {

      if (candidateId && jobReqId) {
        await resumeMatchSvc.computeAndStore(candidateId, jobReqId).catch((err) =>
        console.error(`[Candidate] Match score failed for ${candidateId}:`, err.message)
        );
      }


      if (candidateId && (parsedSkills || parsedEducation || parsedWorkExp)) {
        const fakeParseResult = {
          skills: parsedSkills || [],
          education: parsedEducation || [],
          work_experience: parsedWorkExp || [],
          companies: companies || [],
          resumeHash,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          notice_period_days: noticePeriodDays,
          current_role: currentDesignation,
          parsedBy: 'openai',
          rawText: ''
        };

        await resumeParserSvc.persistParsedResume(candidateId, fakeParseResult, {
          originalname: body.resume_path ? body.resume_path.split('/').pop() : 'resume',
          size: 0,
          mimetype: ''
        });
      }
    } catch (err) {
      console.error(`[Candidate] Background tasks failed for candidate ${candidateId}:`, err.message);
    }
  });


  new ApiResponse(201, {
    ...data,
    duplicates: duplicates.length ? duplicates : undefined
  }, duplicates.length ?
  `Candidate created. Warning: ${duplicates.length} possible duplicate(s) found.` :
  "Candidate created"
  ).send(res);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const data = await candidateSvc.updateStatus(Number(req.params.id), status, req.user.userId, req.ip);
  new ApiResponse(200, data, "Candidate status updated").send(res);
});


const getSkills = asyncHandler(async (req, res) => {
  const rows = await callProcedure('sp_rec_get_candidate_skills(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Skills fetched").send(res);
});


const getEducation = asyncHandler(async (req, res) => {
  const rows = await callProcedure('sp_rec_get_candidate_education(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Education fetched").send(res);
});


const getExperience = asyncHandler(async (req, res) => {
  const rows = await callProcedure('sp_rec_get_candidate_experience(?)', [Number(req.params.id)]);
  new ApiResponse(200, rows[0] ?? [], "Experience fetched").send(res);
});


const getParserLogs = asyncHandler(async (req, res) => {
  const candidateId = req.query.candidateId ? Number(req.query.candidateId) : null;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const rows = await callProcedure('sp_rec_get_parser_logs(?, ?)', [candidateId, limit]);
  new ApiResponse(200, rows[0] ?? [], "Parser logs fetched").send(res);
});

module.exports = { list, getOne, create, updateStatus, getSkills, getEducation, getExperience, getParserLogs };
