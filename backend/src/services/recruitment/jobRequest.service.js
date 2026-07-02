const { callProcedure, withTransaction } = require("../../utils/db");
const BaseService = require("../base.service");
const AppError = require("../../utils/AppError");

class JobRequestService extends BaseService {
  constructor() {
    super("rec_job_requests", "job_req_id");
  }

  async list({ assignmentStatus, jobStatus, search, roleId, recruiterEmpId, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure("sp_rec_list_job_requests", [
      assignmentStatus || null,
      jobStatus || null,
      search || null,
      roleId || null,
      recruiterEmpId || null,
      limit,
      offset,
    ]);
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(jobReqId) {
    const results = await callProcedure("sp_rec_get_job_request", [jobReqId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new AppError("Job request not found", 404);
    return row;
  }

  async create(data, createdBy, ip) {
    const outParams = { job_req_id: null, job_req_code: null };
    const results = await callProcedure("sp_rec_create_job_request", [
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
      ip,
    ]);
    return (results[0] ?? [])[0];
  }

  async update(jobReqId, data, updatedBy, ip) {
    const results = await callProcedure("sp_rec_update_job_request", [
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
      ip,
    ]);
    return (results[0] ?? [])[0];
  }

  async assignRecruiters(jobReqId, recruiterIds, assignedBy, ip) {
    const results = await callProcedure("sp_rec_assign_recruiters", [
      jobReqId,
      JSON.stringify(recruiterIds),
      assignedBy,
      ip,
    ]);
    return (results[0] ?? [])[0];
  }

  async delete(jobReqId, deletedBy, ip) {
    const results = await callProcedure("sp_rec_delete_job_request", [jobReqId, deletedBy, ip]);
    return (results[0] ?? [])[0];
  }
}

module.exports = new JobRequestService();
