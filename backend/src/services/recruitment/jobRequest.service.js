const { callProcedure } = require("../../config/db");
const BaseService = require("../base.service");
const ApiError = require("../../utils/ApiError");
const notify = require("../mailNotify.service");

class JobRequestService extends BaseService {
  constructor() {
    super("rec_job_requests", "job_req_id");
  }

  async list({ assignmentStatus, jobStatus, search, roleId, recruiterEmpId, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure(
      "sp_rec_list_job_requests(?, ?, ?, ?, ?, ?, ?)",
      [assignmentStatus || null, jobStatus || null, search || null, roleId || null, recruiterEmpId || null, limit, offset]
    );
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(jobReqId) {
    const results = await callProcedure("sp_rec_get_job_request(?)", [jobReqId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new ApiError(404, "Job request not found");
    return row;
  }

  async create(data, createdBy, ip) {
    const results = await callProcedure(
      "sp_rec_create_job_request(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @job_req_id, @job_req_code)",
      [
      data.title,
      data.client,
      data.companyDept,
      data.billRate,
      data.billCurrency || "$",
      data.payRate,
      data.payCurrency || "$",
      data.positionType,
      data.vacancies,
      data.city || null,
      data.country,
      data.experienceLevel,
      data.jobStatus || "Active",
      data.businessUnit,
      data.assignmentStatus || "Open",
      data.opportunityPhone || null,
      data.skillSet,
      data.description,
      createdBy,
      ip]

    );
    return (results[0] ?? [])[0];
  }

  async update(jobReqId, data, updatedBy, ip) {
    const results = await callProcedure(
      "sp_rec_update_job_request(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
      jobReqId,
      data.title || null,
      data.client || null,
      data.companyDept || null,
      data.billRate || null,
      data.billCurrency || null,
      data.payRate || null,
      data.payCurrency || null,
      data.positionType || null,
      data.vacancies || null,
      data.city || null,
      data.country || null,
      data.experienceLevel || null,
      data.jobStatus || null,
      data.businessUnit || null,
      data.assignmentStatus || null,
      data.opportunityPhone || null,
      data.skillSet || null,
      data.description || null,
      updatedBy,
      ip]

    );
    return (results[0] ?? [])[0];
  }


  async _getRecruiterTL(recruiterId) {
    if (!recruiterId) return {};
    const results = await callProcedure('sp_rec_get_recruiter_team_lead(?)', [recruiterId]);
    return (results[0] ?? [])[0] ?? {};
  }

  async assignRecruiters(jobReqId, recruiterIds, assignedBy, ip) {
    const results = await callProcedure(
      "sp_rec_assign_recruiters(?, ?, ?, ?)",
      [jobReqId, JSON.stringify(recruiterIds), assignedBy, ip]
    );
    const result = (results[0] ?? [])[0];


    if (Array.isArray(recruiterIds) && recruiterIds.length) {
      try {
        const job = await this.getById(jobReqId);
        const recruiterResults = await callProcedure(
          "sp_rec_get_recruiter_notification_targets(?)",
          [JSON.stringify(recruiterIds)]
        );
        const recruiters = recruiterResults[0] ?? [];
        const jobInfo = {
          jobTitle: job.title || '',
          jobCode: job.job_req_code || '',
          client: job.client || '',
          vacancies: job.vacancies || 1,
          skillSet: job.skill_set || job.skillSet || ''
        };


        notify.recruiterAssigned(
          recruiters.map((r) => ({ email: r.email, name: r.name, ...jobInfo }))
        );


        const tlSeen = new Set();
        for (const r of recruiters) {
          const tl = await this._getRecruiterTL(r.employee_id || r.recruiter_id || null);
          if (tl.tl_email && !tlSeen.has(tl.tl_email)) {
            tlSeen.add(tl.tl_email);
            notify.tlJobAssigned({
              tlEmail: tl.tl_email,
              tlName: tl.tl_name || 'Team Lead',
              recruiterName: tl.recruiter_name || r.name || 'Recruiter',
              ...jobInfo
            });
          }
        }
      } catch (err) {
        console.warn('[jobRequest] assignment notification failed:', err.message);
      }
    }
    return result;
  }

  async delete(jobReqId, deletedBy, ip) {
    const results = await callProcedure(
      "sp_rec_delete_job_request(?, ?, ?)",
      [jobReqId, deletedBy, ip]
    );
    return (results[0] ?? [])[0];
  }
}

module.exports = new JobRequestService();
