const { callProcedure } = require("../../utils/db");
const BaseService = require("../base.service");
const AppError = require("../../utils/AppError");

class OnboardingService extends BaseService {
  constructor() {
    super("rec_onboarding", "onboarding_id");
  }

  async list({ status, search, limit = 20, offset = 0 } = {}) {
    const results = await callProcedure("sp_rec_list_onboarding", [status || null, search || null, limit, offset]);
    return { rows: results[0] ?? [], total: (results[1] ?? [])[0]?.total ?? 0 };
  }

  async getById(onboardingId) {
    const results = await callProcedure("sp_rec_get_onboarding", [onboardingId]);
    const row = (results[0] ?? [])[0];
    if (!row) throw new AppError("Onboarding record not found", 404);
    return row;
  }

  async create(data, createdBy, ip) {
    const results = await callProcedure("sp_rec_create_onboarding", [
      data.candidateId,
      data.offerId,
      data.effectiveDate || null,
      createdBy,
      ip,
    ]);
    return (results[0] ?? [])[0];
  }

  async updateTask(onboardingId, taskName, taskValue, updatedBy, ip) {
    const results = await callProcedure("sp_rec_update_onboarding_task", [
      onboardingId,
      taskName,
      taskValue,
      updatedBy,
      ip,
    ]);
    return (results[0] ?? [])[0];
  }

  async finalize(onboardingId, finalizedBy, ip) {
    const results = await callProcedure("sp_rec_finalize_onboarding", [onboardingId, finalizedBy, ip]);
    return (results[0] ?? [])[0];
  }
}

module.exports = new OnboardingService();
